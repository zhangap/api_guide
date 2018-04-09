$(function(){
    var wdr = null;
    var app1 = new Vue({
        el:"#content",
        data:{
            formModel:{
                title:"",
                content:"",
                tag:"",
                publish:"1"
            },
            tagList:[],
            activeName:"",
            checkdTags:[]
        },
        created:function(){
            this.getTagList();
        },
        mounted:function(){
            wdr = new wangEditor("#editor");
            wdr.customConfig.uploadImgServer = '/api/upload-img';
            wdr.customConfig.uploadFileName = 'file';
        	wdr.customConfig.uploadImgHooks ={};
			wdr.create();
        },
        methods:{
            getTagList:function(){
                var _this = this;
                $.get("/api/getTagList",function(response){
                    if(response.status == "success"){
                        _this.filterTagList(response.message||[]);
                    }
                });
            },
            filterTagList:function(data){
                var arr = data.filter(function(currentValue,index,arr){
                    return currentValue.parentId == "0";
                });
                arr.forEach(function(element){
                    element.children = [];
                    data.forEach(function(n,index){
                        if(n.parentId == element.id) element.children.push(data.slice(index,index+1)[0]);
                    });
                });
                if(arr.length){
                    this.activeName = arr[0].id;
                }
                this.tagList = arr;
            },
            handleTabClick:function(e){
            },
            closeCheckdedTag:function(tag){
                for(var k = this.checkdTags.length-1;k>=0;k--){
                    if(tag.id == this.checkdTags[k].id){
                        this.checkdTags.splice(k,1);
                    }
                }
                for(var m =0,l = this.tagList.length;m < l;m++){
                    for(var n = 0,t = this.tagList[m].children.length;n < t;n++){
                        if(this.tagList[m].children[n].id == tag.id){
                            this.tagList[m].children[n].checked = false;
                            break;
                        }
                    }
                }
            },
            changeCheckState:function(vo){
                if(vo.checked && this.checkdTags.length<5){
                    this.checkdTags.push(vo);
                }else{
                    for(var k = this.checkdTags.length-1;k>=0;k--){
                        if(this.checkdTags[k].id == vo.id){
                            this.checkdTags.splice(k,1);
                        }
                    }
                }
            },
            publishWen:function(flag){
                var _this = this,tagid = [];
                this.checkdTags.forEach(function(element){
                    tagid.push(element.id);
                });
                var content = wdr.txt.html();
                var params = $.extend(true,{},this.formModel);
                params.content = content;
                params.publish = flag;
                params.tag = tagid.join(",");
                if(!params.title){
                    eleUtil.message("文章的标题不能为空","error");
                    return ;
                }
                if(!params.content){
                    eleUtil.message("文章的内容不能为空","error");
                    return ;
                }
                if(!params.tag){
                    eleUtil.message("文章的标签不能为空","error");
                    return ;
                }                
                eleUtil.loading("正在提交数据...");
                $.post("/api/publishArticle",params)
                 .done(function(res){
                    eleUtil.closeLoading();
                    if(res.status == "success"){
                        _this.checkdTags = [];
                        _this.formModel.title = '';
                        wdr.txt.clear();
                    }else{
                        eleUtil.message("发布失败","error"); 
                    }
                })
                 .fail(function(a,b,c){
                    eleUtil.closeLoading();
                    eleUtil.message("发布失败","error");
                });
            }
        }
    });
    window.appx = app1;
});