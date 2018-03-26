$(function(){
    var app = new Vue({
        el:'#content',
        data:{
            documentType:[]
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
                            _this.$data.documentType = res.data;
                        }else{
                            eleUtil.message(res.message,'error');
                        }
                    }
                })
            }
        }
    })
});