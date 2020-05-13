const {retrieveTable, setTable} = require('../database');

const {uniq, cascade, readSingleSheet, columnNameRemap} = require('./utils');

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
  ['编号', 'voucher_line_num'],
  ['行号', 'voucher_line_num'],

  ['对方科目', 'ccode_dest'],
  ['对方科目名称', 'ccode_dest'],
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

  let newBalance = balance.data.map(({ccode, ccode_name}) => {
    return [ccode, {ccode, ccode_name, __children:[]}]
  });
  console.log(Object.keys(newBalance))

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);

  data.sort((prev, next) => {
    const {iperiod: pP, voucher_id:vidP, voucher_line_num: vlnP} = prev;
    const {iperiod: pN, voucher_id:vidN, voucher_line_num: vlnN} = next;

    return pP !== pN
    ? pP - pN
    : vidP !== vidN
    ? vidP - vidN
    : vlnP - vlnN
  })

  // data = uniq(data, 'ccode');
  // data = cascade(data, 'ccode');
  // console.log(data.length, 'processed');

  await setTable({project_id}, 'ACCRUAL_ANALYSIS', {data})

  return {data};
}

module.exports = accrual_analysis;