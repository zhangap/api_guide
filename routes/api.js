var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var conUtil = require(path.resolve("./public/js/util/conUtil"));

var responseData; //返回格式
router.use(function(req,res,next){
    responseData = {
      status:"success",
      message:""
    };
    next();
});
var connection = conUtil.init();


/**
 * 登录
 */
router.post("/login",function(req,res,next){
    var sql = "select * from t_user where username=?";
    var content = req.body;

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
        }else{
            responseData.status = "error";
            responseData.message = "用户不存在";
            responseData.statusCode = "10002";
        }
        res.json(responseData);
    });
});


module.exports = router;
