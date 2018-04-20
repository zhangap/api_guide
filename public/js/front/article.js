$(function(){
    var id = $("#aid").val();
    var app = new Vue({
        el:"#article",
        data:{
            d:{}
        },
        mounted:function(){
            this.getArticleById();
            this.updateArticleData({
                "id":id,
                "fieldName":"readCount"
            });
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
            }
        }
    });
});