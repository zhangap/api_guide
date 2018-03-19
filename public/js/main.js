/**
 后台管理页面首页**/

$(function(){
    Vue.component("navmenu",{
        name:"navmenu",
        props:["navMenus"],
        template:'<div>' +
        '<template v-for="(navMenu,index) in navMenus"> ' +
        '      <el-menu-item v-if="navMenu.childs.length === 0 " :index="navMenu.url">{{navMenu.menuName}}</el-menu-item>' +
        '      <el-submenu v-if="navMenu.childs.length > 0 " :index="\'submenu\'+navMenu.menuName">' +
        '        <template slot="title">{{navMenu.menuName}}</template>' +
        '        <navmenu :navMenus="navMenu.childs"></navmenu>' +
        '      </el-submenu>' +
        '</template>' +
        '</div>'
    });
    getMenulist(function(data){
        new Vue({
            el:"#menu",
            data:{
                activeIndex:$("#menu").data("activeindex") || "",
                leftMenus:data,
            },
            methods:{
                handleSelect:function(activeIndex){
                    window.location.href= activeIndex;
                }
            }
        });
    });


    new Vue({
        el:"#header",
        data:{
        }
    });


    /**
     * 获取菜单列表
     * @param callback
     */
    function getMenulist(callback){
        $.ajax({
            url:"/api/menuList?time="+new Date().getTime(),
            type:"get",
            success:function(data){
                callback(data);
            }
        });
    }


});
