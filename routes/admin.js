var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/*', function(req, res, next) {
    var user = req.session.user;
    if(user){
        next();
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
    res.render("admin/main",responseData.activeIndex);
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


module.exports = router;
