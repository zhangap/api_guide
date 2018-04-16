$(function(){
    var tag ={
        id:"",
        parentId:"",
        level:"0",
        classify:"",
        tagName:"",
        memo:"",
        levelDisable:false
    };
    var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[],
            formModel:{
                classify:"",
                tagName:""
            },
            newTag:{
                id:"",
                parentId:"",
                level:"0",
                classify:"",
                tagName:"",
                memo:"",
                levelDisable:false
            },
            tagClassify:[],
            _row:[],
            rules:{
                level:[{required: true,message: '请选择类别', trigger: 'blur'}],
                memo:[{required: true, message: '请输入描述', trigger: 'blur'}],
                tagName:[{required: true, message: '请输入名称', trigger: 'blur'}]
                //classify:[{required: true, message: '请输入分类名称', trigger: 'blur'}]
            },
            editTagId:'',
            confirmVisible:false,
            dialogTile:"新增标签",
            dialogMenWinVisible:false,
            page:$.extend(true,{},eleUtil.page)
        },
        created:function(){
            this.getTagList();
            this.getClassify();
        },
        mounted:function(){
            $(this.$refs.tagName.$el).on('keyup',$.proxy(this.submitForm,this));
        },
        methods:{
            submitForm:function(e){
                if((e.target.nodeName.toUpperCase()==="INPUT" && e.keyCode === 13)||!e.keyCode){
                    this.getTagList();
                }
            },
            searchList:function(){
                this.getTagList();
            },
            batchDelete:function(){
                var _this = this;
                if(this.$data._row.length == 0){
                    return eleUtil.message("请先勾选删除项且不能批量删除顶级标签","error");
                }else{
                    this.confirmVisible = true;
                    this.deleteProcess({tagId:this.$data._row.join(",")});
                }  
            },
            closeDialog:function(name){
                this.dialogMenWinVisible = false;
                this.$data.editTagId = '';
                this.$data.newTag = $.extend(true,{},tag);
                this.$refs[name].resetFields();
            },
            submitDialog:function(name){
                var _this = this;
                var params = $.extend(true,{},this.newTag);
                params.id = this.editTagId;  
                this.$refs[name].validate(function(validate){
                    if(validate){
                        $.post("/api/mergeTag",params).done(function(data){
                            if(data.status === "success"){
                                eleUtil.message(data.message,"success");
                                _this.dialogMenWinVisible = false;
                                _this.$data.editTagId = '';
                                _this.getTagList();
                                _this.getClassify();
                            }else{
                                eleUtil.message(data.message,"error");
                            }
                        });
                    }
                });
            },
            renderHeader:function(createElement, _self ) {
                var _this = this;
                return createElement(
                    'span',
                    ["操作",
                        createElement('a', {
                                'class': 'fa fa-plus-circle ml10 f18',
                                attrs:{
                                    "title":"新增标签",
                                    'href':'javascript:;'
                                },
                                on: { click: function () {
                                    _this.dialogTile = "新增标签";
                                    _this.$data.newTag = $.extend(true,{},tag);
                                    _this.dialogMenWinVisible = true;
                                } }
                            }
                        )
                    ]
                );
            },
            getTagList:function(){
                var _this = this;
                var poly = {};
                $.extend(true,poly,this.formModel,this.page);
                eleUtil.loading({target:".el-table"});
                $.get("/api/getTagList",poly,function(data){
                    eleUtil.closeLoading();
                    if(data.status === "success"){
                        _this.tableData = data.message;
                        _this.page.currentPage = data.page.currentPage;
                        _this.page.total = data.page.total;
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                });
            },
            sizeChangeHandler:function(pSize){
                this.page.pageSize =pSize;
                this.getTagList();
            },
            currentChangeHandler:function(cPage){
                this.page.currentPage = cPage;
                this.getTagList();
            },
            editTagHandler:function(row){
                var _this = this;
                this.dialogTile = "编辑标签"
                this.dialogMenWinVisible = true;
                this.newTag = $.extend(true,{
                    level:row["parentId"]=="0"?"0":"1",
                    classify:row["parentId"],
                    levelDisable:true
                },row);
                this.editTagId = row.id;
            },
            deleteTagHandler:function(row){
                var _this = this;
                this.confirmVisible = true;
                this._row = [row.id];
                return this;
            },
            cancelHandler:function(){
                this.confirmVisible = false;
            },
            deleteHandler:function(){
                var row = this._row,_this = this;
                if(row[0] =="0"){
                    $.get("/api/getTagList",{parentId:row[0]}).done(function(response){
                        if(response.status == "success"){
                            if(response.message.length!=0){
                                eleUtil.message("标签下有子级标签不能删除","error");
                            }
                        }
                    });
                }else{
                    _this.deleteProcess({tagId:row.join(",")});
                }
            },
            deleteProcess:function(row){
                var _this = this;
                _this.confirmVisible = false;
                $.get("/api/deleteTagById",row,function(data){
                    if(data.status === "success"){
                        _this.$data._row = [];
                        _this.getTagList();
                        _this.getClassify();
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                });
            },
            getClassify:function(){
                var _this = this;
                $.get("/api/getTagList",{parentId:"0"},function(data){
                    if(data.status === "success"){
                        var cms = data.message||[];
                        _this.tagClassify = cms;
                    }
                });
            },
            selectRow:function(selection, row){
                if(selection.length){
                    if(row.parentId == "0"){
                        this.$refs.list.toggleRowSelection(row,false);
                        eleUtil.message("不能批量删除顶级标签","error");
                    }else{
                        this.$data._row.push(row.id);
                    } 
                }else{
                    var index = this.$data._row.indexof(row.id);
                    if(index>=0) this.$data._row.splice(index,1);
                }
            },
            selectAll:function(selection){
                var ids = [],_this = this,rows = [];
                selection.forEach(function(element){
                    if(element.parentId == "0"){
                        //_this.$refs.list.toggleRowSelection(element,false);
                    }else{
                        ids.push(element.id);
                    } 
                });
                this.$data._row = ids;
            }
        }
    });
    window.appx =app1;
});