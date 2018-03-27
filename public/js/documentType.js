$(function(){
    var app = new Vue({
        el:'#content',
        data:{
            typeList:[],
            dialogVisible:false,
            winTitle:'新增',
            typeData:{
                typeName:'',
                pId:'',
                sortNum:'',
                note:''
            }
        },
        created:function () {
            this.getDocumentType();
        },
        methods:{
            getDocumentType:function () {
                var _this = this;
                $.ajax({
                    url:'/api/documentTypeList',
                    type:'get',
                    success:function(res){
                        if(res.status === 'success'){
                            _this.$data.typeList = res.data;
                        }else{
                            eleUtil.message(res.message,'error');
                        }
                    }
                })
            },
            addType:function (node,data,handlerType) {
                this.$data.dialogVisible = true;
                this.$data.typeData = data;
                if(handlerType === 'add'){
                    this.$data.winTitle = '新增文档类型';
                    this.$data.typeData = {
                        pId:data.typeId,
                        preName:data.typeName,
                        sortNum:'1',
                        note:''
                    }
                }else if(handlerType === 'edit'){
                    this.$data.winTitle = '编辑文档类型';
                    this.$data.typeData = data;
                }
            },
            removeType:function (node,data) {
                console.log('node',node);
                console.log('data',data)
            },
            closeMenuWinHandler:function () {
                this.$data.dialogVisible = false;
            },
            submitMenuHandler:function () {
                var _this = this;
                console.log(this.$data.typeData)
                $.ajax({
                    url:"/api/saveType",
                    type:"post",
                    data:this.$data.typeData,
                    success:function(data){
                        if(data.status === "success"){
                            eleUtil.message(data.message,"success");
                            _this.$data.dialogVisible = false;
                            setTimeout(function(){
                                location.reload();
                            },500);
                        }else{
                            eleUtil.message(data.message,"error");
                        }
                    }
                });
            }
        }
    })
});