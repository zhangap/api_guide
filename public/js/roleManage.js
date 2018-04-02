$(function(){
    var app1 = new Vue({
        el:"#content",
        components:{
            "treeselect":window.VueTreeselect.Treeselect
        },
        data:{
            tableData:[],
            formModel:{
                roleName:""
            },
            role:{
                rolename:"",
                memo:"",
                pId:null
            },
            options:[],
            _row:null,
            rules:{
                rolename:[{required: true, trigger: 'blur',validator:function(rule,value,callback){
                    if(!value){
                        return callback(Error('角色不能为空'));
                    }
                    if(!(/^[\u4e00-\u9fa5·0-9A-z]+$/.test(value))){
                        return callback(Error('名称有非法字符'));
                    }
                    if(app1.$data.editRoleId) return callback();
                    var params = $.extend(true,{username:value},eleUtil.page);
                    $.get("/api/getRoleList",params,function(data){
                       var hasSame = false;
                       if(data.status === "success"){
                            data.message.forEach(function(elem){
                                if(elem.rolename === value)  hasSame = true;
                            });
                            hasSame?callback(new Error("角色名重复")):callback();
                       }else{
                           callback(new Error("验证失败"));
                       }
                    });
                }}],
                memo:[{required: true, message: '请输入描述', trigger: 'blur'}],
                pId:[{required: true, message: '请选择权限', trigger: 'blur'}]
            },
            editRoleId:'',
            confirmVisible:false,
            dialogTile:"新增角色",
            dialogMenWinVisible:false,
            page:$.extend(true,{},eleUtil.page)
        },
        created:function(){
            this.getRoleList();
            this.getAllMenus();
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
                this.$data.editRoleId = '';
                this.$data.role.pId = null;
                this.$data.role.rolename = '';
                this.$data.role.memo = '';
                this.$refs[name].resetFields();
            },
            submitRoleDialog:function(name){
                var _this = this;
                var params = $.extend(true,{},this.role);
                params.roleid = this.editRoleId;  
                this.$refs[name].validate(function(validate){
                    if(validate){
                        $.post("/api/mergeRole",{pms:JSON.stringify(params)}).done(function(data){
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
                                    _this.$data.role = {
                                        rolename:"",
                                        memo:"",
                                        pId:null
                                    };
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
                this.role.pId = row.menuId?row.menuId.split(","):null;
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
            },
            getAllMenus:function(){
                var _this = this;
                $.get("/api/getAllResources",function(data){
                    if(data.status === "success"){
                        var vdm = data.message[0]?data.message[0].children:[];
                        _this.options = vdm;
                    }
                });
            }
        }
    });
    window.appx =app1;
});