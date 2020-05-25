function exportData(colSpecs, data){

  return data.map(rec => {
    let newRec = {};
    for (let key in colSpecs){
      const {cellType, desc} = colSpecs[key];
      switch (cellType) {
        case 'Edit': break;
        case 'Ref':
          const {expr, result, code} = rec[key];
          newRec[`${desc}-输入`] = expr;
          newRec[`${desc}-结果`] = result;
          newRec[`${desc}-备注`] = code;
          break;
        default:
          newRec[desc] = rec[key];
      }
    }
    return newRec;
  })

}  

module.exports = exportData;