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
            var queryString = `SELECT a.id, a.first_name, a.middle_name, a.last_name,a.occupation, a.gender, a.avatar, a.mobile, a.rating, 
            a.hero,a.position, a.weight, a.height, a.created_at, a.updated_at, b.name as team, c.name as age_group FROM players a
            INNER JOIN teams b ON a.team_id = b.id
            INNER JOIN age_groups c ON a.age_group_id = c.id
            WHERE a.id = ? LIMIT 1`;
            var data = [id];
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
    var filterQuery = "";
    if(query.team_id)
    {
        filterQuery += " WHERE team_id = "+parseInt(query.team_id,"10");
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"team_id="+query.team_id);
    }
    meta.pagination = {
        per_page: per_page,
        page: page,
        current_page: helper.appendQueryString(baseRequestUrl, "page=" + page)
    };

    var offset = per_page * (page - 1);
    pool.getConnection()
        .then((connection) => {
            var playersQuery = `SELECT a.id, a.first_name, a.middle_name, a.last_name,a.occupation, a.gender, a.avatar, a.mobile, a.rating,
                a.hero,a.position, a.weight, a.height, a.created_at, a.updated_at, b.name as team, c.name as age_group FROM players a
                INNER JOIN teams b ON a.team_id = b.id
                INNER JOIN age_groups c ON a.age_group_id = c.id`+filterQuery+` LIMIT ?,? `;
            var countQuery = "SELECT COUNT(id) as count_data FROM players"+filterQuery;
            console.log("query string ",playersQuery);
            var query = Q.all([
                connection.query(playersQuery,[offset,per_page]),
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
    pool.getConnection()
        .then((connection) => {
            var data = [player.first_name, player.middle_name, player.last_name, player.team_id, player.age_group_id, player.avatar, player.mobile, player.gender,
                    player.height, player.weight, player.position, player.occupation, player.rating, player.hero, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), player.id],
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
        age_group_id: 'required',
        middle_name: 'required',
        avatar: 'required',
        mobile: 'required',
        gender: 'required',
        height: 'required',
        weight: 'required',
        position: 'required',
        occupation: 'required',
        rating: 'required',
        hero: 'required'

};
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        pool.getConnection()
            .then((connection) => {
                var data = [obj.first_name,obj.middle_name, obj.last_name, obj.team_id, obj.age_group_id, obj.avatar, obj.mobile, obj.gender,
                        obj.height, obj.weight, obj.position, obj.occupation, obj.rating, obj.hero],
                    queryString = 'INSERT INTO players(first_name,middle_name,last_name,team_id,age_group_id,avatar,mobile,gender,height,weight,position,occupation,rating,hero) ' +
                        'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
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
