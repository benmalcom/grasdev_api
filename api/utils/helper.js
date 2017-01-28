/**
 * Created by Ekaruztech on 7/18/2016.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var config = require('config');
exports.signToken = function (obj) {
    var token = jwt.sign(obj, config.get('authToken.superSecret'), {expiresIn: config.get('authToken.expiresIn')}); // expires in 24 hours
    return token;
};

exports.validationErrorsToArray = function (error) {
    var errorsArray = [];
    if(!_.isEmpty(error))
    {
        for(var prop in error)
        {
            if(error.hasOwnProperty(prop))
            {
                _.forEach(error[prop],function (errorMessage) {
                    errorsArray.push(errorMessage);
                });
            }
        }
    }

    return errorsArray;
};
exports.transformToError = function (obj) {
    var err = new Error();
    if(obj.hasOwnProperty('message') &&  obj.message)
        err.message = obj.message;
    if(obj.hasOwnProperty('code') && obj.code)
        err.code = obj.code;
    if(obj.hasOwnProperty('messages') && obj.messages)
        err.messages = obj.messages;
    if(obj.hasOwnProperty('extra') && obj.extra)
        err.extra = obj.extra;
    return err;
};

exports.appendQueryString = function (url,queryString) {
        if (queryString) {
            var isQuestionMarkPresent = url && url.indexOf('?') !== -1,
                separator = isQuestionMarkPresent ? '&' : '?';
            url += separator + queryString;
        }
        return url;
};

exports.unescapeAvatar = function (input) {
    if(_.isObject(input))
    {
        input.avatar = _.unescape(input.avatar+"")
    }
    else
    {
         input = input.map(function (user) {
            user.avatar = _.unescape(user.avatar+"");
            return user;
        });
    }


    return input;
};

exports.convertToInt = function (value) {
    var result = parseInt(value,"10");
    return typeof result == "number" ? result : '';
};

exports.sanitize = function (str) {
    return   str  ?   str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;').replace(/\`/g, '&#96;') : null;
};

exports.processTeams = function (data) {

    if(Array.isArray(data) && data.length)
    {
        data = data.map(function (item) {
            return processOneTeam(item);
        })
    }
    else
    {
        data = processOneTeam(data);
    }

    return data;

};
function processOneTeam(data) {

    if(data && _.isObject(data) && !_.isEmpty(data)){

        var result = _.pick(data,'id','name','arena','lga','state','description','user_id','league','coach','coach_mobile','practice_time','year_founded',
            'followed','followers', 'gps','team_type','age_group','association','voted','votes','comments','created_at','updated_at');
        result.user = _.pick(data,'id','first_name','last_name','avatar');
        if (data && data.images)
        {
            result.images = data.images.split("|").map(function (image) {
                return _.unescape(image.trim());
            });
        }
        return result;
    }

    return data;
}
