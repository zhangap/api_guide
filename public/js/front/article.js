$(function(){
    var id = $("#aid").val();
    hljs.initHighlightingOnLoad();
    var app = new Vue({
        el:"#article",
        data:{
            d:{
                tag:"",
                readCount:0
            },
            statistic:{},
            artTags:[],
            tagStyle:['','success','info','warning','danger'],
            arcClassList:[],
            topList:{
                _numList:[],
                _dateList:[]
            }
        },
        mounted:function(){
            this.getArticleById();
            this.updateArticleData({
                "id":id,
                "fieldName":"readCount"
            });
            this.getArticleStatistics();
        },
        updated:function(){
            $('pre code').each(function(i, block) {
                hljs.highlightBlock(block);
            });
        },
        methods:{
            getArticleById:function(){
                var _this = this;
                $.get("/freeApi/article/"+id)
                .done(function(response){
                    if(response.status=="success"){
                        $("title").html(response.message.title);
                        _this.$data.d = response.message;
                        //依赖文章的其他字段
                        _this.getArticleTagList();
                        _this.getArticleClassList();
                        _this.getUserTopArticle();
                    }
                });
            },
            updateArticleData:function(dd){
                var _this = this;
                $.post("/freeApi/updateArticleCountField",dd)
                .done(function(response){
                    if(response.status=="success"){
                    }else{
                    }
                });
            },
            getArticleTagList:function(){
                var _this = this;
                $.get("/freeApi/database/3",function(response){
                    if(response.status == "success"){
                        _this.filterTagList(response.message||[]);
                    }
                });
            },
            filterTagList:function(list){
                var tags = this.$data.d.tag||"";
                if(!tags) return ;
                tags = tags.split(",");
                var zTag = tags.map(function(value,index){
                    return list.find(function(dd){
                        return value == dd.id;
                    });
                });
                this.$data.artTags = zTag;
            },
            getArticleStatistics:function(){
                var _this = this;
                var params = {
                    id:id,
                    _mid:Math.floor(Math.random()*1000)
                };
                $.get("/freeApi/getArticleStatistics",params)
                .done(function(res){
                    if(res.status == "success"){
                        _this.$data.statistic = res.message;
                    }
                });
            },
            getArticleClassList:function(){
                var _this = this;
                $.get("/freeApi/database/1",function(response){
                    if(response.status == "success"){
                       var classList =  _this.filterClassList(_this.$data.d.docType,response.message||[]);
                       _this.$data.arcClassList = classList;
                    }
                });
            },
            filterClassList:function(id,list){
                if(!id) return [];
                for(var x=0,l=list.length;x<l;x++){
                    if(list[x].typeId == id){
                        if(list[x]["pId"] == "0"){
                            return [list[x]];
                        }else{
                            return this.filterClassList(list[x]["pId"],list).concat([list[x]]);
                        }
                    }
                }
            },
            getUserTopArticle:function(){
                var _this = this;
                var params = {
                    pageSize:5,
                    author:this.$data.d.author
                };
                $.get("/freeApi/topArticleList",params,function(resp){
                    if(resp.status == "success"){
                        _this.$data.topList = resp.message;
                    }
                });
            }
        }
    });
});