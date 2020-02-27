const XLSX = require('xlsx');

function exportExcel(data){

  let xlsBook = XLSX.utils.book_new();
    xlsBook.SheetNames.push('导出');
  
  if(Array.isArray(data)){
    let xlsSheet = XLSX.utils.json_to_sheet(data);
    xlsBook.Sheets['导出'] = xlsSheet;
  } else {
    let xlsSheet = XLSX.utils.json_to_sheet([{'提示':'尚不支持您想要导出的数据类型呢亲'}]);
    xlsBook.Sheets['导出'] = xlsSheet;
  }
  
  let xlsOutput = XLSX.write(xlsBook, {bookType:'xlsx', type: 'binary'});
  
  return xlsOutput;
}  

module.exports = exportExcel;