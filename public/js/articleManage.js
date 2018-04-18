$(function(){
   var wdr = null;
   var _docList = [];
   function filterDocumentData(data){
        $.each(data,function(i,n){
            if(n.children.length == 0){
                delete n.children;
            }else{
                _docList =  _docList.concat(n.children.slice());
                filterDocumentData(n.children);
            }
        });
    }
    function recuriveTree(id,data){
        var ret = [],one = null;
        for(var i=0,l=data.length;i<l;i++){
            if(data[i]["typeId"] == id){
                one = data[i];
                break;
            }
        }
        ret.unshift(one.typeId);
        if(one["pId"]=="0"){
            return ret;
        }else{
            return recuriveTree(one.pId,data).concat(ret);
        }
    } 
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
            dialogArticleVisible:false,
            page:$.extend(true,{},eleUtil.page),
            editModel:{
                title:"",
                content:"",
                tag:"",
                publish:"1",
                classType:[]
            },
            activeName:"",
            checkdTags:[],
            editRow:null,
            preView:false,
            options:[],
            props:{
                label:"typeName",
                value:"typeId"
            }
        },
        created:function(){
            this.getTagList();
            this.getArticleList();
            this.getDocumentType();
        },
        mounted:function(){ 
            wdr = new wangEditor("#editor");
            wdr.customConfig.uploadImgServer = '/api/upload-img';
            wdr.customConfig.uploadFileName = 'file';
        	wdr.customConfig.uploadImgHooks ={};
			wdr.create();  
        },
        methods:{
            submitForm:function(){
                this.getArticleList();
            },
            getArticleList:function(){
                var _this = this;
                var params = $.extend(true,{},this.formModel,this.page);
                eleUtil.loading({target:".el-table"});
                $.get("/api/getArticleList",params,function(res){
                    eleUtil.closeLoading();
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
            sizeChangeHandler:function(pSize){
                this.page.pageSize =pSize;
                this.getArticleList();
            },
            currentChangeHandler:function(cPage){
                this.page.currentPage = cPage;
                this.getArticleList();
            },
            formatTags:function(row, column, cellValue){
                var cellkeys = [],cellValue = cellValue.split(','),child = null;
                for(var m = 0,l = cellValue.length;m < l;m++ ){
                    for(var n = 0,k = this.tagList.length;n<k;n++){
                        child = this.tagList[n].children;
                        for(var p =0,w = child.length;p<w;p++){
                            if(cellValue[m] == child[p].id){
                                cellkeys.push(child[p].tagName);
                                break;
                            }
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
            editItemHandler:function(row){
                this.editRow = row;
                this.filterItemTags();
                var _doc = recuriveTree(row.docType,_docList);
                this.editModel.classType = _doc;
                this.$data.editModel.title = row.title;
                wdr.txt.html(this.$data.editRow.content);
                this.dialogArticleVisible = true;
            },
            filterItemTags:function(){
                var id = this.$data.editRow.tag,child = null;
                for(var m=0,l=this.tagList.length;m<l;m++){
                    child = this.tagList[m].children;
                    for(var n=0,k=child.length;n<k;n++){
                        if(id.indexOf(child[n].id)>=0){
                            child[n].checked = true;
                            this.checkdTags.push(child[n]);
                        }
                    }
                }
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
            },
            handleTabClick:function(){},
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
            goback:function(){
                this.checkdTags = [];
                this.dialogArticleVisible =false;
            },
            publishWen:function(){
                var _this = this,tagid = [];
                this.checkdTags.forEach(function(element){
                    tagid.push(element.id);
                });
                var params = {
                    id:this.editRow.id,
                    title:this.editModel.title,
                    content:wdr.txt.html(),
                    publish:this.editRow.publish,
                    tag:tagid.join(",")
                };
                if(this.$data.editModel.classType.length>0){
                    params.classType = this.$data.editModel.classType.join(",");
                }
                if(!params.classType||!params.title||!params.content||!params.tag){
                    eleUtil.message("分类、标题、内容及标签不能为空","error");
                    return;
                }
                $.post("/api/publishArticle",params)
                .done(function(res){
                    if(res.status == "success"){
                        _this.$data.editRow = null;
                        _this.goback();
                        _this.getArticleList();
                    }
                });
            },
            preViewItemHandler:function(row){
                this.preView = true;
                $("#pre").html(row.content);
                $('pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                });
            },
            preViewBack:function(){
                this.preView = false;
                $("#pre").empty();
            },
            handleChange:function(value){
                console.log(value);
            },
            getDocumentType:function () {
                var _this = this;
                $.ajax({
                    url:'/api/documentTypeList',
                    type:'get',
                    success:function(res){
                        if(res.status === 'success'){
                            var list = res.data;
                            _docList = list.slice();
                            filterDocumentData(list);
                            _this.$data.options = list;
                        }else{
                            eleUtil.message(res.message,'error');
                        }
                    }
                });
            }
        }
   });
});