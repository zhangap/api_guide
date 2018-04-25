var express = require('express');
var router = express.Router();
var path = require("path");
var config = require(path.resolve("./config/config"));

/* GET home page. */
router.get('/*', function(req, res, next) {
    let user = req.session.user;
    let menuList = req.session.menuList;
    if(user){
        //后台页面做权限控制，如果直接在浏览器中输入某个url，但是这个url不在该用户权限范围内的，直接跳转到后台main页面
        var result = menuList.find(function(item){
            return item.url.replace("/admin","") === req.url;
        });
        if(req.url === "/main" || result){
            next();
        }else{
            res.redirect("/admin/main");
        }

    }else{
        req.session.originalUrl = req.originalUrl;
        res.redirect("/login");
    }
});

var responseData;
router.use(function(req,res,next){
    responseData ={
        username:req.session.user.username,
        activeIndex:req.originalUrl || ""
    };
    next();
});

/**
 * 后台主页
 */
router.get("/main",function(req,res,next){
    res.render("admin/main",responseData);
});
/**
 * 用户管理
 */
router.get("/userManage",function(req,res,next){
   res.render("admin/userManage",responseData);
});

/**
 * 角色管理
 */
router.get("/roleManage",function(req,res,next){
    res.render("admin/roleManage",responseData);
});

/**
 * 菜单管理
 */
router.get("/menuManage",function(req,res,next){
    res.render("admin/menuManage",responseData);
});
/**
 * 文档类型
 */
router.get("/documentType",function(req,res,next){
    res.render("admin/documentType",responseData);
});
/**
 * 日志查询
 */
router.get("/logs",function(req,res,next){
    res.render("admin/logs",responseData);
});
/**
 * 标签管理
 */
router.get("/tagManage",function(req,res,next){
    res.render("admin/tagManage",responseData);
});
/**
 * 标签管理
 */
router.get("/articlePublish",function(req,res,next){
    res.render("admin/articlePublish",responseData);
});

/**
 * 标签管理
 */
router.get("/articleManage",function(req,res,next){
    res.render("admin/articleManage",responseData);
});

/**
 * 数据字典表管理
 */
router.get("/classManage",function(req,res,next){
    res.render("admin/classManage",responseData);
});

/**
 * 执行计划
 */
router.get("/planManage",function(req,res,next){
    res.render("admin/planManage",responseData);
});
/**
 * 查询页面
 */
router.get("/planList",function(req,res,next){
    responseData.from = "query"; //标记是查询页面
    res.render("admin/planManage",responseData);
});
/**
 * 留言管理
 */
router.get("/messageManage",function(req,res,next){
    res.render("admin/messageManage",responseData);
});



module.exports = router;
