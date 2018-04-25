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
        if(options.target){
            let dom = document.querySelector(options.target);
            if(!dom){
                return null;
            }
        }
        options = $.extend(true,{},loading_opts,options);
        loading = ELEMENT.Loading.service(options);
        return loading;
    }; 

    /**
     * @description 解除锁屏
     */
    eleUtil.closeLoading = function(){   
        loading && loading.close();
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

    eleUtil.formatDate = function(date,fmt){
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        let o = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds()
        };
        for (let k in o) {
            if (new RegExp(`(${k})`).test(fmt)) {
                let str = o[k] + '';
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : padLeftZero(str));
            }
        }
        return fmt;
    };

    /**
     * 分页配置
     * @type {{pageSizes: [number,number,number,number], pageSize: number}}
     */
    eleUtil.page ={
        pageSizes:[10, 20, 30, 40],
        pageSize:10,
        currentPage:1,
        total:0
    };

    function padLeftZero(str) {
        return ('00' + str).substr(str.length);
    }

    /**
     * ajax全局配置
     */
    $(document).ajaxComplete(function(event,request){
        var data = JSON.parse(request.responseText);
        if(data.status === "302"){
            location.href = data.message;
        }
    });
})(window);
