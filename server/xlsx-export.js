const XLSX = require('xlsx');

function exportExcel(colSpecs, data){

  let explainedData = data.map(rec => {
    let newRec = {};
    for (let key in colSpecs){
      const {cellType, desc} = colSpecs[key];
      switch (cellType) {
        case 'Edit': break;
        case 'Ref':
          const {expr, result, code} = rec[key];
          newRec[`${desc}-结果`] = result;
          newRec[`${desc}-输入`] = expr;
          newRec[`${desc}-备注`] = code;
          break;
        default:
          newRec[desc] = rec[key].replace(/#/g, '')
      }
    }
    return newRec;
  })

  let xlsBook = XLSX.utils.book_new();
  xlsBook.SheetNames.push('导出');

  // console.log(colSpecs);
  // console.log(explainedData.slice(0, 10));

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