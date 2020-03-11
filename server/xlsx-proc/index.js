
const XLSX = require('xlsx');

const ParseMapDict = require('./parse-dictionary');

const BALANCE = require('./balance');
const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const CONFIRMATION_MANAGEMENT = require('./confirmation-management');

const dataProcDict = {
  BALANCE,
  CASHFLOW_WORKSHEET,
  CONFIRMATION_MANAGEMENT
}


function columnNameRemap(table, name){

  if (ParseMapDict[name] !== undefined){
    const map = ParseMapDict[name];
  
    for (let p = 0; p < table.length; p++){
      let rec = table[p],
        newRec = {};
  
      for (let [oldKey, newKey] of map){
        (oldKey in rec) && (newRec[newKey] = rec[oldKey]);
      }
  
      !(newRec.iperiod) && (newRec.iperiod = 0);
      (newRec.ccode) && (newRec.ccode = newRec.ccode.toString());
      
      table[p] = newRec;
    }
  }

  return table
}

function readSingleSheet(buffer){
  const table = XLSX.read(buffer, {type:'buffer'});
  const firstSheet = table.Sheets[table.SheetNames[0]];  
  return XLSX.utils.sheet_to_json(firstSheet);
}

async function dataProc(fileBuffer, dataName, context){

  if (!(dataName in dataProcDict)){
    return {error: 'DEAD_NOT_IMPL'}
  }

  try {
    const table = readSingleSheet(fileBuffer);
    const mapped = columnNameRemap(table, dataName);
    const result = await dataProcDict[dataName](mapped, context);
    return {ok: 'DONE', data:result}
  } catch (er) {
    console.log(er);
    return {error: 'DEAD_PROC_ERROR'}
  }
}

module.exports = dataProc