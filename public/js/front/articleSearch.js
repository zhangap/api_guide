/**
 * 文章的分类查找
 */
$(function(){
    //设置ztree树的信息
    var ztreeobj = null;
    var setting = {
        async:{
            enable:true,
            url:"/freeApi/documentTypeList",
            type:"GET",
            dataFilter:function(treeId, parentNode, responseData){
                Vue.set(app,"sortList",responseData.data);
                return responseData.data;
            }
        },
        view:{
            showLine:true,
            showIcon:true,
            fontCss:getSearchColor
        },
        check:{
            enable:false
        },
        data:{
            key:{
                name:"typeName"
            },
            simpleData:{
                enable:true,
                idKey:"typeId",
                pIdKey:"pId",
                rootPId:"0"
            }
        },
        callback:{
            onClick:function(event, treeId, treeNode){
                var ret = [];
                recursiveLeafNodes([treeNode],ret);
                Vue.set(app,"leafs",ret);
                app.getArticleList();
            }
        }
    };
    var preSearchNodes = [];
    // 查找的节点颜色变换
    function getSearchColor(treeId, treeNode){
        return treeNode.hightLight?{"color":"#FEB902"}:{"color":"#333"};
    }
    //更新节点的属性
    function updateNodes(nodeList,flag){
        $.each(nodeList,function(i,node){
            node.hightLight = flag;
            zTreeObj.updateNode(node);
        });
    }
    //递归查找某节点的祖先节点以便搜索展开
    function recursionNeedExpandNodes(node){
        var ret = [],parentNode = null;
        if(node.parentTId){
            parentNode = zTreeObj.getNodeByTId(node.parentTId);
            ret.push(parentNode);
            return recursionNeedExpandNodes(parentNode).concat(ret);
        }else{
            return ret;
        }
    }
    //查找某节点下的所有叶子节点
    function recursiveLeafNodes(treeNode,ret){
        for(var a=0,l=treeNode.length;a<l;a++){
            if(treeNode[a].isParent){
                recursiveLeafNodes(treeNode[a].children,ret);
            }else{
                ret.push(treeNode[a].typeId);
            }
        }
    }
    // 创建vue实例
    var app = new Vue({
        el:"#list",
        data:{
            lx:"",
            nodeText:"",
            arcTxt:"",
            sortList:[],
            tableData:[],
            page:$.extend(true,{},eleUtil.page,{pageSize:20,sortField:"updateTime",sortOrder:"desc"}),
            leafs:[]
        },
        created:function(){
        },
        mounted:function(){
            $("#leftSearch").on("keyup",$.proxy(this.beginSearch,this));
            $("#rightSearch").on("keyup",$.proxy(this.rightSearch,this));
            initZtree();
            this.getArticleList();
        },
        methods:{
            beginSearch:function(e){
                if(e.keyCode == 13){
                   this.nodesSearch();
                }  
            },
            rightSearch:function(e){
                if(e.keyCode == 13){
                    this.getArticleList();
                }  
            },
            nodesSearch:function(){
                var txt = this.$data.nodeText;
                var lineNodes = zTreeObj.getNodesByParamFuzzy("typeName",txt);
                updateNodes(preSearchNodes,false);
                if(!$.trim(txt)||!lineNodes.length){
                    zTreeObj.cancelSelectedNode();
                    this.$data.leafs = [];
                    return ;
                }
                preSearchNodes = lineNodes;
                updateNodes(lineNodes,true);
                zTreeObj.selectNode(lineNodes[0],false,false);
                $.each(lineNodes,function(i,node){
                    if(i > 0){
                        lineNodes = recursionNeedExpandNodes(node);
                        $.each(lineNodes,function(i,dd){
                            !dd.open && zTreeObj.expandNode(dd,true,false,false);
                        });
                    }
                });
            },
            getArticleList:function(){
                var _this = this;
                var params = {
                    arcTxt:this.$data.arcTxt,
                    docId:this.$data.leafs,
                    page:this.$data.page
                };
                var loadingInstance = ELEMENT.Loading.service({target:".el-table"});
                $.post("/freeApi/globalSearchArticleList",{arg:JSON.stringify(params)})
                .done(function(response){
                    _this.$nextTick(function(){
                        loadingInstance.close();
                    });
                    if(response.status =="success"){
                        _this.$data.tableData = response.message;
                        _this.page.currentPage = response.page.currentPage;
                        _this.page.total = response.page.total;
                    }else{
                        eleUtil.message("获取数据失败","error");
                    }
                });
            },
            sizeChangeHandler:function(){
                this.page.pageSize =pSize;
                this.getArticleList();
            },
            currentChangeHandler:function(){
                this.page.currentPage = cPage;
                this.getArticleList();
            },
            changeListSort:function(sort){
                //console.log(arguments);
                var field = sort.prop,order = sort.order;
                if(field == "time2"){
                    field = "updatetime";
                }
                order = order.replace(/ending/g,"");
                this.$data.page.sortField = field;
                this.$data.page.sortOrder = order;
                this.getArticleList();
            },
            openArticle:function(row){
                var id = row.id;
                //console.log(row);
                window.open("/article/"+id);
            }
        }
    });

    //初始化左侧树结构
    function initZtree(){
        zTreeObj = $.fn.zTree.init($("#treeDemo"), setting);
    }

});