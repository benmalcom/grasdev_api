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
            var queryString = "SELECT * FROM players WHERE id=? LIMIT 1",
                data = [id];
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((row) => {
            var player = row[0][0];
            if (player) {
                req.player = player;
                return next();
            }
            else {
                error = helper.transformToError({code: 404, message: "Player not found!"});
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
    var player = helper.unescapeAvatar(req.player);
    var meta = {code: 200, success: true};
    res.status(meta.code).json(formatResponse.do(meta, player));
};

exports.find = function (req, res, next) {
    var error = {};
    var meta = {success: true, status_code: 200};
    var query = req.query;

    var per_page = query.per_page ? parseInt(query.per_page, "10") : config.get('itemsPerPage.default');
    var page = query.page ? parseInt(query.page, "10") : 1;
    var baseRequestUrl = config.get('app.baseUrl') + config.get('api.prefix') + "/players";
    meta.pagination = {
        per_page: per_page,
        page: page,
        current_page: helper.appendQueryString(baseRequestUrl, "page=" + page)
    };

    var offset = per_page * (page - 1);
    pool.getConnection()
        .then((connection) => {
            var playersQuery = "SELECT * FROM players LIMIT " + offset + ", " + per_page;
            var countQuery = "SELECT COUNT(id) as count_data FROM players";
            var query = Q.all([
                connection.query(playersQuery),
                connection.query(countQuery),

            ]);
            connection.release();
            return query;
        })
        .spread((rows, countRow) => {
            var players = rows[0];
            var count = countRow[0][0].count_data;
            meta.pagination.total_count = count;
            if (count > (per_page * page)) {
                var prev = page - 1;
                meta.pagination.previous = prev;
                meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl, "page=" + prev);
            }
            res.status(meta.status_code).json(formatResponse.do(meta, players));

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
    var player = req.player;
    var obj = req.body;
    _.extend(player, obj);
    var first_name = player.first_name;
    var last_name = player.last_name;
    var team_id = player.team_id;
    var age_group_id = player.age_group_id;
    var middle_name = player.first_name;
    var avatar = player.avatar;
    var mobile = player.mobile;
    var gender = player.gender;
    var height = player.height;
    var weight = player.weight;
    var position = player.position;
    var occupation = player.occupation;
    var rating = player.rating;
    var hero = player.hero;

    pool.getConnection()
        .then((connection) => {
            var data = [first_name, middle_name, last_name, team_id, age_group_id, avatar, mobile, gender, height, weight, position, occupation, rating, hero, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), player.id],
                queryString = 'UPDATE players SET first_name=?,middle_name=?,last_name=?,team_id=?,age_group_id=?,avatar=?,mobile=?,' +
                    'gender=?,height=?,weight=?,position=?,occupation=?,rating=?,hero=?,updated_at=? WHERE id=?';
            console.log("About updating....");
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows){
                meta.message = "Player details updated!";
                res.status(meta.status_code).json(formatResponse.do(meta, player));
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
        first_name: 'required',
        last_name: 'required',
        team_id: 'required',
        age_group_id: 'required'
    };
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        pool.getConnection()
            .then((connection) => {
                var data = [obj.first_name, obj.last_name, obj.team_id, obj.age_group_id],
                    queryString = 'INSERT INTO players(first_name,last_name,team_id,age_group_id) VALUES(?,?,?,?)';
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                var lastId = result.insertId;
                res.redirect('/v1/players/' + lastId);
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
    var player = req.player;
    pool.getConnection()
        .then((connection) => {
            var data = [player.id],
                queryString = 'DELETE from players WHERE id=?';
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows) {
                meta.message = "Player deleted";
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
