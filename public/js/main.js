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
            dialogFormVisible:false,
            user:{
                oldpwd:"",
                newpwd:"",
                surepwd:""
            }
        },
        methods:{
            handleClose:function(){
                var user=this.$data.user;
                var _this=this;
                var passreg=/^[0-9a-zA-Z]{4,16}$/;
                if(user.oldpwd&&passreg.test(user.newpwd)&&user.surepwd===user.newpwd){
                    $.ajax({
                        url:"/api/changePwd",
                        type:"post",
                        data:user,
                        success:function (result) {
                            if(result.status=="success"){
                                _this.$message({
                                    message:result.message,
                                    type: 'success'
                                });
                                _this.$data. dialogFormVisible=false;
                            }else{
                                eleUtil.message(result.message);
                            }
                        }
                    })
                }else if(!user.oldpwd){
                    eleUtil.message('请输入原密码');
                }else if(!passreg.test(user.newpwd)){
                    eleUtil.message('请输入4-16位数字或字母组成的密码');
                } else if(!user.surepwd){
                    eleUtil.message('请确认新密码');
                }else if(user.surepwd!==user.newpwd){
                    eleUtil.message('两次密码输入不一致');
                }
            }
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
