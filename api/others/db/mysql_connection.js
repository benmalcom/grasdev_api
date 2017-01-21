/**
 * Created by Richard on 10/4/2016.
 */

var mysql = require('mysql2/promise');
var config = require('config');

var q = require('q').promise;
var pool = mysql.createPool({
    host: config.get('db.mysql.host'),
    user: config.get('db.mysql.username'),
    password: config.get('db.mysql.password'),
    database: config.get('db.mysql.database'),
    connectionLimit : 1000,
    Promise: q
});

module.exports = pool;