/**
 * Created by Malcom on 10/3/2015.
 */
var ValidatorJs = require('validatorjs');
var _ = require('underscore');
var dateFormat = require('dateformat');
var config = require('config');
var Q = require('q');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');
var pool = require('../../others/db/mysql_connection');

exports.param = function (req, res, next, id) {
    var error = {};
    pool.getConnection()
        .then((connection) => {
            var queryString = "SELECT * FROM users WHERE id=? LIMIT 1",
                data = [id];
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((row) => {
            var user = row[0][0];
            if (user) {
                req.user = user;
                return next();
            }
            else {
                error = helper.transformToError({code: 404, message: "User not found!"});
                return next(error);
            }

        }).catch((err) => {
        console.log("err ", err);
        error = helper.transformToError({
            code: 503,
            message: "Error in server interaction, please try again",
            extra: err
        });
        return next(error);
    });


};
exports.findOne = function (req, res, next) {
    var user = helper.unescapeAvatar(req.user);
    var meta = {code: 200, success: true};
    res.status(meta.code).json(formatResponse.do(meta, user));
};

exports.find = function (req, res, next) {
    var error = {};
    var meta = {success: true, status_code: 200};
    var query = req.query;

    var per_page = query.per_page ? parseInt(query.per_page, "10") : config.get('itemsPerPage.default');
    var page = query.page ? parseInt(query.page, "10") : 1;
    var baseRequestUrl = config.get('app.baseUrl') + config.get('api.prefix') + "/users";
    meta.pagination = {
        per_page: per_page,
        page: page,
        current_page: helper.appendQueryString(baseRequestUrl, "page=" + page)
    };

    var offset = per_page * (page - 1);
    pool.getConnection()
        .then((connection) => {
            var usersQuery = "SELECT * FROM users LIMIT " + offset + ", " + per_page;
            var countQuery = "SELECT COUNT(id) as count_data FROM users";
            var query = Q.all([
                connection.query(usersQuery),
                connection.query(countQuery),

            ]);
            connection.release();
            return query;
        })
        .spread((rows, countRow) => {
            var users = rows[0];
            var count = countRow[0][0].count_data;
            meta.pagination.total_count = count;
            if (count > (per_page * page)) {
                var prev = page - 1;
                meta.pagination.previous = prev;
                meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl, "page=" + prev);
            }
            res.status(meta.status_code).json(formatResponse.do(meta, users));

        }).catch((err) => {
        console.log("err ", err);
        error = helper.transformToError({
            code: 503,
            message: "Error in server interaction, please try again",
            extra: err
        });
        return next(error);
    });

};


exports.update = function (req, res, next) {
    var error = {};
    var meta = {success: true, status_code: 200};
    var user = req.user;
    var obj = req.body;
    _.extend(user, obj);
    pool.getConnection()
        .then((connection) => {
            var data = [user.first_name,user.last_name,user.mobile,user.avatar,user.gender,dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),user.id],
                queryString = 'UPDATE users SET first_name=?,last_name=?,mobile=?,avatar=?,gender=?,updated_at=? WHERE id=?';

            console.log("About updating....");
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows){
                meta.message = "User details updated!";
                res.status(meta.status_code).json(formatResponse.do(meta, user));
            }
            else {
                error = helper.transformToError({code: 500, message: "No update operation was performed"});
                return next(error);
            }
        }).catch((err) => {
        console.log("err ", err);
        error = helper.transformToError({
            code: 503,
            message: "Error in server interaction, please try again",
            extra: err
        });
        return next(error);
    });
};

exports.create = function (req, res, next) {
    var meta = {success: true, status_code: 200};
    var obj = req.body,
        error = {};
    var rules = {
        first_name: 'required',
        last_name: 'required',
        email : 'required|email',
        gender: 'required',
        mobile : 'required'
    };
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        pool.getConnection()
            .then((connection) => {
                var data = [obj.first_name,obj.last_name,obj.email,obj.mobile,obj.avatar,obj.gender],
                    queryString = 'INSERT INTO users(first_name,last_name,email,mobile,avatar,gender) VALUES(?,?,?,?,?,?)';

                var query = connection.query(queryString, data);
                connection.release();
                return [query,connection];
            })
            .spread((result,connection) => {
                result = result[0];
                var userId = result.insertId;
                var data = [userId],
                    queryString = 'SELECT * FROM users WHERE id = ? LIMIT 1';
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then(function (result) {
                var user = result[0][0];
                if (user) {
                    user.token = helper.signToken(user);
                    res.status(meta.status_code).json(formatResponse.do(meta,user));
                }
            })
            .catch((err) => {
                console.log("err ", err);
                error = helper.transformToError({
                    code: 503,
                    message: "Error in server interaction, please try again",
                    extra: err
                });
                return next(error);
        });
    }
    else {
        error = helper.transformToError({
            code: 400, message: "There are problems with your input",
            messages: helper.validationErrorsToArray(validator.errors.all())
        });
        return next(error);
    }

};

exports.delete = function (req, res, next) {
    var error = {};
    var meta = {success: true, status_code: 200};
    var user = req.user;
    pool.getConnection()
        .then((connection) => {
            var data = [user.id],
                queryString = 'DELETE from users WHERE id=?';
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows) {
                meta.message = "User deleted";
                res.status(meta.status_code).json(formatResponse.do(meta));
            }
            else {
                error = helper.transformToError({code: 503, message: "Error deleting player, please try again!"});
                return next(error);
            }
        }).catch((err) => {
        console.log("err ", err);
        error = helper.transformToError({
            code: 503,
            message: "Error in server interaction, please try again",
            extra: err
        });
        return next(error);
    });

};

exports.getUserByMobile = function (req,res,next) {
    console.log("query");

    var error = {};
    var meta = {success: true, status_code: 200};
    pool.getConnection()
        .then((connection) => {
            var queryString = "SELECT * FROM users WHERE mobile=? LIMIT 1",
                data = [req.params.mobile];
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((row) => {
        console.log("row ",row);
            var user = row[0][0];
            if (user) {
                user.token = helper.signToken(user);
                res.status(meta.status_code).json(formatResponse.do(meta,user));
            }
            else {
                error = helper.transformToError({code: 404, message: "User not found!"});
                return next(error);
            }

        }).catch((err) => {
        console.log("err ", err);
        error = helper.transformToError({
            code: 503,
            message: "Error in server interaction, please try again",
            extra: err
        });
        return next(error);
    });


};