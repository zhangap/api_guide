var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/*', function(req, res, next) {
    var user = req.session.user;
    if(user){
        next();
    }else{
        res.redirect("/login");
    }
});


router.get("/main",function(req,res,next){
    res.render("admin/main");
});
router.get("/header",function(req,res,next){
    res.render("admin/header");
});


module.exports = router;
