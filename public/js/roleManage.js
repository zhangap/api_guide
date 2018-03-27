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
                memo:""
            },
            _row:null,
            rules:{
                rolename:[{required: true, message: '请输入活动名称', trigger: 'blur'}],
                memo:[{required: true, message: '请输入活动名称', trigger: 'blur'}]
            },
            editRoleId:'',
            confirmVisible:false,
            dialogTile:"新增角色",
            dialogMenWinVisible:false,
            page:$.extend(true,{},eleUtil.page)
        },
        created:function(){
            this.getRoleList();
        },
        mounted:function(){
            $(this.$refs.roleName.$el).on('keyup',$.proxy(this.submitForm,this));
        },
        methods:{
            submitForm:function(e){
                if((e.target.nodeName.toUpperCase()==="INPUT" && e.keyCode === 13)||!e.keyCode){
                    this.getRoleList();
                }
            },
            closeRoleDialog:function(name){
                this.dialogMenWinVisible = false;
                this.editRoleId = '';
                this.$nextTick(function(){
                    this.$refs[name].resetFields();
                });
            },
            submitRoleDialog:function(name){
                var _this = this;
                var params = $.extend(true,{},this.role);
                params.roleid = this.editRoleId;  
                this.$refs[name].validate(function(validate){
                    if(validate){
                        $.post("/api/mergeRole",params).done(function(data){
                            if(data.status === "success"){
                                eleUtil.message(data.message,"success");
                                _this.dialogMenWinVisible = false;
                                _this.editRoleId = '';
                                _this.getRoleList();
                            }else{
                                eleUtil.message(data.message,"error");
                            }
                        });
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
                                    _this.dialogTile = "新增角色";
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
                eleUtil.loading();
                $.get("/api/getRoleList",poly,function(data){
                    eleUtil.closeLoading();
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
            editRoleHandler:function(row){
                var _this = this;
                this.dialogTile = "编辑角色"
                this.dialogMenWinVisible = true;
                this.role.rolename = row.rolename;
                this.role.memo = row.memo;
                this.editRoleId = row.roleId;
            },
            deleteRoleHandler:function(row){
                var _this = this;
                this.confirmVisible = true;
                this._row = row;
                return this;
            },
            cancelHandler:function(){
                this.confirmVisible = false;
            },
            deleteHandler:function(){
                var row = this._row,_this = this;
                $.get("/api/deleteRoleById",row,function(data){
                    _this._row = null;
                    _this.confirmVisible = false;
                    if(data.status === "success"){
                        _this.getRoleList();
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                });
            }
        }
    });
});