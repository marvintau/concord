const {storeTable, fetchTable} = require('../data-store-util');
const {uniq, cascade, group, readSingleSheet, columnNameRemap} = require('../data-process-util');

const {flat} = require('@marvintau/chua');
// const categorize = require('./cateogorize');

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

  ['核算项目名称', 'item_name'],
  ['核算项目编号', 'item_code'],
]

async function upload(fileBuffer, context){

  const {project_id} = context;

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);
  
  const groups = group(data, 'ccode');

  const entry = await fetchTable({project_id, table:'BALANCE'}) ;

  const {data:balanceData} = entry;
  const flattenedData = flat(balanceData, 'ccode');
  const filteredData = flattenedData.filter(({ccode}) => ccode in groups);

  for (let rec of filteredData) {
    const {ccode} = rec;
    const subs = groups[ccode].map(({item_code, item_name, ...rest}) => ({...rest, ccode:item_code, ccode_name:item_name}));

    // 这里可以直接放心地为__children赋值，原因是核算科目一定是现有
    // 科目余额表中的末级科目。
    rec.__children = subs;
  }

  await storeTable(entry, {flatten: true});
  return entry;
}

module.exports = {
  upload
};