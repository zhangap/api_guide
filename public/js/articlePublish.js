$(function(){
    var wdr = null;
    var app1 = new Vue({
        el:"#content",
        data:{
            formModel:{
                title:""
            },
            tagList:[]
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
                this.tagList = arr;
            }
        }
    });
    window.appx = app1;
});