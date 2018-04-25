var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var UUID = require("node-uuid");
var query = require(path.resolve("./public/js/util/mysqlPool"));
var appUtil = require(path.resolve("./public/js/util/appUtil"));
var fs = require("fs");
var multer = require("multer");
var upload = multer({dest:"uploads/"});
var excel = require("../public/js/util/xlsxUtil");

var responseData; //返回格式
router.use(function(req,res,next){
    responseData = {
      status:"success",
      message:""
    };
    next();
});
/* GET home page. */
router.all('/*', function(req, res, next) {
    let user = req.session.user;
    if(user||req.originalUrl.includes("api/login")){
        next();
    }else{
        req.session.originalUrl = req.headers.referer;
        responseData.status = "302";
        responseData.message = "/login";
        res.json(responseData);
    }
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
                res.cookie("username",user.username,{maxAge:30*60*1000});
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
        //如果登录成功，直接去查询菜单权限，并进行权限的验证，判断即将跳转的url是否在该登录用户的权限范围内
        if(responseData.status === "success"){
            getMenuListByUser(req,function(resultData){
                var menuItem = resultData.find(function(item){
                    return item.url === responseData.message;
                });
                responseData.message = menuItem ? menuItem.url : "/admin/main";
                res.json(responseData);
            });
        }else{
            res.json(responseData);
        }

    });
});


/**
 * 获取菜单
 */
router.get("/menuList",function(req,res,next){
    getMenuListByUser(req,function(results){
        let resultData = [];
        getMenuList(resultData,results,"0","childs","menuId");
        res.json(resultData);
    });
});

/**
 * 菜单集合
 * @type {Array}
 */
function getMenuListByUser(req,callback){
    let user = req.session.user;
    let menuList = req.session.menuList || [];
    if(menuList.length){
        callback(menuList);
    }else{
        if(user.username === "superAdmin"){ //如果是超级管理员，拥有所有的角色
            let sql = "select * from t_menu";
            query(sql,function(errors,results){
                req.session.menuList = results;
                callback(results);
            });
        }else{
            let sql = "select t1.menuId, t2.menuName,t2.pId,t2.url from (select * from t_rolemenu where " +
                "roleid = (select roleId  from t_user where userId =?) and menuId != '0') t1 left join t_menu t2" +
                " on t1.menuId = t2.menuId order by menuId";
            query(sql,[user.userId],function(errs,results){
                req.session.menuList = results;
                callback(results);
            });
        }

    }
}



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
    mo.url = mo.url ? "/admin/"+mo.url : mo.url;
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
    var sql = "insert into t_user values(?,?,?,?,?,?,?,?,?,?)";
    var mapValue = [UUID.v1(),dol.username,md5("123456"),dol.realName,dol.userrole,new Date(),dol.phone,dol.email,1,dol.memo];
    if(dol.userId){
        sql = "update t_user set username = ?,realName=?,roleid=?,updateTime=?,phone=?,email=?,state=?,memo=? where userId=?";
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
    var username = reqObj.admin;
    var sql="select  *,DATE_FORMAT(loginTime,'%Y-%m-%d %H:%i:%S') loginTime1 from t_log  where userName like '%"+username+"%' order by loginTime desc";
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
});

/**
 * 图片上传服务
 */
router.post("/upload-img",upload.array('file'),function(req,res,next){
    // 图片会放在uploads目录并且没有后缀，需要自己转存，用到fs模块
    var file = null,newpath = null,fileUrl = [];
    for (var i = 0; i < req.files.length; i++) {    
        file = req.files[i]; 
        newpath = file.path + "."+ file.mimetype.split("/")[1];
        fileUrl.push("/" + newpath);
        fs.rename(file.path,newpath, function(err) {
            if (err) {
                throw err;
            }
        });
    }
    res.json({
        errno:"0",
        data:fileUrl
    });
});

/**
 * 文章发布及修改
 */
router.post("/publishArticle",function(req,res,next){
    var reqobj = req.body,user = req.session.user;
    var sql = "insert into t_article values (?,?,?,?,?,?,?,?,?,?,?);";
    var docType = reqobj.classType.split(',');
    docType = docType.pop();
    var mapValue = [UUID.v1(),user.userId,reqobj.title,new Date(),reqobj.tag,reqobj.content,reqobj.publish,docType,0,0,0];
    if(reqobj.id){
       sql = "update t_article set title=?,updatetime=?,tag=?,content=?,publish=?,docType=? where id=?;"; 
       mapValue.shift();
       mapValue.shift();
       mapValue.splice(6,3,reqobj.id);
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
 * 获取文章列表
 */
router.get("/getArticleList",function(req,res,next){
    var reqObj = appUtil.getQueryString(req),user = req.session.user;
    var sqlStr = "SELECT t1.*,t2.realName,DATE_FORMAT(t1.updatetime,'%Y-%m-%d %H:%i:%S') updatetime2  from t_article t1 LEFT JOIN t_user t2 ON t1.author = t2.userId where 1=1";
    sqlStr += " and t1.author = '"+user.userId+"'";
    if(reqObj.title){
        sqlStr += ` and t1.title like '%${reqObj.title}%'`;
    }
    if(reqObj.date){
        sqlStr += ` and t1.updateTime <'${reqObj.date}'`;
    }
    sqlStr += ' order by t1.updateTime desc';
    appUtil.queryByPage(sqlStr,req,responseData,function(resData){
        res.json(resData);
    });
});

/**
 * 删除文章(可批量)
 */
router.post("/deleteArticleById",function(req,res,next){
    var reqObj = req.body,id = reqObj.id,idStr = '';
    id = id.split(",");
    id.forEach(elelment=>{
        idStr += "'"+elelment+"',";
    });
    idStr = idStr.substr(0,idStr.length-1);
    var sqlStr = `delete from t_article where id in (${idStr})`;
    query(sqlStr,function(errs,results){
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
 * 公开或私密文章
 */
router.post("/public2Secret",function(req,res,next){
    var reqObj = req.body;
    var sql = "update t_article set publish=? where id=?;";
    var mapValaue = [reqObj.publish,reqObj.id];
    query(sql,mapValaue,function(errs,results){
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
 * 获取数据字典列表
 */
router.get("/getClassList",function(req,res){
    var reqObj = appUtil.getQueryString(req);
    var sql = "select  * from t_class";
    if(reqObj.type){
        sql += " where type ='"+reqObj.type+"'";
    }
    sql += " order by type,sxh";
    appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    })
});

/**
 *
 */
router.post("/saveClass",function(req,res){
    let item = JSON.parse(req.body.cItem);
    let sql = "insert into t_class values(?,?,?,?,?,?);";
    let params =[UUID.v1(),item.type,item.id,item.name,item.sxh,item.memo];
    let msg = "新增成功";
    if(item.uuid){
        sql = "update t_class set type=?,id=?,name=?,sxh=?,memo=? where uuid=?";
        params = [item.type,item.id,item.name,item.sxh,item.memo,item.uuid];
        msg = "修改成功";
    }
    query(sql,params,function(errs,result){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message= msg;
        }
        res.json(responseData);
    });
});

/**
 * 删除数据字典数据
 */
router.post("/deleteClass",function(req,res){
    let ids = JSON.parse(req.body.ids);
    let params = [];
    ids.forEach(function(item,i){
        params[i] = "'"+item+"'";
    });
    let sql = "delete from t_class where uuid in("+params.join(",")+")";
    query(sql,function(errs,rsults){
        if(errs){
            responseData.status = "error";
            responseData.message = results;
        }else{
            responseData.status = "success";
            responseData.message = "删除成功";
        }
        res.json(responseData);
    });
});

/**
 * 获取所有的计划
 */
router.get("/getPlanList",function(req,res){
    let reqObj = appUtil.getQueryString(req);
    let conditions = JSON.parse(reqObj.conditions);
    let sql = "select uuid,projectId, projectSub, level,userId,detail, DATE_FORMAT(startTime,'%Y-%m-%d') startTime, DATE_FORMAT(endTime,'%Y-%m-%d') endTime, state,memo from t_plan where 1=1 ";
    if(conditions.projectId){
        sql += " and projectId ='"+conditions.projectId+"'";
    }
    if(conditions.userId){
        sql += " and userId='"+conditions.userId+"' ";
    }
    if(conditions.startTime){
        sql += " and startTime >='"+conditions.startTime+"' ";
    }
    if(conditions.endTime){
        sql += " and endTime <='"+conditions.endTime+"' ";
    }
    if(conditions.state.length){
        sql += " and state in("+conditions.state.join(",")+")";
    }
     sql += " order by startTime desc, userId";
   appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    });
});

/**
 * 获取项目列表
 */
router.get("/getProjectList",function(req,res){
    let sql = "select projectId,projectName from t_project";
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

/**
 * 获取数据字典
 */
router.get("/getClassListByType",function(req,res){
    let reqObj = appUtil.getQueryString(req);
    let sql = "select id,name from t_class where type = ? order by sxh;";
    query(sql,[reqObj.type],function(errs,results){
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
 * 保存
 */
router.post("/savePlan",function(req,res){
    let sd = JSON.parse(req.body.saveData);
    let sql = "insert into  t_plan values(?,?,?,?,?,?,?,?,?,?)";
    let params = [UUID.v1(),sd.projectId,sd.projectSub,sd.level,sd.userId,sd.detail,sd.startTime,sd.endTime,sd.state,sd.memo];
    if(sd.uuid){//update
        sql = "update t_plan set projectId=?,projectSub=?,level=?,userId=?,detail=?,startTime=?,endTime=?,state=?,memo=? where uuid = ?";
        params = [sd.projectId,sd.projectSub,sd.level,sd.userId,sd.detail,sd.startTime,sd.endTime,sd.state,sd.memo,sd.uuid];
    }
    query(sql,params,function(errs){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = "计划保存成功";
        }
        res.json(responseData);
    });

});

/**
 * 获取用户集合
 */
router.get("/getUserList",function(req,res){
    let sql = "select userId, realName from t_user where state = '1'";
    query(sql,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message =results;
        }
        res.json(responseData);
    });
});

/**
 * 删除计划
 */
router.get("/delPlanById",function(req,res){
    let reqObj = appUtil.getQueryString(req);
    let sql = "delete from t_plan where uuid =?";
    query(sql,[reqObj.uuid],function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = errs;
        }else{
            responseData.status = "success";
            responseData.message = "计划删除成功";
        }
        res.json(responseData);
    });
});

/**
 * 更新计划状态
 */
router.get("/updateState",function(req,res){
    let reqObj = appUtil.getQueryString(req);
    let sql = "update t_plan set state =? where uuid = ?";
    query(sql,[reqObj.state,reqObj.uuid],function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = "状态更新失败";
        }else{
            responseData.status = "success";
            responseData.message = "状态更新成功";
        }
        res.json(responseData);
    });
});
/**
 * 导出计划
 */
router.get("/exportPlanList",function(req,res,next){
    let reqObj = appUtil.getQueryString(req);
    let sql = `select t1.uuid,t3.projectName, projectSub, t4.name as dealLevel,t5.name as taskState,t2.realName,detail, DATE_FORMAT(startTime,'%Y-%m-%d') startTime, DATE_FORMAT(endTime,'%Y-%m-%d') endTime, t1.state,t1.memo from 
            t_plan t1 LEFT JOIN t_user t2 ON t1.userId = t2.userId  LEFT JOIN t_project t3 ON t1.projectId = t3.projectId LEFT JOIN t_class t4 ON t1.level = t4.id and t4.type='level'
            LEFT JOIN t_class t5 ON t1.state = t5.id and t5.type='status' where 1=1 `;
    if(reqObj.projectId){
        sql += " and t1.projectId ='"+reqObj.projectId+"'";
    }
    if(reqObj.userId){
        sql += " and t1.userId='"+reqObj.userId+"' ";
    }
    if(reqObj.startTime){
        sql += " and t1.startTime >='"+reqObj.startTime+"' ";
    }
    if(reqObj.endTime){
        sql += " and t1.endTime <='"+reqObj.endTime+"' ";
    }
    if(reqObj.state){
        sql += " and t1.state='"+reqObj.state+"' ";
    }
    sql += " order by t1.startTime desc";
    query(sql,function(errs,results){
        if(errs){
            responseData.status = "error";
            responseData.message = "导出失败";
        }else{
            var hds = [
                {header:'责任人', key:'realName', width:15},
                {header:'工程名称', key:'projectName', width:25},
                {header:'任务类型', key:'projectSub', width:20},
                {header:'紧急程度', key:'dealLevel', width:20},
                {header:'开始时间', key:'startTime', width:15},
                {header:'结束时间', key:'endTime', width:15},
                {header:'任务状态', key:'taskState', width:15},
                {header:'详细说明', key:'detail', width:50},
                {header:'备注', key:'memo', width:50},
                {header:'任务号', key:'uuid', width:40}
            ];
            var [pros,filename]= excel.commonExport(hds,results);
            pros.then(function(arg){
                responseData.status = "success";
                responseData.message = filename;
                res.json(responseData);
            });
        }
    });
});

/**
 * 获取留言管理列表
 */
router.get("/getMessageList",function(req,res,next){
    let reqObj = appUtil.getQueryString(req);
    let sql = "SELECT t1.*,t2.username,t3.title,DATE_FORMAT(t1.createTime,'%Y-%m-%d %H:%i:%S') time2 from t_message t1 LEFT JOIN t_user t2 ON t1.userId = t2.userId LEFT JOIN t_article t3 ON t1.articleId = t3.id WHERE 1=1 ";
    if(reqObj.keyWord){
        sql += ` and (t2.username like '%${reqObj.keyWord}%' or t1.content like '%${reqObj.keyWord}%') `;
    }
    if(reqObj.dates){
        let arr = reqObj.dates.split(',');
        if(arr[0]){
            sql += ` and t1.createTime >='${arr[0]}'`;
        }
        if(arr[1]){
            sql += ` and t1.createTime <='${arr[1]}'`;
        }
    }
    sql += " order by t1.createTime desc";
    appUtil.queryByPage(sql,req,responseData,function(resData){
        res.json(resData);
    }); 
});

/**
 * 删除留言
 */
router.post("/deleteMessageById",function(req,res,next){
    var reqObj = req.body,id = reqObj.uid,idStr = '';
    id = id.split(",");
    id.forEach(elelment=>{
        idStr += "'"+elelment+"',";
    });
    idStr = idStr.substr(0,idStr.length-1);
    var sqlStr = `delete from t_message where uid in (${idStr})`;
    query(sqlStr,function(errs,results){
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
 * 添加文章的留言
 */
router.post("/addArticleMessage",function(req,res,next){
    let reqObj = req.body,user = req.session.user,puid = reqObj.pid||"0";
    let sql = "insert into t_message values (?,?,?,?,?,?,?);";
    let mapValues = [UUID.v1(),user.userId,reqObj.articleId,new Date(),reqObj.content,0,puid];
    query(sql,mapValues,function(errs,results){
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
 * 获取用户的登录信息
 */
router.get("/loginInfo",function(req,res,next){
    var user = req.session.user;
    responseData.status = "success";
    responseData.message = user;
    if(!user){
        responseData.status = "error"; 
    }
    return res.json(responseData);
});

/**
 * 单表记录删除公用服务(可批量)
 */
router.post("/singleTableDeleteByKey",function(req,res,next){
    var reqObj = req.body,id = reqObj.id,keyName = reqObj.keyName,tableName = reqObj.tableName,idStr = '';
    id = id.split(",");
    id.forEach(elelment=>{
        idStr += "'"+elelment+"',";
    });
    idStr = idStr.substr(0,idStr.length-1);
    var sqlStr = `delete from ${tableName} where ${keyName} in (${idStr});`;
    query(sqlStr,function(errs,results){
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

module.exports = router;
