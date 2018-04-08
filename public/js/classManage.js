var classForm = {
    uuid:"",
    type:"",
    id:"",
    name:"",
    memo:""
};

var app1 = new Vue({
    el:"#content",
    data:{
        tableData:[],
        classForm:classForm,
        editRowId:"",
        editState:false,
        page:$.extend(true,{},eleUtil.page),
        confirmVisible:false,
        highlight:true,
        _row:[]
    },
    created:function(){
        this.getClassList();
    },
    methods:{
        currentChangeHandler:function(cPage){
            this.$data.page.currentPage = cPage;
            this.getClassList();
        },
        sizeChangeHandler:function(pSize){
            this.$data.page.pageSize =pSize;
            this.getClassList();
        },
        searchList:function(){
            this.getClassList();
        },
        batchDelete:function(){ //批量删除
            if(this.$data._row.length){
                this.$data.confirmVisible = true;
            }else{
                eleUtil.message("请至少选择一项","warn");
            }
        },
        selectAll:function(rows){ //全选
            var _this = this;
            this.$data._row = [];
            rows.forEach(function(item,i){
                _this.$data._row[i] = item.uuid;
            });
        },
        selectRow:function(selection,row){
            if(selection.length){
                this.$data._row.push(row.uuid);
            }else{
                var index = this.$data._row.indexof(row.uuid);
                this.$data._row.splice(index,1);
            }
        },
        editHandler:function(row,event){
            if(!row.edit){
                row.edit = true;
                this.$data.editState = true;
            }else{ //保存和更新
                this.$data.editState = false;
                $.ajax({
                    type:"post",
                    data:{"cItem":JSON.stringify(row)},
                    url:"/api/saveClass",
                    success:function(data){
                        if(data.status === "error"){
                            console.log(data.message);
                        }else{
                            eleUtil.message(data.message,"success");
                            row.edit = false;
                        }
                    }
                })

            }

        },
        deleteHandler:function(row){
            this.$data.editRowId = row.uuid;
            this.$data.confirmVisible = true;
        },
        cancelHandler:function(){
            this.$data.confirmVisible = false;
            eleUtil.message("取消删除","info");
        },
        executeDelete:function(){
            this.deleteClassList();
        },
        getClassList:function(){
            var _this = this;
            $.ajax({
                type:"get",
                url:"/api/getClassList?type="+(this.$data.classForm.type),
                data:this.$data.page,
                success:function(data){
                    if(data.status === "success"){
                        var result = [];
                        for(var i =0,len = data.message.length;i<len;i++){
                            var item = data.message[i];
                            item.edit = false;
                            result.push(item);
                        }
                        _this.$data.tableData = result;
                        _this.page.currentPage = data.page.currentPage;
                        _this.page.total = data.page.total;
                    }
                }
            })
        },
        renderHeader:function(createElement, _self ) {
            var _this = this;
            return createElement(
                'span',
                ["操作",
                    createElement('a', {
                            'class': 'fa fa-plus-circle ml10 f18',
                            'href':'javascript:;',
                            on: { click: function () {
                                if( _this.$data.editState){
                                    eleUtil.message("请保存已经添加的行数据","warn");
                                    return;
                                }
                                _this.$data.tableData.unshift({
                                    uuid:"",
                                    type:"",
                                    id:"",
                                    name:"",
                                    memo:"",
                                    edit:true
                                });
                                _this.$data.editState = true;
                            } }
                        }
                    )
                ]
            );
        },
        deleteClassList:function(){
            var ids = this.$data.editRowId ? [this.$data.editRowId] : this.$data._row;
            $.ajax({
                type:"post",
                url:"/api/deleteClass",
                data:{"ids":JSON.stringify(ids)},
                success:function(data){
                    if(data.status == "error"){
                        eleUtil.message("操作失败","error");
                    }else{
                        eleUtil.message(data.message,"success");
                        setTimeout(function(){
                            location.reload();
                        },200);

                    }
                }

            })
        }
    }
});