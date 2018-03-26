var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var UUID = require("node-uuid");
var query = require(path.resolve("./public/js/util/mysqlPool"));
var appUtil = require(path.resolve("./public/js/util/appUtil"));

var responseData; //返回格式
router.use(function(req,res,next){
    responseData = {
      status:"success",
      message:""
    };
    next();
});

/**
 * 登录
 */
router.post("/login",function(req,res,next){
    var sql = "select * from t_user where username=?";
    var content = req.body;
    var ip = appUtil.getClientIp(req);
    query(sql,[content.username],function(errors,results){
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
    query(sql,function(errors,results){
        var resultData = [];
        getMenuList(resultData,results,"0","childs","menuId");
        res.json(resultData);
    });

});

/**
 * 获取资源列表
 */
router.get("/getResourceList",function(req,res){
    var sql = "select t1.menuId, t1.menuName, t1.url,t2.menuName as pMenuName,t1.memo from t_menu t1 left join t_menu t2 on t1.pid = t2.menuId";
    appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    });
});

/**
 * 根据menuId删除菜单数据及下层数据
 */
router.get("/delResourceById",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = "select menuId from t_menu  t2 where FIND_IN_SET(menuId,getChildLst(?))";
    query(sql,[reqObj.menuId],function(errs,results){
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
            query(sql2,function(errs,results){
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
    query(sql,[reqObj.menuId],function(errs,results){
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
    var sql = "select menuId as id, menuName as label, pId from t_menu";
    query(sql,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            results.unshift({"id":"0","label":"ROOT","pId":"null"});
            var treeList =[];
            getMenuList(treeList,results,"null","children","id");
            responseData.message = treeList;
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
        msg = "菜单修改成功",
        map =[];
    if(mo.menuId){ //update
        sql = "update t_menu set menuName=?, url=?,pId=?,memo=? where menuId =?";
        map =[mo.menuName,mo.url,mo.pId,mo.memo,mo.menuId];
    }else{
        sql = "insert into t_menu values(?,?,?,?,?)";
        map = [UUID.v1(),mo.menuName,mo.url,mo.pId,mo.memo];
        msg = "菜单保存成功";
    }
    query(sql,map,function(errs,results){
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
 * @param childKey
 */
function getMenuList(resultData,results,pId,childKey,id){
    var key = childKey|| "childs",
        id = id || "menuId";
    for(var i =0,len = results.length;i<len;i++){
        if(results[i].pId == pId){
            var item = results[i];
            item[key] = [];
            resultData.push(item);
            getMenuList(item[key],results,item[id],key,id);
        }
    }
}


/**
 * 获取文档类型
 */
router.get("/documentTypeList",function(req,res,next){
    var sql = "select * from t_documenttype orderby ";
    query(sql,function(errors,results){
        if(errors){
            responseData.status = "error";
            responseData.message = errors;
        }else{
            responseData.status = "success";
            var resultData = [];
            getDocuTypeList(resultData,results,"0");
            console.log("resultData",resultData);
            responseData.data = resultData;
            res.json(responseData);
        }
    });

});
function getDocuTypeList(resultData,results,pId){
    for(var i =0,len = results.length;i<len;i++){
        if(results[i].pId == pId){
            var item = results[i];
            item.children = [];
            resultData.push(item);
            getDocuTypeList(item.children,results,item.typeId);
        }
    }
}
/**
 * 角色模块-新增|更新
 */
router.post("/mergeRole",function(req,res,next){
    var itemInfo = req.body;
    var user = req.session.user;
    var sql = "insert into t_role values(?,?,?,?,?)";
    var params = [UUID.v1(),itemInfo.rolename,itemInfo.memo,new Date(),user.username];
    if(itemInfo.roleid){
        sql = "update t_role set rolename=?,memo=?,createtime=?,createman=? where roleid=?";
        params.shift();
        params.push(itemInfo.roleid);
    }
    query(sql,params,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = "操作成功";
        }
        res.json(responseData);
    });
});

/**
 * 获取角色列表(roleid为空查所有)
 */
router.get("/getRoleList",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = "SELECT *,DATE_FORMAT(createtime,'%Y-%m-%d %H:%i:%S') as updatetime from t_role where 1=1";
    if(reqObj.roleid){
        sql += " and roleid in ('"+reqObj.roleid+"')";
    }
    if(reqObj.rolename){
        sql += " and rolename like '%"+reqObj.rolename+"%'";
    }
    sql += " order by createtime desc";
    appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    });
});

/**
 * 删除角色(可批量)
 */
router.get("/deleteRoleById",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var roleid = reqObj.roleId;
    if(roleid.indexOf(",")>0){
        let roles = roleid.split(",");
        roles.forEach(element => {
            element = `'${element}'`;
        });
        roleid = roles.join(",");
    }else{
        roleid = `'${roleid}'`;
    }
    var sql = `delete from t_role where roleid in (${roleid})`;
    query(sql,function(errs,results){
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

/*
 * 修改密码
 */
router.post("/changePwd",function (req,res,next) {
    var gxsql="UPDATE t_user SET password =? WHERE username =? and password=?";
    var User=req.session.user.username;
    var content = req.body;
    var newmdpwd=md5(content.newpwd);
    var oldmdpwd=md5(content.oldpwd);
    query(gxsql,[newmdpwd,User,oldmdpwd],function(errors,results){
        if(results.changedRows){
            responseData.status="success";
            responseData.message="密码修改成功";
        }else{
            responseData.status="error";
            responseData.message="请输入正确密码";
        }
        res.json(responseData);
    })
})

module.exports = router;
