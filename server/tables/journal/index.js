const {storeTable} = require('../data-store-util');
const {readSingleSheet, columnNameRemap} = require('../data-process-util');

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
  ['金额', 'amount'],
  ['核算项目', 'desc']
]

async function upload(fileBuffer, context){

  const {project_id} = context;

  let journals = readSingleSheet(fileBuffer);
      journals = columnNameRemap(journals, header);

  await storeTable({project_id, table:'BALANCE', indexColumn: 'ccode_name', data: journals}, {flatten: true});

  return {data: journals, indexColumn:'ccode_name'};
}

module.exports = {
  upload
};