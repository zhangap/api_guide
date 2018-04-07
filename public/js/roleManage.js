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
                memo:""
            },
            menuList:[],
            options:[],
            defaultExpandAll:true,
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
            checkedResources:[],//选中的资源节点
            confirmVisible:false,
            dialogTile:"新增角色",
            dialogMenWinVisible:false,
            dialogRoleVisible:false,
            defaultProps: {
                children: 'children',
                label: 'label'
            },
            page:$.extend(true,{},eleUtil.page)
        },
        created:function(){
            this.getRoleList();
            this.getMenuList();
        },
        mounted:function(){
            $(this.$refs.roleName.$el).on('keyup',$.proxy(this.submitForm,this));
        },
        methods:{
            getMenuList:function(){
                var _this = this;
                $.ajax({
                    url:"/api/getAllResources",
                    type:"get",
                    success:function(data){
                        _this.$data.menuList = data.message;
                    }
                })
            },
            submitForm:function(e){
                if((e.target.nodeName.toUpperCase()==="INPUT" && e.keyCode === 13)||!e.keyCode){
                    this.getRoleList();
                }
            },
            closeRoleDialog:function(name){
                this.$data.dialogMenWinVisible = false;
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
                                        memo:""
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
                this.$data.dialogTile = "编辑角色1";
                this.$data.dialogMenWinVisible = true;
                this.role.rolename = row.rolename;
                this.role.memo = row.memo;
                this.editRoleId = row.roleId;
            },
            deleteRoleHandler:function(row){
                this.$data.confirmVisible = true;
                this._row = row;
                return this;
            },
            cancelHandler:function(){
                this.confirmVisible = false;
            },
            deleteHandler:function(){
                var _this = this;
                $.get("/api/deleteRoleById?roleId="+this._row.roleId,function(data){
                    _this._row = null;
                    _this.confirmVisible = false;
                    if(data.status === "success"){
                        eleUtil.message("删除角色成功!","success");
                        setTimeout(function(){
                            _this.getRoleList();
                        },200);
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                });
            },
            setResourcesHandler:function(row){
                this.$data.editRoleId = row.roleId;
                this.$data.dialogRoleVisible = true;
                this.getHasSetResoureces();
            },
            closeSetResourcesDialog:function(){
                this.$data.dialogRoleVisible = false;
                this.$data.editRoleId = '';
            },
            getHasSetResoureces:function(){  //获取已经设置的资源，用于回显
                var _this =this;
                $.ajax({
                    type:"get",
                    url:"/api/getHasSetResources?roleId=" + this.$data.editRoleId,
                    success:function(data){
                        if(data.status === "success"){
                            _this.$refs.tree.setCheckedNodes(data.message);
                        }
                    }
                })

            },
            submitSetResources:function(tree){ //提交设置的资源
                var arr1 = this.$refs.tree.getCheckedKeys(),
                    arr2 = this.$refs.tree.getHalfCheckedKeys();
                var _this = this;
                $.ajax({
                    type:"post",
                    url:"/api/setResources",
                    data:{roleId:this.$data.editRoleId,"cResources":JSON.stringify(arr1),"hResources":JSON.stringify(arr2)},
                    success:function(data){
                        if(data.status === "success"){
                            _this.$data.dialogRoleVisible = false;
                        }else{
                            appUtil.message(data.message,"error");
                        }
                    }
                })
            }
        }
    });
});