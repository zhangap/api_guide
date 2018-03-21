$(function(){


    var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[],
            dialogVisible:false,
            dialogMenWinVisible:false, //新增和编辑窗口显示变量
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
            deleteMenu:function(menuId){
                this.$data.dialogVisible = true;
                this.$data.operateMenuId = menuId;
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
                                    alert("新增菜单");
                                    _this.$data.dialogMenWinVisible = true;
                                } }
                            }
                        )
                    ]
                );
            }
        }
    });



});