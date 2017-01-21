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
            var queryString = "SELECT * FROM states WHERE id=? LIMIT 1",
                data = [id];
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((row) => {
            var state = row[0][0];
            if (state) {
                req.state = state;
                return next();
            }
            else {
                error = helper.transformToError({code: 404, message: "State not found!"});
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
    var state = req.state;
    var meta = {code: 200, success: true};
    res.status(meta.code).json(formatResponse.do(meta, state));
};

exports.find = function (req, res, next) {
    var error = {};
    var meta = {success: true, status_code: 200};
    var query = req.query;

    var per_page = query.per_page ? parseInt(query.per_page, "10") : config.get('itemsPerPage.default');
    var page = query.page ? parseInt(query.page, "10") : 1;
    var baseRequestUrl = config.get('app.baseUrl') + config.get('api.prefix') + "/states";
    meta.pagination = {
        per_page: per_page,
        page: page,
        current_page: helper.appendQueryString(baseRequestUrl, "page=" + page)
    };

    var offset = per_page * (page - 1);
    pool.getConnection()
        .then((connection) => {
            var stateQuery = "SELECT * FROM states LIMIT " + offset + ", " + per_page;
            var countQuery = "SELECT COUNT(id) as count_data FROM states";
            var query = Q.all([
                connection.query(stateQuery),
                connection.query(countQuery),

            ]);
            connection.release();
            return query;
        })
        .spread((rows, countRow) => {
            var states = rows[0];
            var count = countRow[0][0].count_data;
            meta.pagination.total_count = count;
            if (count > (per_page * page)) {
                var prev = page - 1;
                meta.pagination.previous = prev;
                meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl, "page=" + prev);
            }
            res.status(meta.status_code).json(formatResponse.do(meta, states));

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
    var state = req.state;
    var obj = req.body;
    _.extend(state, obj);

    pool.getConnection()
        .then((connection) => {
            var data = [state.name, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), state.id],
                queryString = 'UPDATE states SET name=?,updated_at=? WHERE id=?';
            console.log("About updating....");
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows){
                meta.message = "State details updated!";
                res.status(meta.status_code).json(formatResponse.do(meta, state));
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
    var obj = req.body,
        error = {};
    var rules = {
        name: 'required'
    };
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        pool.getConnection()
            .then((connection) => {
                var data = [obj.name],
                    queryString = 'INSERT INTO states(name) VALUES(?)';
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                var lastId = result.insertId;
                res.redirect('/v1/states/' + lastId);
            }).catch((err) => {
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
    var state = req.state;
    pool.getConnection()
        .then((connection) => {
            var data = [state.id],
                queryString = 'DELETE from states WHERE id=?';
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows) {
                meta.message = "State deleted";
                res.status(meta.status_code).json(formatResponse.do(meta));
            }
            else {
                error = helper.transformToError({code: 503, message: "Error deleting age group, please try again!"});
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
