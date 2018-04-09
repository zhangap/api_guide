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
            publish2Secrect:function(){
                //
            }
        }
   });
});