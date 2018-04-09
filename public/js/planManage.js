var planForm = {
    projectId:"",
    userId:"",
    startTime:"",
    endTime:"",
    state:""
};

var app1 = new Vue({
    el:"#content",
    data:{
        planForm:planForm,
        tableData:[],
        editRowId:"",
        projectList:[], //项目集合
        levelList:[],
        stateList:[],
        userList:[],
        editRow:null,
        editNum:0,
        page:$.extend(true,{},eleUtil.page),
        confirmVisible:false,
    },
    created:function(){
        this.getPlanList();
        this.getProjectList();
        this.getClassByType("level","levelList");
        this.getClassByType("status","stateList");
        this.getUserList();
    },
    filters:{
        fmtProject:function(val){
            var data = app1.$data.projectList;
            for(var i =0;i< data.length;i++){
                if(val === data[i].projectId){
                    return   data[i].projectName;
                }
            }
        },
        fmtClass:function(val,key){
            var data = app1.$data[key];
            for(var i =0;i< data.length;i++){
                if(val == data[i].id){
                    return data[i].name;
                }
            }
        },
        fmtPerson(val){
            var data = app1.$data.userList;
            for(var i =0;i< data.length;i++){
                if(val === data[i].userId){
                    return data[i].realName;
                }
            }
        }

    },
    methods:{
        addHandler:function(){
            if(this.$data.editNum){
                eleUtil.message("您有未保存的记录，请先保存，再进行添加","warning");
                return;
            }
            this.$data.editRow = {
                uuid:"",
                projectId:"",
                projectSub:"",
                level:"",
                userId:"",
                detail:"",
                startTime:eleUtil.formatDate(new Date(),"yyyy-MM-dd"),
                endTime:eleUtil.formatDate(new Date(),"yyyy-MM-dd"),
                state:"",
                memo:"",
                edit:true
            };
            this.$data.tableData.unshift(this.$data.editRow);
            this.$data.editNum +=1;
        },
        updateState:function(row){
            $.ajax({
                type:"get",
                url:"/api/updateState?uuid="+row.uuid + "&state="+row.state,
                success:function(data){
                    if(data.status === "success"){
                        eleUtil.message(data.message,"success");
                    }else{
                        eleUtil.message(data.message,"error");
                    }
                }
            })
        },
        saveHandler:function(){
            var _this = this;
            if(!(this.$data.editRow && this.$data.editNum)){
                eleUtil.message("没有要保存的记录","warning");
            }else{
                var saveData =this.$data.editRow;
                if(!saveData.projectId){
                    eleUtil.message("请选择项目","warning");
                }else if(!saveData.projectSub){
                    eleUtil.message("请填写子项目名称","warning");
                }else{
                    $.ajax({
                        type:"post",
                        url:"/api/savePlan",
                        data:{"saveData":JSON.stringify(saveData)},
                        success:function(data){
                            if(data.status ==="success"){
                                eleUtil.message(data.message,"success");
                                _this.$data.editRow.edit = false;
                                _this.$data.editNum = 0;
                            }else{
                                eleUtil.message(data.message,"error");
                            }
                        }
                    })
                }
            }
        },
        editHandler:function(){ //编辑
            if(this.$data.editNum){
                eleUtil.message("您有未保存的记录，请先保存，再进行添加","warning");
                return;
            }
            if(this.$data.editRow){
                this.$data.editRow.edit = true;
                this.$data.editNum +=1;
            }else{
                eleUtil.message("请选择要修改的行记录","warning");
            }
        },
        delHandler:function(){
            if(this.$data.editRow){
                this.$data.confirmVisible = true;
            }
        },
        searchList:function(){
            this.getPlanList();
        },
        currentChangeHandler:function(cPage){
            this.$data.page.currentPage = cPage;
            this.getPlanList();
        },
        sizeChangeHandler:function(pSize){
            this.$data.page.pageSize =pSize;
            this.getPlanList();
        },
        handleCurrentChange:function(row){
            this.$data.editRow = row;
        },
        cancelHandler:function(){
            this.$data.confirmVisible = false;
        },
        executeDelete:function(){
            $.ajax({
                type:"get",
                url:"/api/delPlanById?uuid="+this.$data.editRow.uuid,
                success:function(data){
                    if(data.status === "error"){
                        eleUtil.message(data.message,"error");
                    }else{
                        eleUtil.message(data.message,"success");
                        setTimeout(function(){
                            location.reload();
                        },200);
                    }
                }
            })
        },
        getPlanList:function(){
            var _this = this;
            $.ajax({
                type:"get",
                url:"/api/getPlanList",
                data:$.extend(true,{},this.$data.page,planForm),
                success:function(data){
                    if(data.status ==="success"){
                        for(var i =0,len = data.message.length;i<len;i++){
                            data.message[i].edit = false;
                        }
                        _this.$data.tableData = data.message;
                        _this.page.currentPage = data.page.currentPage;
                        _this.page.total = data.page.total;
                    }

                }
            })
        },
        getProjectList:function(){
            var _this = this;
            $.ajax({
                type:"get",
                url:"/api/getProjectList",
                success:function(data){
                    if(data.status ==="success"){
                        _this.$data.projectList = data.message;
                    }
                }
            })
        },
        getClassByType:function(type,key){
            var _this = this;
            $.ajax({
                type:"get",
                url:"/api/getClassListByType?type="+type,
                success:function(data){
                    if(data.status ==="success"){
                        _this.$data[key] = data.message;
                    }
                }
            })
        },
        getUserList:function(){
            var _this = this;
            $.ajax({
                type:"get",
                url:"/api/getUserList",
                success:function(data){
                    if(data.status ==="success"){
                        _this.$data.userList = data.message;
                    }
                }
            })
        }

    }
});