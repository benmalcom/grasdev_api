/**
 * Created by Ekaruztech on 7/18/2016.
 */
var config = require('config'),
    _ = require('underscore');

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

exports.processTeamImages = function (data) {

    if(Array.isArray(data) && data.length)
    {
        data = data.map(function (item) {
            return processOneTeamImages(item);
        })
    }
    else
    {
        data = processOneTeamImages(data);
    }

    return data;

};
function processOneTeamImages(data) {

    if (data && data.images)
    {
        data.images = data.images.split("|").map(function (image) {
            return _.unescape(image.trim());
        });
    }

    return data;
}
