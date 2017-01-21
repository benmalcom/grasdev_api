/**
 * Created by Ekaruztech on 7/18/2016.
 */
var _ = require('underscore');
var sanitizer = require('sanitize-html');


module.exports = function(req, res, next) {
    if(req.body && !_.isEmpty(req.body))
    {
        console.info("Sanitizing req.body!");
        _.each(req.body, function(value, key) {
            if(!parseInt(value,10) && value !== null) {
                if(typeof value === 'string') {
                    value = value.replace(/&gt;/gi, '>');
                    value = value.replace(/&lt;/gi, '<');
                    value = value.replace(/(&copy;|&quot;|&amp;)/gi, '');
                }
                req.body[key] = sanitizer(value, {
                    allowedTags: []
                });
            }
        });
    }

    if(req.query && !_.isEmpty(req.query))
    {
        console.info("Sanitizing req.query!");
        _.each(req.query, function(value, key) {
            if(!parseInt(value,10) && value !== null) {
                if(typeof value === 'string') {
                    value = value.replace(/&gt;/gi, '>');
                    value = value.replace(/&lt;/gi, '<');
                    value = value.replace(/(&copy;|&quot;|&amp;)/gi, '');
                }
                req.query[key] = sanitizer(value, {
                    allowedTags: []
                });
            }
        });
    }

    if(req.params && !_.isEmpty(req.params))
    {
        console.info("Sanitizing req.params!");
        var params = req.params;
        _.each(req.params, function(value, key) {
            if(!parseInt(value,10) && value !== null) {
                if(typeof value === 'string') {
                    value = value.replace(/&gt;/gi, '>');
                    value = value.replace(/&lt;/gi, '<');
                    value = value.replace(/(&copy;|&quot;|&amp;)/gi, '');
                }
                req.params[key] = sanitizer(value, {
                    allowedTags: []
                });
            }
        });
    }

    next();
};