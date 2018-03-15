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
  res.redirect("/login");
});


/**
 * 前台主页
 */
router.get("/",function(req,res,next){
  res.render("front/home",{title:"欢迎使用API开发指南"});
});

module.exports = router;
