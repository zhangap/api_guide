var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var conUtil = require(path.resolve("./public/js/util/conUtil"));
var appUtil = require(path.resolve("./public/js/util/appUtil"));

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
    var ip = appUtil.getClientIp(req);
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
            appUtil.loginLog(user.userId,user.username,ip,responseData.message);
        }else{
            responseData.status = "error";
            responseData.message = "用户不存在";
            responseData.statusCode = "10002";
            appUtil.loginLog("",content.username,ip,responseData.message);
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
 * 获取资源列表
 */
router.get("/getResourceList",function(req,res,next){
    var sql = "select t1.menuId, t1.menuName, t1.url,t2.menuName as pMenuName,t1.memo from t_menu t1 left join t_menu t2 on t1.pid = t2.menuId";
    connection.query(sql,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = results;
        }
        res.json(responseData);
    });
});

/**
 * 根据menuId删除菜单数据及下层数据
 */
router.get("/delResourceById",function(req,res,next){
    debugger;
    var reqObj = appUtil.getQueryString(req);
    var sql = "select menuId from t_menu  t2 where FIND_IN_SET(menuId,getChildLst(?))";
    connection.query(sql,[reqObj.menuId],function(errs,results){
        var sql2 = "delete from t_menu where menuId in(?) ",
            resultMap = [];
        if(results.length){
            if(results.length === 1){
                resultMap[0] = results[0].menuId;
            }else{
                var newArr = [];
                for(var i =0,len = results.length;i<len;i++){
                    newArr[i] = "'" + results[i].menuId + "'";
                }
                resultMap[0] = newArr.join(",");
            }
            connection.query(sql2,resultMap,function(errs,results){
                if(errs){
                    responseData.status = "error";
                    responseData.message = errs;
                }else{
                    responseData.status = "success";
                    responseData.message = results;
                }
                res.json(responseData);
            });
        }

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
