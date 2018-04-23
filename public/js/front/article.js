$(function(){
    var id = $("#aid").val();
    var app = new Vue({
        el:"#article",
        data:{
            d:{
                tag:""
            },
            statistic:{},
            artTags:[],
            tagStyle:['','success','info','warning','danger'],
            arcClassList:[]
        },
        mounted:function(){
            this.getArticleById();
            this.updateArticleData({
                "id":id,
                "fieldName":"readCount"
            });
            this.getArticleStatistics();
            this.getArticleTagList();
            this.getArticleClassList();
        },
        updated:function(){
        },
        methods:{
            getArticleById:function(){
                var _this = this;
                $.get("/freeApi/article/"+id)
                .done(function(response){
                    if(response.status=="success"){
                        $("title").html(response.message.title);
                        _this.$data.d = response.message;
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
                if(!id){
                    return [];
                }
                for(var x=0,l=list.length;x<l;x++){
                    if(list[x].typeId == id){
                        if(list[x]["pId"] == "0"){
                            return [list[x]];
                        }else{
                            return this.filterClassList(list[x]["pId"],list).concat([list[x]]);
                        }
                    }
                }

            }
        }
    });
});