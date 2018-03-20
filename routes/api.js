var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var conUtil = require(path.resolve("./public/js/util/conUtil"));
var Log = require(path.resolve("./public/js/util/log"));

var responseData; //返回格式
router.use(function(req,res,next){
    responseData = {
      status:"success",
      message:""
    };
    next();
});
var connection = conUtil.init();

//获取url请求客户端ip
var get_client_ip = function(req) {
    debugger;
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    return ip;
};


/**
 * 登录
 */
router.post("/login",function(req,res,next){
    var sql = "select * from t_user where username=?";
    var content = req.body;
    var ip = "";
    connection.query(sql,[content.username],function(errors,results){
        if(results.length){
            var user = results[0];
            if(user.password === md5(content.password)){
                req.session.user = user;
                responseData.status = "success";
                var oUrl = req.session.originalUrl;
                responseData.message = oUrl ? oUrl : "/admin/main";
            }else{
                responseData.status = "error";
                responseData.message = "密码错误";
                responseData.statusCode = "10001";
            }
            Log.loginLog(user.userId,user.username,ip,responseData.msg);
        }else{
            responseData.status = "error";
            responseData.message = "用户不存在";
            responseData.statusCode = "10002";
            Log.loginLog("",content.username,ip,responseData.msg);
        }
        res.json(responseData);
    });
});


/**
 * 获取菜单
 */
router.get("/menuList",function(req,res,next){
    // var sql = "select * from t_menu where FIND_IN_SET(menuId,getChildLst('0'))";
    var sql = "select * from t_menu";
    connection.query(sql,function(errors,results){
        var resultData = [];
        getMenuList(resultData,results,"0");
        console.log("resultData",resultData);
        res.json(resultData);
    });

});

/**
 * 递归处理菜单相关数据
 * @param resultData
 * @param results
 * @param pId
 */
function getMenuList(resultData,results,pId){
    for(var i =0,len = results.length;i<len;i++){
        if(results[i].pId == pId){
            var item = results[i];
            item.childs = [];
            resultData.push(item);
            getMenuList(item.childs,results,item.menuId);
        }
    }
}


module.exports = router;
