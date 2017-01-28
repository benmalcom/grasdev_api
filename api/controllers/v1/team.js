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
    var userId = req.userId;
    pool.getConnection()
        .then((connection) => {
            var queryString = `SELECT 
                 (SELECT  COUNT(team_id) FROM comments WHERE team_id=a.id) AS comments,
                 (SELECT COUNT(team_id) FROM votes WHERE team_id=a.id) AS votes,
                 (SELECT COUNT(team_id) FROM followers WHERE team_id=a.id) AS followers,
                 
                 CASE ISNULL((SELECT id FROM votes  WHERE team_id = a.id AND user_id = ? LIMIT 1)) 
                 WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,
                 CASE ISNULL((SELECT id FROM followers  WHERE team_id = a.id AND user_id = ? LIMIT 1)) 
                 WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, 
                 a.id, a.name, a.description, a.images,a.coach, a.coach_mobile,a.practice_time,a.year_founded,a.arena,
                 a.city,a.gps,a.created_at, a.updated_at, b.id, b.first_name,b.last_name, b.avatar, c.name as team_type,
                 d.name as state, e.name as lga, f.name as association, g.name as age_group, h.name as league FROM teams a 
                 JOIN users b ON a.user_id = b.id 
                 INNER JOIN team_types c ON a.team_type_id = c.id
                 INNER JOIN states d ON a.state_id = d.id 
                 INNER JOIN lgas e ON a.lga_id = e.id 
                 INNER JOIN associations f ON a.association_id = f.id 
                 INNER JOIN age_groups g ON a.age_group_id = g.id 
                 INNER JOIN leagues h ON a.league_id = h.id 
                 WHERE a.id = ?`;
            var data = [userId,userId,id];

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
    res.status(meta.code).json(formatResponse.do(meta, helper.processTeams(team)));
};
exports.find = function (req, res, next) {
    var userId = req.userId;
    var error = {};
    var meta = {success: true, status_code: 200};
    var query = req.query;
    var filterQuery = "";

    var per_page = query.per_page ? parseInt(query.per_page, "10") : config.get('itemsPerPage.default');
    var page = query.page ? parseInt(query.page, "10") : 1;
    var baseRequestUrl = config.get('app.baseUrl') + config.get('api.prefix') + "/teams";
    meta.pagination = {
        per_page: per_page,
        page: page,
        current_page: helper.appendQueryString(baseRequestUrl, "page=" + page)
    };

    if(query.team_type_id)
    {
        filterQuery += " AND a.team_type_id = "+query.team_type_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"team_type_id="+query.team_type_id);
    }
    if(query.state_id)
    {
        filterQuery += " AND a.state_id = "+query.state_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"state_id="+query.state_id);
    }
    if(query.lga_id)
    {
        filterQuery += " AND a.lga_id = "+query.lga_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"lga_id="+query.lga_id);
    }
    if(query.user_id)
    {
        filterQuery += " AND a.user_id = `+query.user_id";
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"user_id="+query.user_id);
    }

    if(query.age_group_id)
    {
        filterQuery += " AND a.age_group_id = "+query.age_group_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"age_group_id="+query.age_group_id);
    }

    if(query.league_id)
    {
        filterQuery += " AND a.league_id = "+query.league_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"league_id="+query.league_id);
    }



    var offset = per_page * (page - 1);
    pool.getConnection()
        .then((connection) => {
            var q1 = `SELECT
                  (SELECT  COUNT(team_id) FROM comments WHERE team_id=a.id) AS comments,
                  (SELECT COUNT(team_id) FROM votes WHERE team_id=a.id) AS votes,
                  (SELECT COUNT(team_id) FROM followers WHERE team_id=a.id) AS followers,
                 
                  CASE ISNULL((SELECT id FROM votes  WHERE team_id = a.id AND user_id=? LIMIT 1))
                  WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,
                  CASE ISNULL((SELECT id FROM followers  WHERE team_id = a.id AND user_id=? LIMIT 1))
                  WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed,
                  a.id, a.name, a.description, a.images,a.coach, a.coach_mobile,a.practice_time,a.year_founded,a.arena,
                  a.city,a.gps,a.user_id,a.league_id,a.created_at, a.updated_at, b.id, b.first_name,b.last_name, b.avatar, c.name as team_type,
                  d.name as state, e.name as lga, f.name as association, g.name as age_group, h.name as league FROM teams a
                  JOIN users b ON a.user_id = b.id
                  INNER JOIN team_types c ON a.team_type_id = c.id
                  INNER JOIN states d ON a.state_id = d.id
                  INNER JOIN lgas e ON a.lga_id = e.id
                  INNER JOIN associations f ON a.association_id = f.id
                  INNER JOIN age_groups g ON a.age_group_id = g.id
                  INNER JOIN leagues h ON a.league_id = h.id
                  WHERE a.active = ?`+filterQuery+` ORDER BY a.created_at LIMIT ?,?`;
            var teamData = [userId,userId,1,offset,per_page];

            var q2 = `SELECT COUNT(id) as count_data FROM teams a WHERE active = ?`+filterQuery;
            var query = Q.all([
                connection.query(q1,teamData),
                connection.query(q2,[1])
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
            res.status(meta.status_code).json(formatResponse.do(meta, helper.processTeams(teams)));

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
           var data =  [team.name, team.description, team.league_id, team.age_group_id, team.association_id,team.team_type_id,team.state_id, team.lga_id, team.practice_time, team.year_founded, team.arena,
                team.city,team.coach,team.coach_mobile,team.unique_id,team.images,team.gps,dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), team.id],
                queryString = `UPDATE teams SET name=?,description=?,league_id=?,age_group_id=?,association_id=?,team_type_id,state_id=?,lga_id=?, practice_time=?, year_founded=?,arena=?,
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
        team_type_id: 'required|numeric|min:1',
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
        var userId = req.userId;
        obj.images = obj.media ? obj.media : "";
        var gps = obj.gps ?  obj.gps : "";
        pool.getConnection()
            .then((connection) => {
                var data = [obj.name, obj.description, obj.league_id, obj.age_group_id, obj.association_id,obj.team_type_id, obj.state_id, obj.lga_id, obj.practice_time, obj.year_founded, obj.arena,
                             obj.city,obj.coach,obj.coach_mobile,obj.unique_id,obj.images,obj.gps,userId],
                    queryString = `REPLACE INTO teams
                                  (name,description,league_id,age_group_id,association_id,team_type_id,state_id,lga_id,practice_time,year_founded,arena,city,coach,coach_mobile,unique_id,images,gps,user_id)
                                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                console.log("result ",result);
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
exports.vote = function (req, res, next) {
    var meta = {code:200,success:true};
    var obj = req.body,
        error = {};
    var rules = { tag: 'required'};
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        var userId = req.userId;
        var tagCondition = obj.tag.toLowerCase() == "upvote";
        pool.getConnection()
            .then((connection) => {
                var queryString = tagCondition ? 'INSERT INTO votes(user_id,team_id,voted) VALUES(?,?,?)'
                    : 'DELETE FROM votes WHERE team_id = ? AND user_id = ?';
                var data = tagCondition ?  [userId,req.team.id,1]
                    : [parseInt(req.team.id,"10"),parseInt(userId,"10")];
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                meta.message = tagCondition ? "Team upvoted" : "Team unvoted";
                res.status(meta.code).json(formatResponse.do(meta));
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
exports.follow = function (req, res, next) {
    var meta = {code:200,success:true};
    var obj = req.body,
        error = {};
    var rules = { tag: 'required'};
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        var userId = req.userId;
        var tagCondition = obj.tag.toLowerCase() == "follow";
        pool.getConnection()
            .then((connection) => {
                var queryString = tagCondition ? 'INSERT INTO followers(user_id,team_id,followed) VALUES(?,?,?)'
                    : 'DELETE FROM followers WHERE team_id = ? AND user_id = ?';
                var data = tagCondition ?  [userId,req.team.id,1]
                    : [parseInt(req.team.id,"10"),parseInt(userId,"10")];
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                meta.message = tagCondition ? "Now following" : "Unfollowed";
                res.status(meta.code).json(formatResponse.do(meta));
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
exports.comment = function (req, res, next) {
    var meta = {code:200,success:true};
    var obj = req.body,
        error = {};
    var rules = {comment_body: 'required'};
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        var userId = req.userId;
        pool.getConnection()
            .then((connection) => {
                var data = [obj.comment_body,userId,req.team.id],
                    queryString = 'INSERT INTO comments(comment_body,user_id,team_id) VALUES(?,?,?)';
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                meta.message = "You posted a comment!";
                res.status(meta.code).json(formatResponse.do(meta));
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
exports.teamUpdate = function (req, res, next) {
    var meta = {code:200,success:true};
    var obj = req.body,
        error = {};
    var rules = {update_body: 'required'};
    var validator = new ValidatorJs(obj, rules);
    if (validator.passes()) {
        var userId = req.userId;
        pool.getConnection()
            .then((connection) => {
                var data = [obj.comment_body,userId,req.team.id],
                    queryString = 'INSERT INTO updates(update_body,user_id,team_id) VALUES(?,?,?)';
                var query = connection.query(queryString, data);
                connection.release();
                return query;
            })
            .then((result) => {
                result = result[0];
                meta.message = "You posted an update!";
                res.status(meta.code).json(formatResponse.do(meta));
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