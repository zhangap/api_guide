var Excel = require("exceljs");
var UUID = require("node-uuid");
var path = require("path");
var fs = require("fs");

function commonExport(headers = [],list){
    try{
        let workBook = new Excel.Workbook();
        workBook.creator = 'admin';
        workBook.lastModifiedBy = 'admin';
        workBook.created = new Date();
        workBook.properties.date1904 = true;
        workBook.views = [{x:0,y:0,width:10000,height:20000,firstSheet:0,activeTab:1,visibility:'visible'}];
        let sheet = workBook.addWorksheet("sheet1");
        //[{ header: 'ID', key: 'id', width: 50 }]
        //{id:"0001",userName:"jix"}
        sheet.columns = headers;
        sheet.addRows(list);
        var filename = UUID.v1()+".xlsx";
        var dir = path.resolve("./downloads");
        if(!fs.existsSync(dir)) fs.mkdirSync(dir);
        var pathName = path.join(dir,filename);
        return [workBook.xlsx.writeFile(pathName).then(()=>{}).catch(()=>{}),"/downloads/"+filename];
    }catch(e){
        console.log("导出错误:" + e.message);
    }
}

module.exports = {
    commonExport
};