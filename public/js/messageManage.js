$(function(){
    var queryModel = {
        keyWord:"",
        dates:[]
    };
    var app = new Vue({
        el:"#content",
        data:{
            formQy:queryModel,
            tableData:[],
            page:$.extend(true,{},eleUtil.page),
            confirmVisible:false,
            _row:[]
        },
        created:function(){
            this.getMessageList();
        },
        mounted:function(){
        },
        methods:{
            searchList:function(){
                this.getMessageList();
            },
            getMessageList:function(){
                var _this = this;
                var params = $.extend(true,{},queryModel,this.page);
                params.dates = params.dates.join(',');
                eleUtil.loading({target:".el-table"});
                $.get("/api/getMessageList",params)
                 .done(function(response){
                    eleUtil.closeLoading();
                    if(response.status == "success"){
                        _this.$data.tableData = response.message;
                        _this.page.currentPage = response.page.currentPage;
                        _this.page.total = response.page.total;
                    }
                });
            },
            batchDelete:function(){
                if(!this.$data._row.length){
                    return eleUtil.message("请选择需要删除的项","error");
                }
                this.confirmVisible = true;
            },
            selectRow:function(selection,row){
                if(selection.length){
                    this.$data._row.push(row.uid);
                }else{
                    var index = this.$data._row.indexof(row.uid);
                    this.$data._row.splice(index,1);
                }
            },
            selectAll:function(selection){
                var ids = [];
                selection.forEach(function(element){
                    ids.push(element.uid);
                });
                this.$data._row = ids;
            },
            deleteTabHandler:function(row){
                this.$data._row = [row.uid];
                this.$data.confirmVisible = true;
            },
            sizeChangeHandler:function(){
                this.page.pageSize =pSize;
                this.getMessageList();
            },
            currentChangeHandler:function(){
                this.page.currentPage = cPage;
                this.getMessageList();
            },
            cancelHandler:function(){
                this.$data._row = [];
                this.$data.confirmVisible = false;   
            },
            deleteHandler:function(){
                var _this = this;
                this.$data.confirmVisible = false;
                $.post("/api/deleteMessageById",{uid:this.$data._row.join(',')})
                 .done(function(response){
                    if(response.status == "success"){
                        _this.$data._row = [];
                        _this.getMessageList();
                    }
                 });
            }
        }
    });
});