/**
 * Created by Malcom on 6/14/2016.
 */
var helper = require('../utils/helper');
var config = require('config');
var prefixVersion = "/v"+config.get('api.versions').pop();

module.exports = function (app) {
    app.use(prefixVersion,require('./player'));
    app.use(prefixVersion,require('./state'));
    app.use(prefixVersion,require('./team-type'));
    app.use(prefixVersion,require('./association'));
    app.use(prefixVersion,require('./team'));
    app.use(prefixVersion,require('./age-group'));
    app.use(prefixVersion,require('./league'));
    app.use(prefixVersion,require('./user'));
//Catch all route
    app.get('*', function(req, res, next) {
        var errorObj = helper.transformToError({code:404,message:"Resource not found!"});
        return next(errorObj);
    });
};
