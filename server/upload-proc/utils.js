const XLSX = require('xlsx');
const QRCode = require('easyqrcodejs-nodejs');


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
  console.log()
  return group;
}

function cascade(table, colKey) {

  // grip使用了layerFunc，将列表分为几代（Generation）
  const sorted = sort(table, colKey);
  const layers = Object.values(group(sorted, (rec) => rec[colKey].length));
  console.log(table.length);
  console.log(layers.map(e => e[0][colKey].length), 'cascade');

  // 每相邻的两代之间两两比较，如果没有找到父辈的孩子会被弃掉。
  let children;
  for (children = layers.pop(); layers.length > 0; children = layers.pop()) {
    let parents = layers.pop();

    // 如果记录没有children这个属性则清空
    for (let i = 0; i < parents.length; i++){
      parents[i].__children = [];
    }
    
    // 在两代中间进行匹配
    while (children.length > 0) {
      let child = children.pop();
      for (let i = 0; i < parents.length; i++){
        let parent = parents[i];
          
        if (child[colKey].startsWith(parent[colKey])) try {
          parent.__children.push(child)
        }catch{
          console.log(parent);
          throw Error('found')
        }
      }
    }
    layers.push(parents);
  }
  // 返回祖先一代。
  return children;
}

function columnNameRemap(table, map){
  
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

    // 从用友NC中导出的科目名称均已形成路径，我们需要保留末级科目
    // 并重新定义路径
    const {ccode_name} = newRec;
    if (ccode_name.split('\\').length > 0){
      const last = ccode_name.split('\\').pop();
      // console.log(ccode_name, 'path like')
      Object.assign(newRec, {ccode_name: last})
    }
  }

  return table
}

function readSingleSheet(buffer, withHeader=true){
  const table = XLSX.read(buffer, {type:'buffer'});
  // console.log(table, 'table table');
  const firstSheet = table.Sheets[table.SheetNames[0]];  
  // console.log(firstSheet, 'firstSheet');
  if (withHeader) {
    return XLSX.utils.sheet_to_json(firstSheet);
  } else {
    return XLSX.utils.sheet_to_json(firstSheet, {header: 1});
  }
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
  generateQR
}