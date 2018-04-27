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
            },
            talkList:[],
            commentWord:'',
            isLoged:false,
            scrollPos:{}
        },
        computed:{
            wordCount:function(){
                var len = this.commentWord.length;
                return len>=255?0:(255-len);
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
            this.$data.scrollPos = $("#nav").offset();
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
                        _this.$nextTick(function(){
                            _this.initNavigation();
                        });
                        _this.getLoginState();
                        _this.getArticleTagList();
                        _this.getArticleClassList();
                        _this.getUserTopArticle();
                        _this.getCommentList();
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
            },
            getCommentList:function(){
                var _this = this;
                var params = {
                    id:this.$data.d.id
                };
                $.get("/freeApi/getCommentsByArticleId",params)
                 .done(function(res){
                    if(res.status == "success"){
                        _this.$data.talkList = res.message;
                    }
                 });
            },
            controlCommentLength:function(){
                this.$data.commentWord = this.$data.commentWord.substr(0,255);
            },
            addComment:function(){
                var _this = this;
                var params = {
                    articleId:this.$data.d.id,
                    content:this.commentWord
                };
                $.post("/api/addArticleMessage",params)
                 .done(function(res){
                    if(res.status == "success"){
                        _this.$data.commentWord = '';
                        _this.getCommentList();
                    }
                 });                
            },
            getLoginState:function(){
                var _this = this;
                $.get("/api/loginInfo",function(res){
                    if(res.status == "success"){
                        _this.$data.isLoged = true;
                    }
                });
            },
            initNavigation:function(){
                //初始化导航窗格
                if($("#artc").find("h1,h2").size()==0) return $("#nav").hide();
                var ajs = new AutocJS({
                    article:"#artc",
                    title:"文章目录",
                    isAnimateScroll:true,
                    selector:"h1,h2",
                    container:"#nav",
                    SWITCHER:"",
                    TOP:'<a class="autocjs-top" href="#top" aria-hidden="true">回到顶部</a>',
                    hasChapterCodeInDirectory:false
                });
                window.addEventListener('scroll',this.scrollHandle);
                window.addEventListener('resize',this.resizeHandle);
            },
            scrollHandle:function(){
               var dst = $(document).scrollTop(),pos = this.$data.scrollPos;
               if(dst>pos.top){
                $("#autocjs-0").css({
                    position:"fixed",
                    left:pos.left,
                    top:10
                });
               }else{
                $("#autocjs-0").css({
                    position:"absolute",
                    left:0,
                    top:0
                });   
               }
            },
            resizeHandle:function(){
                this.$data.scrollPos = $("#nav").offset();
                this.scrollHandle();
            }
        }
    });
    window.appx = app;
});