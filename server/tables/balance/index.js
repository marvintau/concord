const {storeTable, fetchTable, purge} = require('../data-store-util');

const {uniq, cascade, readSingleSheet, columnNameRemap} = require('../data-process-util');

const trav = require('@marvintau/chua/src/trav');

const {normalize, decompose} = require('./voucher');
const {categorize} = require('./categorize');

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

async function upload(fileBuffer, context){

  const {project_id} = context;

  // 在我们准备上传真正的科目余额表时，我们已经上传了总的序时帐，以及各往来科目
  // 的相关序时帐。
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

  // 而这才是我们刚上传的，真正的余额表数据。我们只是将余额表改造为级联数据。
  // 在处理序时帐时，形成对方科目路径需要处理好的余额表数据，而序时帐数据处
  // 理后的结果也要重新写入此处的余额表数据中。
  let data = readSingleSheet(fileBuffer);
  // console.log(data, 'processed');
  data = columnNameRemap(data, header);
  data = uniq(data, 'ccode');

  data = cascade(data, 'ccode');

  // 接下来一系列操作都针对journals，并且中间结果不需要存入balance.data，所以这个引用
  // 暂时没用了。normalize和decompose的说明详见源码，经过这一步，我们得到了拥有计算过的
  // （而非原始序时帐所标明的）对方科目。
  let journals = balance.data;
  journals = normalize(journals);
  journals = decompose(journals);
  purge(journals);

  // console.log(journals.filter(({curr}) => curr !== undefined).length, 'currs');

  categorize(data, journals)

  const entry = {data, indexColumn:'ccode_name'};
  await storeTable({project_id, table:'BALANCE', ...entry})

  return entry;
}

async function retrieve({project_id}) {
  const retrieved = await fetchTable({project_id, table:'BALANCE'});
  console.log(Object.keys(retrieved), 'retrieved balance');
  return retrieved;
}

module.exports = {
  upload,
  retrieve
};