const fs = require('fs').promises;
const path = require('path');

const {cascade, readSingleSheet, columnNameRemap} = require('./utils');

let header = [
  ['会计年' , 'iyear'],
  ['会计月' , 'iperiod'],
  ['科目编号' , 'ccode'],
  ['科目编码', 'ccode'],
  ['科目名称' , 'ccode_name'],
  ['科目类别' , 'cclass'],

  ['期初数' , 'mb'],
  ['账面期初数' , 'mb'],
  ['账面期初余额' , 'mb'],
  ['期初余额' , 'mb'],
  ['期初金额' , 'mb'],
  ['期初余额借方' , 'mbd'],
  ['期初余额贷方' , 'mbc'],
  
  ['本期发生借方', 'md'],
  ['账面借方发生额' , 'md'],
  ['未审借方发生额' , 'md'],
  ['借方发生额', 'md'],

  ['账面贷方发生额' , 'mc'],
  ['贷方发生额' , 'mc'],
  ['未审贷方发生额' , 'mc'],
  ['本期发生贷方', 'mc'],

  ['期末数' , 'me'],
  ['账面期末数' , 'me'],
  ['账面期末余额' , 'me'],
  ['期末金额' , 'me'],
  ['期末余额' , 'me'],
  ['期末余额借方' , 'med'],
  ['期末余额贷方' , 'mec'],
]

async function balance(fileBuffer, context){

  const {pid} = context;

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);
  data = uniq(data, 'ccode');
  data = cascade(data, 'ccode');
  console.log(data.length, 'processed');
  await fs.writeFile(path.resolve(`./file_store/PROJECT/${pid}/BALANCE`), JSON.stringify(data));
  console.log('write into file');
  return {data, pathColumn: 'ccode_name'};
}

module.exports = balance;