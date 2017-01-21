/**
 * Created by Ekaruztech on 7/18/2016.
 */

exports.do =  function(meta,data) {
        var response  = {};
        if(meta.code) {
            meta.status_code = meta.code;
            delete meta.code;
        }
        response._meta = meta;
        if(data) {
            response.data = data;
        }
        return response;
};