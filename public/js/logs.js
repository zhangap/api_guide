$(function () {
    var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[
            ],
            page:$.extend(true,{},eleUtil.page),
            admin:{
                name:""
            }
        },
        created:function(){
            this.queryLogs();
        },
        methods:{
            queryLogs:function() {
                var _this=this;
                $.ajax({
                    url:"/api/logs",
                    type:"get",
                    data: $.extend(true,{},_this.page,{admin:_this.admin.name}),
                    success:function (data) {
                        if(data.status=="success"){
                            _this.$data.tableData=data.message;
                            _this.$data.page.currentPage = data.page.currentPage;
                            _this.$data.page.total = data.page.total;
                        }
                    }
                });
            },
            sizeChangeHandler:function (pSize) {
                this.$data.page.pageSize =pSize;
                this.queryLogs();
            },
            currentChangeHandler:function (cPage) {
                this.$data.page.currentPage = cPage;
                this.queryLogs();
            }
        }
    })
})