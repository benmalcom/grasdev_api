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
            var queryString = "SELECT * FROM teams WHERE id=? LIMIT 1",
                data = [id];
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((row) => {
            var team = row[0][0];
            if (team) {
                req.team = team;
                return next();
            }
            else {
                error = helper.transformToError({code: 404, message: "Team not found!"});
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
    var team = req.team;
    var meta = {code: 200, success: true};
    res.status(meta.code).json(formatResponse.do(meta, helper.processTeamImages(team)));
};

exports.find = function (req, res, next) {
    var error = {};
    var meta = {success: true, status_code: 200};
    var query = req.query;

    var per_page = query.per_page ? parseInt(query.per_page, "10") : config.get('itemsPerPage.default');
    var page = query.page ? parseInt(query.page, "10") : 1;
    var baseRequestUrl = config.get('app.baseUrl') + config.get('api.prefix') + "/teams";
    meta.pagination = {
        per_page: per_page,
        page: page,
        current_page: helper.appendQueryString(baseRequestUrl, "page=" + page)
    };

    var offset = per_page * (page - 1);
    pool.getConnection()
        .then((connection) => {
            var teamsQuery = "SELECT * FROM teams LIMIT " + offset + ", " + per_page;
            var countQuery = "SELECT COUNT(id) as count_data FROM teams";
            var query = Q.all([
                connection.query(teamsQuery),
                connection.query(countQuery)
            ]);
            connection.release();
            return query;
        })
        .spread((rows, countRow) => {
            var teams = rows[0];
            var count = countRow[0][0].count_data;
            meta.pagination.total_count = count;
            if (count > (per_page * page)) {
                var prev = page - 1;
                meta.pagination.previous = prev;
                meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl, "page=" + prev);
            }
            res.status(meta.status_code).json(formatResponse.do(meta, helper.processTeamImages(teams)));

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
    var team = req.team;
    var obj = req.body;
    _.extend(team, obj);
    pool.getConnection()
        .then((connection) => {
           var data =  [team.name, team.description, team.league_id, team.age_group_id, team.association_id, team.state_id, team.lga_id, team.practice_time, team.year_founded, team.arena,
                team.city,team.coach,team.coach_mobile,team.unique_id,team.images,team.gps,dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), team.id],
                queryString = `UPDATE teams SET name=?,description=?,league_id=?,age_group_id=?,association_id=?,state_id=?,lga_id=?, practice_time=?, year_founded=?,arena=?,
                city=?,coach=?,coach_mobile=?,unique_id=?,images=?,gps=?,updated_at=? WHERE id=?`;
            console.log("About updating....");
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows){
                meta.message = "Team details updated!";
                res.status(meta.status_code).json(formatResponse.do(meta, team));
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
        name: 'required',
        description: 'required',
        league_id: 'required|numeric|min:1',
        age_group_id: 'required|numeric|min:1',
        association_id: 'required|numeric|min:1',
        state_id: 'required|numeric|min:1',
        lga_id: 'required|numeric|min:1',
        practice_time: 'required',
        year_founded: 'required',
        arena: 'required',
        city: 'required',
        coach: 'required',
        coach_mobile: 'required',
        unique_id: 'required'
    };
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        obj.images = obj.media ? obj.media : "";
        var gps = obj.gps ?  obj.gps : "";
        pool.getConnection()
            .then((connection) => {
                var data = [obj.name, obj.description, obj.league_id, obj.age_group_id, obj.association_id, obj.state_id, obj.lga_id, obj.practice_time, obj.year_founded, obj.arena,
                             obj.city,obj.coach,obj.coach_mobile,obj.unique_id,obj.images,obj.gps],
                    queryString = `REPLACE INTO teams
                                  (name,description,league_id,age_group_id,association_id,state_id,lga_id,practice_time,year_founded,arena,city,coach,coach_mobile,unique_id,images,gps)
                                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                var lastId = result.insertId;
                res.redirect('/v1/teams/' + lastId);
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
    var team = req.team;
    pool.getConnection()
        .then((connection) => {
            var data = [team.id],
                queryString = 'DELETE from teams WHERE id=?';
            var query = connection.query(queryString, data);
            connection.release();
            return query;
        })
        .then((result) => {
            result = result[0];
            if (result.affectedRows) {
                meta.message = "Team deleted";
                res.status(meta.status_code).json(formatResponse.do(meta));
            }
            else {
                error = helper.transformToError({code: 503, message: "Error deleting team, please try again!"});
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
