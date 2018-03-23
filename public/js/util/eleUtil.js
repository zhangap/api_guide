/**
 * @description 前端工具库
 * @author hiliny
 */
(function(global,undefined){
    var eleUtil = global.eleUtil = {},loading  = null,
    loading_opts = {
            visible:true,
            lock:true,
            text:"拼命加载中，请稍后...",
            spinner:"el-icon-loading",
            background:"rgba(0,0,0,0.3)"
    };

    /**
     * @description 锁屏
     * @param {String|Object} options 
     */
    eleUtil.loading = function(options){
        options = options||{};
        if(typeof options === "string" && options){
            options = {text:options};
        }
        options = $.extend(true,{},loading_opts,options);
        loading = ELEMENT.Loading.service(options);
    }; 

    /**
     * @description 解除锁屏
     */
    eleUtil.closeLoading = function(){
        loading.close();
    };

    /**
     * @description 消息提示
     * @param {String|Object} content 
     * @param {String} type 
     */
    eleUtil.message = function(content,type){
        var def_opts = {
            showClose:false,
            message:"操作失败!",
            type:"error"
        };
        if(typeof content === "string" && content){
            def_opts.message = content;
        }
        if(typeof type === "string" && type){
            def_opts.type = type;
        }
        if(typeof content === "object"){
            $.extend(def_opts,content);
        }
        ELEMENT.Message(def_opts);
    };

    eleUtil.page ={
        pageSizes:[10, 20, 30, 40],
        layout:"total, sizes, prev, pager, next, jumper",
        pageSize:10
    }
})(window);
