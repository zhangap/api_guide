/**
 后台管理页面首页**/
$(function(){
    new Vue({
        el:"#menu",
        data:{
            activeIndex:$("#menu").data("activeindex") || ""
        },
        methods:{
            handleSelect:function(activeIndex){
                window.location.href= activeIndex;
            }
        }
    });

    new Vue({
        el:"#header",
        data:{
        }
    })


});
