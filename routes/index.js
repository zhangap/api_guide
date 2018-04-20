var express = require('express');
var router = express.Router();



/**
 * 登录跳转页
 */
router.get("/login",function(req,res,next){
  res.render("login");
});
/**
 * 退出登录
 */
router.get("/logout",function(req,res,next){
  req.session.user = null;
  req.session.originalUrl = null;
  res.redirect("/login");
});


/**
 * 前台主页
 */
router.get("/",function(req,res,next){
  res.render("front/home",{title:"欢迎使用API开发指南"});
});

/**
 * 分类查找
 */
router.get("/list",function(req,res,next){
  res.render("front/list");
});

/**
 * 在线学习
 */
router.get("/linestudy",function(req,res,next){
    res.render("front/linestudy");
});

/**
 * 查看文章
 */
router.get("/article/:id",function(req,res,next){
  var aid = req.params.id;
  res.render("front/article",{id:aid});
});


module.exports = router;
