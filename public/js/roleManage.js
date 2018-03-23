$(function(){
    var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[],
            formModel:{
                roleName:""
            },
            role:{
                rolename:"",
                describe:""
            },
            dialogMenWinVisible:false
        },
        methods:{
            submitForm:function(){
                console.log("some things");
            },
            closeRoleDialog:function(){
                this.dialogMenWinVisible = false;
            },
            submitRoleDialog:function(){
                var params = this.role;
                if(!params.rolename||!params.describe){
                    return ;
                }
                $.post("/api/mergeRole",params).done(function(data){
                    if(data.status === "success"){
                        eleUtil.message(data.message,"success");
                        app1.$data.dialogMenWinVisible = false;
                        setTimeout(function(){
                            location.reload();
                        },500);
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                });
            },
            renderHeader:function(createElement, _self ) {
                var _this = this;
                return createElement(
                    'span',
                    ["操作",
                        createElement('a', {
                                'class': 'fa fa-plus-circle ml10 f18',
                                attrs:{
                                    "title":"新增菜单",
                                    'href':'javascript:;'
                                },
                                on: { click: function () {
                                    //
                                    _this.dialogMenWinVisible = true;
                                } }
                            }
                        )
                    ]
                );
            }
        }
    });
});