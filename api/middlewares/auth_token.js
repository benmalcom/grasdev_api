/**
 * Created by Ekaruztech on 7/18/2016.
 */
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('config');
var formatResponse = require('../utils/format-response');
module.exports = function(req, res, next) {
    var excludedUrls = ['/v1/users/verify/mobile/:mobile','/v1/users'];

   // if (req.method.toLowerCase() == "get") return next();
    if (excludedUrls.indexOf(req.originalUrl) > -1) return next();

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    var meta = {code:401, success:false};
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.get('authToken.superSecret'), function(err, decoded) {
            console.log('Verifying token!');
            if (err) {
                var message = "";
                if(err.name) {
                    switch (err.name) {
                        case "TokenExpiredError":
                            message = "You are not logged in!"; break;
                        default:
                            message = "Failed to authenticate token";break;
                    }
                }
                meta.error = {code:401, message:message,extra:err};
                return res.status(meta.code).json(formatResponse.do(meta));
            } else {
                console.log('Token verified!');
                // if everything is good, save to request for use in other routes
                req.userId = decoded.id;
                return next();
            }
        });

    } else {
        console.log('No token supplied!');
        // if there is no token, return an error
        meta.error = {code:401, message:"No authorization token provided"};
        return res.status(meta.code).json(formatResponse.do(meta));
    }
};
