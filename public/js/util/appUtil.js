var path = require("path");
var conUtil = require(path.resolve("./public/js/util/conUtil"));
var connection = conUtil.init();
var UUID = require("node-uuid");
var url = require("url");

function loginLog(userId,userName,ip,msg){
    var sql = "insert into t_log values(?,?,?,?,?,?)";
    var resultMap = [UUID.v1(),userId,userName,new Date(),ip,msg];
    connection.query(sql,resultMap,function(errs,results){
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

exports.loginLog = loginLog;
exports.getClientIp = getClientIp;
exports.getQueryString = getQueryString;