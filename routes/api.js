var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var UUID = require("node-uuid");
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
    var reqObj = appUtil.getQueryString(req);
    var sql = "select menuId from t_menu  t2 where FIND_IN_SET(menuId,getChildLst(?))";
    connection.query(sql,[reqObj.menuId],function(errs,results){
        var menuIds="";
        if(results.length){
            if(results.length === 1){
                menuIds = results[0].menuId;
            }else{
                var newArr = [];
                for(var i =0,len = results.length;i<len;i++){
                    newArr[i] = "'" + results[i].menuId + "'";
                }
                menuIds = newArr.join(",");
            }
            var sql2 = "delete from t_menu where menuId in("+menuIds+")";
            console.log("打印SQL：" + sql2);
            connection.query(sql2,function(errs,results){
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
 *根据menuId查询菜单对象
 */
router.get("/getResourceById",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = "select * from t_menu where menuId =?";
    connection.query(sql,[reqObj.menuId],function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            var menu = results[0];
            menu.url = menu.url ? menu.url.split("/").splice(2).join("/") :"";
            responseData.message = menu;
        }
        res.json(responseData);
    });

});

/**
 * 获取所有资源
 */
router.get("/getAllResources",function(req,res,next){
    var sql = "select menuId, menuName from t_menu";
    connection.query(sql,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            results.push({"menuId":"0","menuName":"ROOT"});
            responseData.message = results;
        }
        res.json(responseData);
    });
});

/**
 * 保存菜单信息
 */
router.post("/saveMenu",function(req,res,next){
    var mo = req.body,
        sql = "",
        msg = "菜单修改成功";
        map =[];
    if(mo.menuId){ //update
        sql = "update t_menu set menuName=?, url=?,pId=?,memo=? where menuId =?";
        map =[mo.menuName,mo.url,mo.pId,mo.memo,mo.menuId];
    }else{
        sql = "insert into t_menu values(?,?,?,?,?)";
        map = [UUID.v1(),mo.menuName,mo.url,mo.pId,mo.memo];
        msg = "菜单保存成功";
    }
    connection.query(sql,map,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = msg;
        }
        res.json(responseData);
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
