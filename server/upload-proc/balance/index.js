const {setTable, retrieveRecs} = require('../../database');

const {uniq, cascade, readSingleSheet, columnNameRemap} = require('../utils');

const categorize = require('./cateogorize');

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
  
  ['账面借方发生额' , 'md'],
  ['本期借方', 'md'],
  ['本期发生借方', 'md'],
  ['未审借方发生额' , 'md'],
  ['借方发生额', 'md'],

  ['本期贷方', 'mc'],
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

  const {project_id} = context;

  let data = readSingleSheet(fileBuffer);
  // console.log(data, 'processed');
  data = columnNameRemap(data, header);
  data = uniq(data, 'ccode');

  for (let record of data) {
    categorize(record, '__categorized_to_tb');
  }

  data = cascade(data, 'ccode');

  const entry = {data, indexColumn:'ccode_name'};
  await setTable({project_id}, 'BALANCE', entry)

  return entry;
}

module.exports = balance;