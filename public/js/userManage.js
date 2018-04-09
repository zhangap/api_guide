var userform={
    username:"",
    userrole:"",
    phone:"",
    email:"",
    state:"1"
};
var app1 = new Vue({
    el:"#content",
    data:{
        userForm:userform,
        tableData:[],
        newUser:{
            username:"",
            realName:"",
            userrole:"",
            phone:"",
            email:"",
            memo:""
        },
        editUserId:"",
        roleList:[],
        dialogMenWinVisible:false,
        dialogTile:'新增用户',
        rules:{
            username:[{validator:function(rule,value,callback){
                if(!value){
                    return callback(Error('用户名不能为空'));
                }
                if(!(/^[\u4e00-\u9fa5·0-9A-z]+$/.test(value))){
                    return callback(Error('用户名有非法字符'));
                }
                if(app1.$data.editUserId) return callback();
                var params = $.extend(true,{username:value},eleUtil.page);
                $.get("/api/getUsersList",params,function(data){
                   var hasSame = false;
                   if(data.status === "success"){
                        data.message.forEach(function(elem){
                            if(elem.username === value)  hasSame = true;
                        });
                        hasSame?callback(new Error("已有同名用户")):callback();
                   }else{
                       callback(new Error("验证失败"));
                   }
                });
            },trigger:"blur",required: true}],
            userrole:[{ required: true, message: '请选择角色名称', trigger: 'change' }],
            phone:[{ required: true, message: '请输入联系方式', trigger: 'blur' }],
            email:[{ required: true, message: '请输入电子邮箱', trigger: 'blur' }],
            memo:[{ required: true, message: '请输入电子邮箱', trigger: 'blur' }],
            realName:[{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
        },
        page:$.extend(true,{},eleUtil.page),
        confirmVisible:false,
        _row:[]
    },
    created:function(){
        this.getUserList();
        this.getRoleList();
    },
    methods:{
        searchList:function(){
            this.getUserList();
        },
        batchDelete:function(){
            if(this.$data._row.length === 0){
                eleUtil.message("请先勾选用户","info");
            }else{
                this.confirmVisible = true;
            }
        },
        closeUserDialog:function(user){
            this.dialogMenWinVisible = false;
            this.editUserId = '';
            this.$nextTick(function(){
                this.$refs[user].resetFields();
            });
        },
        submitUserDialog:function(user){
            var _this = this;
            var xmo = $.extend(true,{},this.newUser);
            xmo.userId = this.editUserId;
            this.$refs[user].validate(function(validate){
                if(validate){
                    $.post("/api/mergeUser",xmo,function(data){
                        if(data.status === "success"){
                            eleUtil.message(data.message,"success");
                            _this.dialogMenWinVisible = false;
                            _this.editUserId = '';
                            _this.getUserList();
                        }else{
                            eleUtil.message(data.message,"error");
                        }
                    });
                }
            });
        },
        sizeChangeHandler:function(pSize){
            this.page.pageSize =pSize;
            this.getUserList();
        },
        currentChangeHandler:function(cPage){
            this.page.currentPage = cPage;
            this.getUserList();
        },
        getUserList:function(){
            var _this = this;
            var params = $.extend(true,{},userform,this.page);
            eleUtil.loading();
            $.get("/api/getUsersList",params,function(data){
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
        getRoleList:function(){
            var _this = this;
            $.get("/api/getRoleList",function(response){
                if(response.status === "success"){
                    _this.roleList = response.message;
                }
            });
        },
        formatState:function(row, column, cellValue){
            return cellValue == "1"?"有效":"无效";
        },
        selectRow:function(selection, row){
            if(selection.length){
                this.$data._row.push(row.userId);
            }else{
                var index = this.$data._row.indexof(row.userId);
                this.$data._row.splice(index,1);
            }
        },
        selectAll:function(selection){
            var ids = [];
            selection.forEach(function(element){
                ids.push(element.userId);
            });
            this.$data._row = ids;
        },
        editUserHandler:function(row){
            this.dialogTile = "编辑用户";
            this.editUserId = row.userId;
            var user = this.newUser;
            for(var key in user){
                if(user.hasOwnProperty(key)){
                    user[key] = row[key];
                }
            }
            user.userrole = row.roleId;  
            this.dialogMenWinVisible = true;
        },
        deleteUserHandler:function(row){
            this.$data._row = [row.userId];
            this.$refs.list.toggleRowSelection(row,true);
            this.confirmVisible = true;
        },
        cancelHandler:function(){
            this.confirmVisible = false;
            this.$data._row = [];
            this.$refs.list.clearSelection();
        },
        deleteHandler:function(){
            var row = this.$data._row,_this = this;
            $.get("/api/deleteUserById",{userId:row.join(",")},function(data){
                _this.$data._row = [];
                _this.confirmVisible = false;
                if(data.status === "success"){
                    _this.getUserList();
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
                            'href':'javascript:;',
                            on: { click: function () {
                                 _this.dialogTile = "新增用户";
                                 _this.newUser = {
                                    username:"",
                                    userrole:"",
                                    phone:"",
                                    email:"",
                                    memo:""
                                 };
                                 _this.dialogMenWinVisible = true;
                            } }
                        }
                    )
                ]
            );
        }
    }
});