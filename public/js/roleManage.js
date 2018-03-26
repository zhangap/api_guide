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
            dialogMenWinVisible:false,
            page:$.extend(true,{},eleUtil.page)
        },
        created:function(){
            this.getRoleList();
        },
        methods:{
            submitForm:function(e){
                this.getRoleList();
            },
            closeRoleDialog:function(){
                this.dialogMenWinVisible = false;
            },
            submitRoleDialog:function(){
                var _this = this;
                var params = this.role;
                if(!params.rolename||!params.describe){
                    return ;
                }          
                $.post("/api/mergeRole",params).done(function(data){
                    if(data.status === "success"){
                        eleUtil.message(data.message,"success");
                        _this.dialogMenWinVisible = false;
                        _this.$refs.mergeForm.resetFields();
                        _this.getRoleList();
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
                                    _this.dialogMenWinVisible = true;
                                } }
                            }
                        )
                    ]
                );
            },
            getRoleList:function(){
                var _this = this;
                var poly = {
                    rolename:this.formModel.roleName
                };
                $.extend(true,poly,this.page);
                $.get("/api/getRoleList",poly,function(data){
                    if(data.status === "success"){
                        _this.tableData = data.message;
                        _this.page.currentPage = data.page.currentPage;
                        _this.page.total = data.page.total;
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                });
            },
            sizeChangeHandler:function(pSize){
                this.page.pageSize =pSize;
                this.getRoleList();
            },
            currentChangeHandler:function(cPage){
                this.page.currentPage = cPage;
                this.getRoleList();
            },
        }
    });
});