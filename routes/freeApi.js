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

/**
 * 获取文章的统计数据(文章数，评论数，收藏量)
 */
router.get("/getArticleStatistics",function(req,res,next){
    let reqObj = appUtil.getQueryString(req),aid = reqObj.id;
    let sql1 = `select tag,docType,collectCount FROM t_article WHERE id='${aid}';`;
    let sql2 = `SELECT count(*) as artNum from t_article WHERE author =(SELECT author FROM t_article WHERE id='${aid}');`;
    let sql3 = `SELECT count(*) as msgNum from t_message WHERE articleId = '${aid}';`;
    var ret1={},ret2={},ret3={};
    query(sql1+sql2+sql3,function(errors,results){
        if(errors){
            responseData.status = "error";
            responseData.message = errors;
        }else{
            responseData.status = "success";
            ret1 = results[0][0];
            ret2 = results[1][0];
            ret3 = results[2][0];
            responseData.message = {...ret1,...ret2,...ret3};
        }
        res.json(responseData);
    });
});

/**
 * 取全表的值(标签、分类等)
 */
router.get("/database/:tid",function(req,res,next){
    let mapTabs = ['t_class','t_documentType','t_role','t_tag'];
    let tid = req.params.tid||"0";
    let index = mapTabs[tid];
    let sql = `select * from ${index} where 1=1;`;
    query(sql,function(errors,results){
        if(errors){
            responseData.status = "error";
            responseData.message = errors;
        }else{
            responseData.status = "success";
            responseData.message = results;
        }
        res.json(responseData);
    });
});

/**
 * 获取文章列表(最近，最新)
 */
router.get("/topArticleList",function(req,res,next){
    let reqObj = appUtil.getQueryString(req);
    let size = reqObj.pageSize||10;
    let author = reqObj.author||"";
    if(author) author = ` and t1.author='${author}'`;
    let sql1 = `SELECT t1.*,t2.realName,DATE_FORMAT(t1.updatetime,'%Y-%m-%d') time2 from t_article t1 left JOIN t_user t2 ON t1.author= t2.userid WHERE publish=1 ${author} order BY t1.readCount DESC
    LIMIT 0,${size};`;
    let sql2 = `SELECT t1.*,t2.realName,DATE_FORMAT(t1.updatetime,'%Y-%m-%d') time2 from t_article t1 left JOIN t_user t2 ON t1.author= t2.userid WHERE publish=1 ${author} order BY t1.updatetime DESC
    LIMIT 0,${size};`;  
    let _numList = [],_dateList = []; 
    query(sql1+sql2,function(errors,results){
        if(errors){
            responseData.status = "error";
            responseData.message = errors;
        }else{
            responseData.status = (results.length>0)?"success":"error";
            let _numList = results[0]||[],_dateList = results[1]||[];
            responseData.message = {_numList,_dateList};
        }
        res.json(responseData);
    }); 
});

module.exports = router;