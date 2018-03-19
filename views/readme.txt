页面存放位置

后台管理页面：admin
前台展示页面：front

路由：
admin.js -->所有后台跳转页面
api.js -->所有ajax请求
index.js -->所有前台跳转页面


静态资源管理（统一放置public目录下）：
core:核心js、包括jquery/vue/以及其他第三方库文件
css:前台和后台的css文件,前台css以front_开头，后台的css以
images:
js:存放所有的业务js


表结构：
t_user:用户表
t_role:权限表
t_menu:菜单表（资源表11）
t_article:文章表

重要SQL(查询菜单)：
drop FUNCTION if EXISTS getChildLst;

CREATE FUNCTION `getChildLst`(rootId varchar(100))
    RETURNS varchar(1000)
    BEGIN
        DECLARE sTemp VARCHAR(1000);
        DECLARE sTempChd VARCHAR(1000);

        SET sTemp = '^';
        SET sTempChd =cast(rootId as CHAR);

        WHILE sTempChd is not null DO
            SET sTemp = concat(sTemp,',',sTempChd);
            SELECT group_concat(menuId) INTO sTempChd FROM t_menu where FIND_IN_SET(pId,sTempChd)>0;
        END WHILE;
        RETURN sTemp;
END  ;

重要SQL(查询层级)：
SELECT menuId AS ID,pId AS 父ID ,menuName,url,memo,levels AS 父到子之间级数, paths AS 父到子路径 FROM (
   SELECT menuId,pId,menuName,url,memo,
   @le:= IF (pId = 0 ,0,
     IF( LOCATE( CONCAT('|',pId,':'),@pathlevel)  > 0 ,
         SUBSTRING_INDEX( SUBSTRING_INDEX(@pathlevel,CONCAT('|',pId,':'),-1),'|',1) +1
    ,@le+1) ) levels
   , @pathlevel:= CONCAT(@pathlevel,'|',menuId,':', @le ,'|') pathlevel
   , @pathnodes:= IF( pid =0,',0',
      CONCAT_WS(',',
      IF( LOCATE( CONCAT('|',pId,':'),@pathall) > 0 ,
        SUBSTRING_INDEX( SUBSTRING_INDEX(@pathall,CONCAT('|',pId,':'),-1),'|',1)
       ,@pathnodes ) ,pId ) )paths
  ,@pathall:=CONCAT(@pathall,'|',menuId,':', @pathnodes ,'|') pathall
    FROM t_menu,
  (SELECT @le:=0,@pathlevel:='', @pathall:='',@pathnodes:='') vv
  ORDER BY pId,menuId
  ) src
ORDER BY pId

