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


    var app2=new Vue({
        el:"#header",
        data:{
            dialogFormVisible:false,
            user:{
                oldpwd:"",
                newpwd:"",
                surepwd:""
            },
            rules: {
                oldpwd: [{ required:true, message: '请输入原密码',  trigger: 'blur' }],
                newpwd: [{ validator: function (rule, value, callback) {
                    var passreg=/^[0-9a-zA-Z]{4,16}$/;
                    if(!passreg.test(value)){
                        callback(new Error('请在新密码里输入4-16位数字或字母'));
                    }else{
                        callback();
                    }
                }, trigger: 'blur' }],
                surepwd: [{ validator:function(rule,value,callback) {
                    if(value===''){
                        callback(new Error('请确认密码'));
                    }else if(value!==app2.$data.user.newpwd){
                        callback(new Error('两次密码输入不一致'));
                    }else{
                        callback();
                    }
                }, trigger: 'blur' }]
            }

        },
        methods:{
            handleClose:function(formName){
                var user=this.user;
                var _this=this;
                this.$refs[formName].validate(function(valid){
                    if (valid) {
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
                                        _this.$refs[formName].resetFields();
                                        eleUtil.message(result.message);
                                    }
                                }
                            })
                    }
                });
            },
            resetForm:function (formName) {
                this.$data.dialogFormVisible=false;
                this.$refs[formName].resetFields();
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
