var express = require('express');
var router = express.Router();
var path = require("path");
var md5 = require("md5");
var UUID = require("node-uuid");
var query = require(path.resolve("./public/js/util/mysqlPool"));
var appUtil = require(path.resolve("./public/js/util/appUtil"));

var responseData; //返回格式
router.use(function(req,res,next){
    responseData = {
      status:"success",
      message:""
    };
    next();
});

/**
 * 全局查询 文章列表
 */
router.post("/globalSearchArticleList",function(req,res,next){
    let reqObj = req.body;
    let params = JSON.parse(reqObj.arg);
    let sql = "SELECT t1.*,t2.realName,DATE_FORMAT(t1.updatetime,'%Y-%m-%d') time2 from t_article t1 LEFT JOIN t_user t2 ON t1.author = t2.userId WHERE t1.publish=1 ";
    if(params.arcTxt){
        sql += " and t1.title like '%"+params.arcTxt+"%'";
    }
    if(params.docId.length){
        let docId = params.docId;
        let idStr = "";
        docId.forEach(elelment=>{
            idStr += "'"+elelment+"',";
        });
        idStr = idStr.substr(0,idStr.length-1); 
        sql += ` and t1.docType in (${idStr})`;
    }
    sql += `order by t1.${params.page.sortField} ${params.page.sortOrder}`;
    appUtil.queryByPage(sql,params.page,responseData,function(resData){
        res.json(resData);
    },"POST"); 
});

/**
 * 获取文档类型
 */
router.get("/documentTypeList",function(req,res,next){
    var sql = "select * from t_documenttype orderby ";
    query(sql,function(errors,results){
        if(errors){
            responseData.status = "error";
            responseData.message = errors;
        }else{
            responseData.status = "success";
            var resultData = [];
            getMenuList(resultData,results,"0",'children','typeId');
            responseData.data = resultData;
            res.json(responseData);
        }
    });
});

/**
 * 递归处理菜单相关数据
 * @param resultData
 * @param results
 * @param pId
 * @param childKey
 */
function getMenuList(resultData,results,pId,childKey,id){
    var key = childKey|| "childs",
        id = id || "menuId";
    for(var i =0,len = results.length;i<len;i++){
        if(results[i].pId == pId){
            var item = results[i];
            item[key] = [];
            resultData.push(item);
            getMenuList(item[key],results,item[id],key,id);
        }
    }
}

/**
 * 查看文章明细
 */
router.get("/article/:id",function(req,res,next){
    let articleid = req.params.id;
    let sql = "SELECT t1.*,t2.realName,DATE_FORMAT(t1.updatetime,'%Y年%m月%d日 %H:%i:%S') time2 from t_article t1 LEFT JOIN t_user t2 ON t1.author = t2.userId WHERE t1.publish=1";
    if(articleid){
        sql += ` and t1.id ='${articleid}'`;
    }
    query(sql,function(errors,results){
        if(errors){
            responseData.status = "error";
            responseData.message = errors;
        }else{
            responseData.status = results.length>0?"success":"error";
            responseData.message = results.length>0?results[0]:{};
            res.json(responseData);
        }
    });
});

/**
 * 更新文章的统计量字段
 */
router.post("/updateArticleCountField",function(req,res,next){
    let reqObj = req.body;
    let fid = reqObj.fieldName,id = reqObj.id;
    if(fid && id){
        let sql = `update t_article set ${fid} = ${fid}+1 where id='${id}';`;
        query(sql,function(errors,results){
            if(errors){
                responseData.status = "error";
                responseData.message = errors;
            }else{
                responseData.status = "success";
                responseData.message = results;
                res.json(responseData);
            }
        });
    }else{
        responseData.status = "error";
        responseData.message = "参数错误";
        res.json(responseData);
    }  
});

module.exports = router;