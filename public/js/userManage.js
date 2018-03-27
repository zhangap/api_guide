var userform={
    username:"wuhan",
    userrole:"",
    phone:"",
    email:"",
    state:""
};
var app1 = new Vue({
    el:"#content",
    data:{
        userForm:userform,
        tableData:[],
        page:$.extend(true,{},eleUtil.page)
    },
    methods:{
        searchList:function(){
            this.getUserList();
        },
        sizeChangeHandler:function(pSize){
            this.page.pageSize =pSize;
            this.getUserList();
        },
        currentChangeHandler:function(cPage){
            this.page.currentPage = cPage;
            this.getUserList();
        },
        getUserList:function(){
            var _this = this;
            var params = $.extend(true,{},userform,this.page);
            $.get("/api/getUsersList",params,function(data){

            });
        },
        renderHeader:function(createElement, _self ) {
            return createElement(
                'span',
                ["操作",
                    createElement('a', {
                            'class': 'fa fa-plus-circle ml10 f18',
                            'href':'javascript:;',
                            on: { click: function () {
                                app1.$message({
                                    message: '这是一条新增操作',
                                    type: 'success'
                                });
                            } }
                        }
                    )
                ]
            );
        }
    }
});