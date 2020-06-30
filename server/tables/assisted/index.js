const {storeTable, fetchTable} = require('../data-store-util');
const {uniq, cascade, readSingleSheet, columnNameRemap} = require('../data-process-util');

const {flat, trav, group} = require('@marvintau/chua');

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
  
  const balanceDict = group(flat(balance.data).filter(({cclass}) => cclass !== undefined), 'ccode');
  
  // console.log(Object.keys(balanceDict));

  let assisted = readSingleSheet(fileBuffer);
  assisted = columnNameRemap(assisted, header);

  // 我们在此处需要看一下如何将核算项目的余额添加到科目余额中。对于我们已经处理过的往来科目，会已经有一个
  // 按照发生额汇总的结果，这个结果理论上和此处的核算科目所计算的发生额是一致的，我们只需要将期初期末余额
  // 添加到对应条目即可。
  // 
  // 但是需要注意，核算项目之间可能会有交集，比如可能将应付款按部门进行核算，或按个人进行核算，那么部门的
  // 余额和发生额显然是包含了个人的，因此不能简单地将核算项目看作往来科目之外的某个明细科目，加入到对应的
  // 科目余额表中的科目里去。
  
  // 我们此处仍以从往来序时帐中的核算信息得到的明细科目为准，这个明细科目只包含职员/供应商/客户三类，不考虑
  // 部门整体的核算。其它成本和费用也不参考核算信息。

  let anyExcludedAssited = false
  for(let i = 0; i < assisted.length; i++) {
    const {item_name, ccode} = assisted[i];
    // console.log(ccode, balanceDict[ccode]);
    const balanceEntry = balanceDict[ccode][0];
    if (balanceEntry.__children !== undefined) {
      const list = balanceEntry.__children;
      const entry = list.find(({ccode_name}) => ccode_name === item_name);
      if (entry !== undefined) {
        const {mb, me} = assisted[i];
        Object.assign(entry, {mb, me});
        // console.log(ccode, item_name, mb, me);
      } 
    }
  }
  // console.log('any excluded', anyExcludedAssited);
  storeTable(balance);
  return balance;
}

module.exports = {
  upload
};