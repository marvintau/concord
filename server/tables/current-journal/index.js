const now = require('performance-now');

const {fetchTable, storeTable} = require('../data-store-util');
const {readSingleSheet, columnNameRemap, group} = require('../data-process-util');

let header = [
  ['会计年' , 'iyear'],
  ['会计月' , 'iperiod'],
  ['月份' , 'iperiod'],

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

function parseDesc(desc) {
    const entries = desc.split(/[【】]/g)
      .filter(str => str.includes(':'))
      .map(str => str.split(' ')[0].split(':'))
      .map(([k, v]) => ([{部门: 'depart', 职员: 'person', 供应商: 'vendor', 客户:'customer'}[k] || 'other', v]));
    return Object.fromEntries(entries);
}

async function upload(fileBuffer, context){

  const {project_id} = context;

  // 当我们上传往来科目序时帐时，尽管此处我们使用的名称是"balance"（是最终
  // 的形式），但当前的内容应该是我们首次上传的序时帐。
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
  console.log(balance.data.filter(({curr}) => curr !== undefined).length, 'existing currs');


  // 此处是我们上传的往来科目序时帐。上传某个往来科目的序时帐不会影响到先前的结果。
  // 上传的序时帐按照鼎信诺单个科目导出的格式，我们需要去除每月小结，及其它不属于
  // 会计分录的行。

  let journals = readSingleSheet(fileBuffer, {startFrom:1});
  journals = columnNameRemap(journals, header);
  journals = journals.filter(({ccode_name}) => {
    return ccode_name !== undefined && ccode_name !== null && ccode_name.toString().trim().length !== 0;
  })

  // 接下来我们将总的序时帐和单个科目序时帐进行融合。我们按照会计月-凭证编号将序时帐
  // 进行划分。然后，我们扫描一遍全部的往来科目序时帐凭证，然后将凭证中每一条分录，
  // 写入到总的序时帐中。

  const groupT = now();
  const groupedOverallJournals = group(balance.data, ({iperiod, voucher_id}) => `${iperiod}-${voucher_id}`);
  const groupEndT = now();
  console.log((groupEndT - groupT).toString(), balance.data.length, 'grouped original');

  const groupCurrentT = now();
  const groupedCurrentJournals = group(journals, ({iperiod, voucher_id}) => `${iperiod}-${voucher_id}`);
  const entriedCurrentJournals = Object.entries(groupedCurrentJournals);
  const groupCurrentEndT = now();
  console.log((groupCurrentEndT - groupCurrentT).toString(), journals.length, 'grouped current');

  for (let [key, currVoucher] of entriedCurrentJournals) {
    const origVoucher = groupedOverallJournals[key];
    if (!Array.isArray(origVoucher)) {
      console.log(key, currVoucher, origVoucher)
    }
    for (let currEntry of currVoucher) {
      for (let origEntry of origVoucher) {
        const currMc = currEntry.mc.toFixed(2);
        const currMd = currEntry.md.toFixed(2);
        const origMc = origEntry.mc.toFixed(2);
        const origMd = origEntry.md.toFixed(2);
        if (currMc === origMc && currMd === origMd) {
          if (currEntry.desc !== undefined){
            origEntry.curr = parseDesc(currEntry.desc);
          }
        }
      }
    }
  }

  await storeTable(balance, {flatten: true});
  return balance;
}

module.exports = {
  upload
};