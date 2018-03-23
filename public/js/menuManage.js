$(function(){

    var menuObj = {
        menuId:"",
        menuName:"",
        url:"",
        pId:"",
        memo:""
    };

    console.log(eleUtil.page);

    var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[],
            dialogVisible:false,
            winTitle:"新增菜单", //窗口标题
            dialogMenWinVisible:false, //新增和编辑窗口显示变量
            menu:menuObj,
            page:eleUtil.page,
            menuList:[],
            operateMenuId:"" //要操作的菜单id
        },
        created:function(){
            var _this = this;
            $.ajax({
                url:"/api/getResourceList",
                type:"get",
                success:function(data){
                    if(data.status === "success"){
                        _this.$data.tableData = data.message;
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                }
            });
        },
        methods: {
            deleteHandler:function(){
                this.$data.dialogVisible = false;
                eleUtil.loading("正在执行，请稍后...");
                $.ajax({
                    url:"/api/delResourceById",
                    type:"get",
                    data:{"menuId":this.$data.operateMenuId},
                    success:function(data){
                        eleUtil.closeLoading();
                        if(data.status === "error"){
                            eleUtil.message(data.message,"error");
                        }else{
                            location.reload();
                        }
                    }
                });
            },
            cancelHandler:function(){
                this.$data.dialogVisible = false;
                eleUtil.message("已取消删除","info");
            },
            deleteMenuHandler:function(menuId){
                this.$data.dialogVisible = true;
                this.$data.operateMenuId = menuId;
            },
            editMeunHandler:function(menuId){
                this.$data.operateMenuId = menuId;
                this.$data.winTitle = "编辑菜单";
                this.$data.dialogMenWinVisible = true;
                $.ajax({
                    url:"/api/getResourceById?menuId="+menuId,
                    type:"get",
                    success:function(data){
                        if(data.status === "error"){
                            eleUtil.message(data.message,"error");
                        }else{
                            app1.$data.menu = $.extend(true,{},data.message);
                            app1.getAllResources();
                        }
                    }
                });
            },
            closeMenuWinHandler:function(){ //关闭弹出窗口
                this.$data.dialogMenWinVisible = false
            },
            submitMenuHandler:function(){ //提交菜单新增或修改操作
                $.ajax({
                    url:"/api/saveMenu",
                    type:"post",
                    data:this.$data.menu,
                    success:function(data){
                        if(data.status === "success"){
                            eleUtil.message(data.message,"success");
                            app1.$data.dialogMenWinVisible = false;
                            setTimeout(function(){
                                location.reload();
                            },500);
                        }else{
                            eleUtil.message(data.message,"error");
                        }
                    }
                });


            },
            getAllResources:function(){
                $.ajax({
                    url:"/api/getAllResources",
                    type:"get",
                    success:function(data){
                        if(data.status === "success"){
                            app1.$data.menuList = data.message;
                        }
                    }
                })
            },
            renderHeader:function(createElement, _self ) {
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
                                    app1.$data.winTitle = "新增菜单";
                                    app1.$data.dialogMenWinVisible = true;
                                    app1.$data.menu = menuObj;
                                    app1.getAllResources();
                                } }
                            }
                        )
                    ]
                );
            }
        }
    });




});