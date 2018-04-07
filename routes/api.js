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
    var sql = "select * from t_user where username=? and state=1";
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
    var user = req.session.user;
    var sql = "select * from t_menu";
    if(user.username === "superAdmin"){ //如果是超级管理员，拥有所有的角色
        query(sql,function(errors,results){
            var resultData = [];
            getMenuList(resultData,results,"0","childs","menuId");
            res.json(resultData);
        });
    }else{
        sql = "select t1.menuId, t2.menuName,t2.pId,t2.url from (select * from t_rolemenu where " +
            "roleid = (select roleId  from t_user where userId =?) and menuId != '0') t1 left join t_menu t2" +
            " on t1.menuId = t2.menuId order by menuId";
        query(sql,[user.userId],function(errs,results){
            var resultData = [];
            getMenuList(resultData,results,"0","childs","menuId");
            res.json(resultData);
        });
    }


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
                menuIds = "'"+results[0].menuId+"'";
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
            getMenuList(resultData,results,"0",'children','typeId');
            console.log("resultData",resultData);
            responseData.data = resultData;
            res.json(responseData);
        }
    });

});

/**
 * 保存文档类型
 */
router.post("/saveType",function(req,res,next){
    var mo = req.body,
        sql = "",
        msg = "修改成功",
        map =[];
    if(mo.typeId){ //update
        sql = "update t_documenttype set typeName=?, sortNum=?,pId=?,note=? where typeId =?";
        map =[mo.typeId,mo.pId,mo.typeName,mo.sortNum,mo.note];
    }else{
        sql = "insert into t_documenttype values(?,?,?,?,?)";
        map = [UUID.v1(),mo.pId,mo.typeName,mo.sortNum,mo.note];
        msg = "保存成功";
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
 * 角色模块-新增|更新
 */
router.post("/mergeRole",function(req,res,next){
    var itemInfo = JSON.parse(req.body.pms),uid = UUID.v1();
    var user = req.session.user;

    var sql = "insert into t_role values(?,?,?,?,?)",
        params = [uid,itemInfo.rolename,itemInfo.memo,new Date(), user.username];
    if(itemInfo.roleid){ //update
        sql = "update t_role set rolename=?,memo=?,createtime=?,createman=? where roleid=?;";
        params = [itemInfo.rolename,itemInfo.memo,new Date(),user.username,itemInfo.roleid];
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
    var sql = "select a.*, DATE_FORMAT(a.createtime,'%Y-%m-%d %H:%i:%S') updatetime from t_role a ";
    if(reqObj.rolename){
        sql += " where rolename like '%"+reqObj.rolename+"%'";
    }else{
        sql += " order by a.createtime desc";
    }

    if(!reqObj.pageSize){
        query(sql,function(errs,results){
            if(errs){
                responseData.status = "error";
                responseData.message = errs;
            }
            else{
                responseData.status = "success";
                responseData.message = results;
            }
            res.json(responseData);
        });
    }else{
        appUtil.queryByPage(sql,req,responseData,function(resData){
            res.json(resData);
        });
    }
});

/**
 * 删除角色(可批量)
 */
router.get("/deleteRoleById",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = `delete from t_role where roleid=?`;
    query(sql,[reqObj.roleId],function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = results;
        }
        res.json(responseData);
    })
});

/**
 * 获取用户列表
 */
router.get("/getUsersList",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = "select t1.*,t2.rolename from  t_user t1 LEFT JOIN t_role t2 on t1.roleId = t2.roleId where 1=1";
    if(reqObj.username){
        sql += ` and t1.username like '%${reqObj.username}%'`;
    } 
    if(reqObj.userrole){
        sql += ` and t1.roleid = '${reqObj.userrole}'`;
    }
    if(reqObj.phone){
        sql += ` and t1.phone like '%${reqObj.phone}%'`;
    }
    if(reqObj.email){
        sql += ` and t1.email like '%${reqObj.email}%'`;
    }
    if(reqObj.state =="0"||reqObj.state =="1"){
        sql += ` and t1.state = ${reqObj.state}`;
    }
    sql += " order by t1.updatetime desc";
    appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    });
});

/**
 * 新增|修改 用户信息
 */
router.post("/mergeUser",function(req,res,next){
    var dol = req.body,user = req.session.user;
    var sql = "insert into t_user values(?,?,?,?,?,?,?,?,?)";
    var mapValue = [UUID.v1(),dol.username,md5("123456"),dol.userrole,new Date(),dol.phone,dol.email,1,dol.memo];
    if(dol.userId){
        sql = "update t_user set username = ?,roleid=?,updateTime=?,phone=?,email=?,state=?,memo=? where userId=?";
        mapValue.shift();
        mapValue.splice(1,1);
        mapValue.push(dol.userId);
    }
    query(sql,mapValue,function(errs,results){
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
 * 新增|修改 标签管理信息
 */
router.post("/mergeTag",function(req,res,next){
    var dol = req.body,user = req.session.user;
    var sql = "insert into t_tag values (?,?,?,?);",mapParams = [UUID.v1()];
    if(!dol.id){
        mapParams[mapParams.length] = dol.classify?dol.classify:"0";
        mapParams.push(dol.tagName,dol.memo);
    }else{
        sql = "update t_tag set parentId=?,tagName=?,memo=? where id=?;";
        mapParams.shift();
        mapParams[mapParams.length] = dol.classify;
        mapParams.push(dol.tagName,dol.memo,dol.id);
    }
    query(sql,mapParams,function(errs,results){
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
 * 获取标签列表
 */
router.get("/getTagList",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = "SELECT t1.*,t2.tagName as parentName from t_tag t1 LEFT JOIN t_tag t2 ON t1.parentId = t2.id where 1=1";
    if(reqObj.classify){
        sql += " and (t1.id='"+reqObj.classify+"' or t1.parentId='"+reqObj.classify+"')";
    }
    if(reqObj.tagName){
        sql += " and t1.tagName like '%"+reqObj.tagName+"%'";
    }
    if(reqObj.id){
        sql += " and t1.id= '"+reqObj.id+"'";
    }
    if(reqObj.parentId){
        sql += " and t1.parentId= '"+reqObj.parentId+"'";
    }
    sql += " order by t2.id desc";
    if(!reqObj.pageSize){
        query(sql,function(errs,results){
            if(errs){
                responseData.status = "error";
                responseData.message = errs;
            }
            else{
                responseData.status = "success";
                responseData.message = results;
            }
            res.json(responseData);
        });
    }else{
        appUtil.queryByPage(sql,req,responseData,function(resData){
            res.json(resData);
        });
    }
});

/**
 * 删除标签
 */
router.get("/deleteTagById",function(req,res,next){
    var reqObj = appUtil.getQueryString(req),userId = reqObj.userId;
    var tagId = reqObj.tagId;
    if(tagId.indexOf(",")>0){
        tagId = tagId.split(",");
        var id = "";
        tagId.forEach(elelment=>{
            id += "'"+elelment+"',";
        });
        id = id.slice(0,-1);
        tagId = id;
    }else{
        tagId = `'${tagId}'`;
    }
    var sql = `delete from t_tag where id in (${tagId})`;
    query(sql,function(errs,results){
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
 * 删除用户信息
 */
router.get("/deleteUserById",function(req,res,next){
    var reqObj = appUtil.getQueryString(req),userId = reqObj.userId;
    if(userId.indexOf(",")>0){
        userId = userId.split(",");
        var id = "";
        userId.forEach(elelment=>{
            id += "'"+elelment+"',";
        });
        id = id.slice(0,-1);
        userId = id;
    }else{
        userId = `'${userId}'`;
    }
    var sql = `update t_user set state = ? where userId in (${userId})`;
    query(sql,[0],function(errs,results){
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

/*
 * 修改密码
 */
router.post("/changePwd",function (req,res,next) {
    var gxsql="UPDATE t_user SET password =? WHERE username =? and password=?";
    var username=req.session.user.username;
    var content = req.body;
    var newmdpwd=md5(content.newpwd);
    var oldmdpwd=md5(content.oldpwd);
    query(gxsql,[newmdpwd,username,oldmdpwd],function(errors,results){
        if(results.changedRows){
            responseData.status="success";
            responseData.message="密码修改成功";
        }else{
            responseData.status="error";
            responseData.message="请输入正确密码";
        }
        res.json(responseData);
    })
});

/**
 * 获取查询日志
 */
router.get("/logs",function(req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var username=reqObj.admin;
    var sql="select  * from t_log where userName like '%"+username+"%' ";
    appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    });

});

/**
 * 根据roleId获取已经授权的资源集合
 */
router.get("/getHasSetResources",function (req,res,next){
    var reqObj = appUtil.getQueryString(req);
    var sql = "select menuId as id  from t_rolemenu where roleid = ? and type = '0';";
    query(sql,[reqObj.roleId],function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = results;
        }else{
            responseData.status = "success";
            responseData.message = results;
        }
        res.json(responseData);
    })
});

//给角色设置已经授权的资源集合
router.post("/setResources",function(req,res,next){
    var cResources = JSON.parse(req.body.cResources) || [];
    var hResources = JSON.parse(req.body.hResources) || [];
    var roleId = req.body.roleId;
    var sql = "delete from t_rolemenu where roleid = '"+roleId+"'";
    var sql2 = "insert into t_rolemenu values";
    var values = [];
    cResources.forEach(function(item){
        values.push("('"+UUID.v4()+"','"+roleId+"','"+item+"','0')");
    });
    hResources.forEach(function(item){
        values.push("('"+UUID.v4()+"','"+roleId+"','"+item+"','1')");
    });
    sql2 += values.join(",");
    console.log("设置资源SQL:" + sql2);
    query([sql,sql2].join(";"),function(errs){
        if(errs){
            responseData.status = "error";
            responseData.message = "授权失败!";
        }else{
            responseData.status = "success";
            responseData.message = "授权成功!";
        }
        res.json(responseData);
    })
})

module.exports = router;
