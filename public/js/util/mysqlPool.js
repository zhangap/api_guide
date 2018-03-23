var mysql = require("mysql");
var path = require("path");
var config = require(path.resolve("./config/config"));

/**
 * 创建连接池
 * @type {Pool}
 */
var pool = mysql.createPool({
    host:config.db.host,
    user:config.db.user,
    password:config.db.password,
    port:config.db.port,
    database:config.db.database
});

/**
 *查询方法
 * @param sql
 * @param options
 * @param callback
 */
var query = function(sql,options,callback){
    if(arguments.length === 2 && typeof options ==="function"){
        callback = options;
        options = [];
    }
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,options,function(err,results,fields){
                //释放连接
                conn.release();
                callback(err,results,fields);
            });
        }
    });
};

module.exports = query;