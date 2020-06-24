const now = require('performance-now');
const {fetchTable, storeTable} = require('../data-store-util');

const {readSingleSheet, columnNameRemap, uniq} = require('../data-process-util');

const {normalize, decompose } = require('./decompose-voucher');
const {addJournalEntries} = require('./cascade-entry');

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
  ['借方', 'md'],

  ['账面贷方发生额' , 'mc'],
  ['贷方发生额' , 'mc'],
  ['未审贷方发生额' , 'mc'],
  ['本期发生贷方', 'mc'],
  ['贷方发生', 'mc'],
  ['贷方', 'mc'],

  ['摘要', 'digest'],
  ['业务说明', 'digest'],

  ['凭证号', 'voucher_id'],
  ['凭证编号', 'voucher_id'],
  ['凭证号数', 'voucher_id'],

  ['编号', 'voucher_line_num'],
  ['分录号', 'voucher_line_num'],
  ['行号', 'voucher_line_num'],

  ['对方科目', 'dest_ccode_name'],
  ['对方科目名称', 'dest_ccode_name'],

  ['方向', 'dir'],
  ['金额', 'amount']
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

  let journals = readSingleSheet(fileBuffer);
  journals = columnNameRemap(journals, header);
  journals = normalize(journals);
  journals = decompose(journals);

  addJournalEntries(balance.data, journals);

  await storeTable(balance, {flatten: true})

  return balance;
  // return {data: journals};
}

module.exports = {
  upload
};