var path = require("path");
var query = require(path.resolve("./public/js/util/mysqlPool"));
var UUID = require("node-uuid");
var url = require("url");

function loginLog(userId,userName,ip,msg){
    var sql = "insert into t_log values(?,?,?,?,?,?)";
    var resultMap = [UUID.v1(),userId,userName,new Date(),ip,msg];
    query(sql,resultMap,function(errs,results){
        if(errs) console.error(errs);
    });
}

/**
 * 获取url请求的客户端ip
 * @param req
 * @returns {*|string}
 */
function getClientIp(req){
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    return ip;
}

/**
 * 获取get请求上的参数
 * @param req https://nodejs.org/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost
 * @returns {{}}
 */
function getQueryString(req){
    return url.parse(req.url,true).query || {};
}

/**
 * 分页查询后台封装
 * @param sql 逻辑sql
 * @param req request对象
 * @param responseData responseData对象
 * @param callback 回调函数
 */
function queryByPage(sql,req,responseData,callback){
    var reqObj = getQueryString(req),
        currentPage = parseInt(reqObj.currentPage,10),
        pageSize = parseInt(reqObj.pageSize,10);
    var sql1 = "select * from ("+sql+") t limit ?,?";
    var sql2 = "select count(1) as num from ("+sql+") t";
    query([sql1,sql2].join(";"),[(currentPage-1)*pageSize,pageSize],function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = results[0];
            responseData.page = {
                currentPage: currentPage,
                total:results[1][0]["num"]
            }
        }
        callback(responseData);
    });
}

exports.loginLog = loginLog;
exports.getClientIp = getClientIp;
exports.getQueryString = getQueryString;
exports.queryByPage = queryByPage;