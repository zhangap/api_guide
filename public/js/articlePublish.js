$(function(){
    var wdr = null;
    var app1 = new Vue({
        el:"#content",
        data:{
            formModel:{
                title:""
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
	        wdr.customConfig.uploadImgServer = '/upload-img'
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
            }
        }
    });
    window.appx = app1;
});