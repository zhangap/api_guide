var mySql = require("mysql");
var path = require("path");

var config = require(path.resolve("./config/config"));

function init(){
    var connection = mySql.createConnection({
        host:config.db.host,
        user:config.db.user,
        password:config.db.password,
        port:config.db.port,
        database:config.db.database
    });
    return connection;
}

exports.init = init;