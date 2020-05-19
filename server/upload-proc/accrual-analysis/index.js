const now = require('performance-now');
const {retrieveTable, setTable} = require('../../database');

const {readSingleSheet, columnNameRemap, uniq} = require('../utils');

const {normalize, decompose } = require('./decompose-voucher');
const {getCascadedCategories, addJournalEntries} = require('./cascade-entry');

let header = [
  ['会计年' , 'iyear'],
  ['会计月' , 'iperiod'],
  ['科目编号' , 'ccode'],
  ['科目编码', 'ccode'],
  ['科目名称' , 'ccode_name'],
  ['科目类别' , 'cclass'],
  
  ['本期发生借方', 'md'],
  ['账面借方发生额' , 'md'],
  ['未审借方发生额' , 'md'],
  ['借方发生额', 'md'],
  ['借方发生', 'md'],

  ['账面贷方发生额' , 'mc'],
  ['贷方发生额' , 'mc'],
  ['未审贷方发生额' , 'mc'],
  ['本期发生贷方', 'mc'],
  ['贷方发生', 'mc'],

  ['摘要', 'digest'],
  ['业务说明', 'digest'],

  ['凭证编号', 'voucher_id'],
  ['凭证号数', 'voucher_id'],
  ['编号', 'voucher_line_num'],
  ['行号', 'voucher_line_num'],

  ['对方科目', 'dest_ccode_name'],
  ['对方科目名称', 'dest_ccode_name'],

  ['方向', 'dir'],
  ['金额', 'amount']
]

async function accrual_analysis(fileBuffer, context){

  const {project_id} = context;

  let balance;
  try {
    balance = await retrieveTable({project_id}, 'BALANCE');
  } catch (error){
    console.log(error);
    const {code} = error;
    if (code === 'DEAD_NOT_FOUND') {
      throw {code: 'DEAD_BALANCE_NOT_FOUND'}
    }
  }

  const cascadedCategories = getCascadedCategories(balance.data, {cascCol:'ccode'});

  const startT = now();
  let journals = readSingleSheet(fileBuffer);
  const readT = now();
  journals = columnNameRemap(journals, header);
  const remapT = now();
  journals = normalize(journals);
  const normT = now();
  journals = decompose(journals);
  const decomT = now();

  console.log(readT - startT, 'reading');
  console.log(remapT - readT, 'remapping');
  console.log(normT - remapT, 'normalizing');
  console.log(decomT - normT, 'decomposing');

  addJournalEntries(cascadedCategories, journals);

  await setTable({project_id}, 'ACCRUAL_ANALYSIS', {data: cascadedCategories})
  // await setTable({project_id}, 'ACCRUAL_ANALYSIS', {data: journals})

  return {data: cascadedCategories};
  // return {data: journals};
}

module.exports = accrual_analysis;