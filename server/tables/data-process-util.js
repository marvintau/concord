const XLSX = require('xlsx');
const QRCode = require('easyqrcodejs-nodejs');
const casc = require('@marvintau/jpl/src/casc');

function sort(table, key){

  const val = typeof key === 'string'
  ? (rec) => rec[key]
  : (rec) => key(rec)

  return table.sort((a, b) => {
    const val_a = val(a), val_b = val(b);
    return val_a < val_b ? -1 : val_a > val_b ? 1 : 0
  })
}

function uniq(table, key){
  const sorted = sort(table, key);

  const dict = {};
  for (let rec of sorted){
    dict[rec[key]] = rec;
  }

  return Object.values(dict);
}

function group(table, key){

  let group = {};

  const labelFunc = key.constructor === Function
  ? (rec) => key(rec)
  : (rec) => rec[key]

  for (let i = 0; i < table.length; i++){
    const rec = table[i];
    const label = labelFunc(rec);

    !(label in group) && (group[label] = []);
    group[label].push(rec);
  }
  // console.log()
  return group;
}

function cascade(table, colKey) {
  console.log('CASCADING');
  return casc(table, {cascCol: colKey, withParent:false});
}

function columnNameRemap(table, map, {handleNum=true}={}){

  for (let p = 0; p < table.length; p++){
    let rec = table[p],
      newRec = {};

    for (let [oldKey, newKey] of map){
      (oldKey in rec) && (newRec[newKey] = rec[oldKey]);
    }

    !(newRec.iperiod) && (newRec.iperiod = 0);
    (newRec.ccode) && (newRec.ccode = newRec.ccode.toString());

    table[p] = newRec;

    // 处理发生额按"金额-方向"形式给出的值
    const {dir, amount} = newRec;
    if (dir !== undefined && amount !== undefined){
      if (dir === '借') {
        Object.assign(newRec, {md:amount, mc: 0});
      } else if (dir === '贷') {
        Object.assign(newRec, {mc:amount, md: 0});
      }
    }

    if (handleNum){
      const {mc, md} = newRec;
      if (md === undefined){
        newRec.md = 0;
      }
      if (typeof md === 'string'){
        newRec.md = parseFloat(md.replace(/[\s,]/g, ''));
        console.log(newRec.md, 'new md');
      }
      if (mc === undefined){
        newRec.mc = 0;
      }
      if (typeof mc === 'string'){
        newRec.mc = parseFloat(mc.replace(/[\s,]/g, ''));
        console.log(newRec.mc, 'new mc');
      }

      if (isNaN(newRec.mc) || isNaN(newRec.md)){
        throw {message: `found NaN value mc: ${newRec.mc} md: ${newRec.md} @ ${newRec.ccode_name}`, code:'DEAD_INVALID_NUMERIC_FORMAT'};
      }
    }

    // 从用友NC中导出的科目名称均已形成路径，我们需要保留末级科目
    // 并重新定义路径
    const {ccode_name} = newRec;
    if (ccode_name && typeof ccode_name === 'string' && ccode_name.split('\\').length > 0){
      const last = ccode_name.split('\\').pop();
      // console.log(ccode_name, 'path like')
      Object.assign(newRec, {ccode_name: last})
    }
  }

  return table
}

// Use when there only one sheet in the excel file
// Suitable for data
function readSingleSheet(buffer, {withHeader=true, startFrom}={}){
  const table = XLSX.read(buffer, {type:'buffer'});
  const firstSheet = table.Sheets[table.SheetNames[0]];
  return XLSX.utils.sheet_to_json(firstSheet, {header: withHeader ? undefined : 1, range: startFrom});
}


// Use when there are multiple sheets, and you know the exact names of them.
// Suitable for template, or other sheets with definite format.
function readSheets(buffer, {sheetNames, withHeader=true}={}){
  const table = XLSX.read(buffer, {type:'buffer'});

  const sheets = {};

  let sn = sheetNames || table.SheetNames;
  // console.log('sheetnames', sn);
  for (let sheetName of sn){
    const sheet = table.Sheets[sheetName];
    if (withHeader) {
      sheets[sheetName] = XLSX.utils.sheet_to_json(sheet);
    } else {
      sheets[sheetName] = XLSX.utils.sheet_to_json(sheet, {header: 1});
    }
  }

  return sheets;
}

async function exportSingleSheet(data){

  let xlsBook = XLSX.utils.book_new();
  xlsBook.SheetNames.push('导出');

  if(Array.isArray(data)){
    let xlsSheet = XLSX.utils.json_to_sheet(data);
    xlsSheet["!rows"] = data.map( _ => ({hpx: 20}));
    xlsBook.Sheets['导出'] = xlsSheet;
  } else {
    let xlsSheet = XLSX.utils.json_to_sheet([{'提示':'尚不支持您想要导出的数据类型呢亲'}]);
    xlsBook.Sheets['导出'] = xlsSheet;
  }

  let xlsOutput = XLSX.write(xlsBook, {bookType:'xlsx', type: 'binary'});

  return xlsOutput;
}


function readSingleText(buffer) {

  const table = buffer.toString().split('\n').map(line => line.trim());
  console.log('string table');

  return table;
}

const generateQR = async text => {

  const options = {
    text,
    width: 128,
    height: 128,
    colorDark : "#000000",
    colorLight : "transparent",
    correctLevel : QRCode.CorrectLevel.H, // L, M, Q, H
    dotScale: 1 // Must be greater than 0, less than or equal to 1. default is 1
  }

  try {
    let result = await (new QRCode(options)).toDataURL().then(res => res);
    return result;
  } catch (err) {
    console.log(err);
    return 'error';
  }
}

module.exports = {
  sort,
  uniq,
  group,
  cascade,
  columnNameRemap,
  readSingleSheet,
  readSheets,
  exportSingleSheet,
  readSingleText,
  generateQR
}