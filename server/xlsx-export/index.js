const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const ACCRUAL_ANALYSIS = require('./accrual-analysis');

const exportDict = {
  CASHFLOW_WORKSHEET,
  ACCRUAL_ANALYSIS
}

const XLSX = require('xlsx');

async function exportExcel(data_name, currArgs){

  let explainedData = await exportDict[data_name](currArgs);

  let xlsBook = XLSX.utils.book_new();
  xlsBook.SheetNames.push('导出');

  if(Array.isArray(explainedData)){
    let xlsSheet = XLSX.utils.json_to_sheet(explainedData);
    xlsSheet["!rows"] = explainedData.map( _ => ({hpx: 20}));
    xlsBook.Sheets['导出'] = xlsSheet;
  } else {
    let xlsSheet = XLSX.utils.json_to_sheet([{'提示':'尚不支持您想要导出的数据类型呢亲'}]);
    xlsBook.Sheets['导出'] = xlsSheet;
  }
  
  let xlsOutput = XLSX.write(xlsBook, {bookType:'xlsx', type: 'binary'});
  
  return xlsOutput;
}  

module.exports = exportExcel;