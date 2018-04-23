$(function(){
    var _SIZECOUNT = 10;
    var app = new Vue({
        el:"#ctx",
        data:{
            d:{
                _numList:[],
                _dateList:[]
            }
        },
        created:function(){
            var _this = this;
            _this.getPageList();
        },
        mounted:function(){},
        methods:{
            getPageList:function(){
                var _this = this;
                $.get("/freeApi/topArticleList",{pageSize:_SIZECOUNT})
                .done(function(res){
                   if(res.status == "success"){
                        _this.$data.d = res.message;
                   }
                });
            }
        }
    });
});