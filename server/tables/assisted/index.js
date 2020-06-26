const {storeTable, fetchTable} = require('../data-store-util');
const {uniq, cascade, group, readSingleSheet, columnNameRemap} = require('../data-process-util');

// const {flat, group} = require('@marvintau/chua');
const flat = require('@marvintau/chua/src/flat');
const trav = require('@marvintau/chua/src/trav');
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

  let balance;
  try {
    balance = await fetchTable({project_id, table: 'BALANCE'});
  } catch (error){
    console.log(error);
    const {code} = error;
    if (code === 'DEAD_NOT_FOUND') {
      throw {code: 'DEAD_BALANCE_NOT_FOUND'}
    }
  }
  
  // const flattened = flat(balance.data);
  // console.log(flattened.slice(0, 20));
  
  // console.log(Object.keys(balanceDict));

  // let assisted = readSingleSheet(fileBuffer);
  // assisted = columnNameRemap(assisted, header);

  // let anyExcludedAssited = false
  // for(let i = 0; i < assisted.length; i++) {
  //   const {item_name, ccode} = assisted;
  //   if (balanceDict[ccode] === undefined) {
  //     anyExcludedAssited = true;
  //   }
    
  // }
  // console.log('any excluded', anyExcludedAssited);
  return balance;
}

module.exports = {
  upload
};