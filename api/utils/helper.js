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

exports.processReport = function (data) {
    var result = null;

    if(Array.isArray(data))
    {
        result = data.map(function (item) {
            console.log("item ",item);
            return processOneReport(item);
        })
    }
    else
    {
        result = processOneReport(data);
    }

    return result;

};

exports.processComment = function (data) {
    var result = null;
    if(Array.isArray(data))
    {
        result = data.map(function (item) {
            return processOneComment(item);
        });
    }
    else
    {
        result = processOneComment(data);
    }

    return result;
};
exports.processUpdate = function (data) {
    var result = null;
    if(Array.isArray(data))
    {
        result = data.map(function (item) {
            return processOneUpdate(item);
        });
    }
    else
    {
        result = processOneUpdate(data);
    }

    return result;
};
exports.processFollower = function (data) {
    var result = null;
    if(Array.isArray(data))
    {
        result = data.map(function (item) {
            return processOneFollower(item);
        });
    }
    else
    {
        result = processOneFollower(data);
    }

    return result;
};
function processOneReport(data) {
    var result = _.pick(data,'report_id','title','address','lga','report_state','country','description','mobile_user_id',
        'followed','followers', 'gps','sector','voted','votes','comments','created_at','updated_at');
    result.user = _.pick(data,'mobile_user_id','first_name','last_name','avatar');

    if (data.images)
    {
        result.images = data.images.split("|").map(function (image) {
            return _.unescape(image.trim());
        });
    }

    return result;
}
function processOneComment(data) {
    var result = _.pick(data,'report_comment_id','report_id','comment_body','mobile_user_id','created_at','updated_at');
    result.user = _.pick(data,'mobile_user_id','first_name','last_name','avatar');
    return result;
}
function processOneFollower(data) {
    var result = _.pick(data,'report_follower_id','report_id','mobile_user_id','created_at','updated_at');
    result.user = _.pick(data,'mobile_user_id','first_name','last_name','avatar');
    return result;
}
function processOneUpdate(data) {
    var result = _.pick(data,'report_update_id','update_body','report_id','mobile_user_id','created_at','updated_at');
    result.user = _.pick(data,'mobile_user_id','first_name','last_name','avatar');
    return result;
}

