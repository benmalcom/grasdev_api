/**
 * Created by Richard on 10/8/2015.
 */
var pool = require('../others/db/mysql_connection');
var helper = require('../utils/helper');

module.exports = function(req,res,next){
      if(["put","post"].indexOf(req.method.toLowerCase()) == -1) return next();
      var error = {};
      if(req.body.api_id && req.body.api_key)
      {
          var api_id = helper.sanitize(req.body.api_id),
              api_key = helper.sanitize(req.body.api_key);
          pool.getConnection().then(function(connection){
              var query = "SELECT * FROM api_keys WHERE api_id=? AND api_key=? LIMIT 1",
                  data = [api_id,api_key];
              connection.query(query,data)
                  .then(function(rows){
                      var row = rows[0];
                      if(row) {
                          /*delete req.body.api_id;
                          delete req.body.api_key;*/
                          return next();
                      }
                      else {
                          error =  helper.transformToError({code:401,message:"Invalid api id and key supplied!"});
                          return next(error);
                      }

                  },function(err){
                      console.log("err ",err);
                      error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                      return next(error);
                  })
                  .finally(function() {
                      if (connection){
                          pool.releaseConnection(connection);
                          console.log("Connection released!");
                      }
                  });
          },function(err){
              error = helper.transformToError({
                  code: 400,
                  message: "Problem connecting to database",
                  extra: err
              });
              return next(error);
          });

      }
       else
      {
          var errorObj = helper.transformToError({code:401,message:"You are not authorized to perform this operation!"});
          return next(errorObj);
      }
};