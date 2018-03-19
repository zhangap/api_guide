var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
//var conUtil = require(path.resolve("./public/js/util/conUtil"));
var conUtil = require("../public/js/util/conUtil.js");
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
