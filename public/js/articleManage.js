$(function(){
   var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[],
            formModel:{
                title:"",
                date:""
            },
            tagList:[],
            confirmMessage:"",
            confirmType:-1,// 0 删除 1 批删 2 私密/公开
            confirmVisible:false,
            secrecRow:null,
            deleteRow:[],
            page:$.extend(true,{},eleUtil.page)
        },
        created:function(){
            this.getTagList();
            this.getArticleList();
        },
        mounted:function(){   
        },
        methods:{
            submitForm:function(){
                this.getArticleList();
            },
            getArticleList:function(){
                var _this = this;
                var params = $.extend(true,{},this.formModel,this.page);
                $.get("/api/getArticleList",params,function(res){
                    if(res.status == "success"){
                        _this.$data.tableData = res.message;
                        _this.page.currentPage = res.page.currentPage;
                        _this.page.total = res.page.total;
                    }
                });
            },
            getTagList:function(){
                var _this = this;
                $.get("/api/getTagList",function(response){
                    if(response.status == "success"){
                       _this.$data.tagList = response.message;
                    }
                });
            },
            sizeChangeHandler:function(pSize){
                this.page.pageSize =pSize;
                this.getArticleList();
            },
            currentChangeHandler:function(cPage){
                this.page.currentPage = cPage;
                this.getArticleList();
            },
            foramtTags:function(row, column, cellValue){
                var cellkeys = [],cellValue = cellValue.split(',');
                for(var m = 0,l = cellValue.length;m < l;m++ ){
                    for(var n = 0,k = this.tagList.length;n<k;n++){
                        if(cellValue[m] == this.tagList[n].id){
                            cellkeys.push(this.tagList[n].tagName);
                            break;
                        }
                    }
                }
                return cellkeys.join(",");
            },
            batchDelete:function(){
                if(!this.$data.deleteRow.length){
                    eleUtil.message("请先选择待删除的项","error");
                    return ;
                }
                this.confirmMessage = '确定批量删除这些文章吗？删除后将不能回复！';
                this.confirmType = 1;
                this.confirmVisible = true;
            },
            publish2Secret:function(row){
                var publish = row.publish;
                var msg = "确定将这篇文章设为私密吗?";
                if(publish == 0){
                    msg = "确定公开这篇文章吗";
                }
                this.confirmMessage = msg;
                this.confirmVisible = true;
                this.secrecRow = row;
                this.confirmType = 2;
            },
            editItemHandler:function(){

            },
            deleteItemHandler:function(row){
                this.confirmMessage = '确定删除这篇文章吗？删除后将不能回复！';
                this.deleteRow = [row.id];
                this.confirmVisible = true;
                this.confirmType = 0;
            },
            cancelHandler:function(){
                this.confirmMessage = '';
                this.confirmVisible = false;
                this.confirmType = -1;
            },
            confirmHandler:function(){
                var tp = this.confirmType;
                switch(tp){
                    case 0:
                    case 1:
                        this.postDelete();
                        break;
                    case 2:
                        this.postPublicOrSecret();
                        break;
                    default:
                        this.confirmType = -1;
                        break;
                }
            },
            postPublicOrSecret:function(){
                var _this = this;
                this.confirmVisible = false;
                this.confirmType = -1;
                var params = $.extend(true,{},this.secrecRow);
                params.publish = (params.publish==0)?1:0;
                $.post("/api/public2Secret",params)
                 .done(function(res){
                    if(res.status == "success"){
                        _this.secrecRow = null;
                        _this.getArticleList();
                    }
                });
            },
            postDelete:function(){
                var _this = this;
                this.confirmVisible = false;
                this.confirmType = -1;
                var params = {
                    id:this.deleteRow.join(",")
                };
                $.post("/api/deleteArticleById",params)
                .done(function(res){
                    if(res.status == "success"){
                        _this.deleteRow = [];
                        _this.getArticleList();
                    }
                });
            },
            selectRow:function(selection, row){
                if(selection.length){
                    this.$data.deleteRow.push(row.id);
                }else{
                    var index = this.$data._row.indexof(row.id);
                    this.$data.deleteRow.splice(index,1);
                }
            },
            selectAll:function(selection){
                var ids = [];
                selection.forEach(function(element){
                    ids.push(element.id);
                });
                this.$data.deleteRow = ids;
            }
        }
   });
});