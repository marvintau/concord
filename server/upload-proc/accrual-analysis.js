const {retrieveTable, setTable} = require('../database');

const {readSingleSheet, columnNameRemap} = require('./utils');

const group = require('@marvintau/chua/src/group');
const flat = require('@marvintau/chua/src/flat')
// console.log(group);
 
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

  ['对方科目', 'dest_ccode_name'],
  ['对方科目名称', 'dest_ccode_name'],
]

function isDr({mc, md}) {
  return md !== 0 && (mc === 0 || mc === undefined)
}

function isCr({mc, md}) {
  return mc !== 0 && (md === 0 || md === undefined)
}

function assignDest(rec1, rec2, label='succ'){

  const getNewVal = (rec) => {
    const {ccode, ccode_name} = rec;
    return {
      dest_ccode: ccode,
      dest_ccode_name: ccode_name,
      analyzed: {label}
    }
  };
  Object.assign(rec1, getNewVal(rec2));
  Object.assign(rec2, getNewVal(rec1));
}

function clear(groupEntries){
  while(groupEntries.length > 0){
    groupEntries.pop();
  }
}

function handleSingleDrMultiCr(groupEntries, label) {
  const dr = groupEntries.shift();
  const brokenDrs = groupEntries.map(({mc}) => ({...dr, md: mc}));
  for (let i = 0; i < groupEntries.length; i++){
    assignDest(groupEntries[i], brokenDrs[i], label);
  }
  groupEntries.unshift(...brokenDrs);
}

function handleMultiDrSingleCr(groupEntries, label) {
  const cr = groupEntries.pop();
  const brokenCrs = groupEntries.map(({md}) => ({...cr, mc: md}));
  for (let i = 0; i < groupEntries.length; i++){
    assignDest(groupEntries[i], brokenCrs[i], label);
  }
  groupEntries.push(...brokenCrs);
}

function handleMultiDrMultiCr(groupEntries){

  const drRecs = groupEntries.filter(isDr);
  for (let rec of drRecs){
    rec.analyzed = {label:'warn'};
  }
  const crRecs = groupEntries.filter(isCr);
  for (let rec of crRecs){
    rec.analyzed = {label:'warn'};
  }
  const drs = drRecs.map(({md}) => md);
  const crs = crRecs.map(({mc}) => mc);
  const newGroup = [];

  // Assuming that there are still some pairs of dr and cr
  // with same amount.
  findNextPair: while (crs.length > 1 && drs.length > 1) {

    // extract the dr and cr records with same amount from
    // original groupEntries. and update the index.
    for (let cri = 0; cri < crs.length; cri++)
      for (let dri = 0; dri < drs.length; dri++)
        if (Math.abs(crs[cri] - drs[dri]) < 1e-4){
          const foundDr = drRecs.splice(dri, 1)[0];
          const foundCr = crRecs.splice(cri, 1)[0];
          assignDest(foundDr, foundCr, 'info');
          newGroup.push(foundDr, foundCr);
          drs.splice(dri, 1);
          crs.splice(cri, 1);
          break findNextPair;
        }

    // if we reach here, it means that there is no more
    // pair of records with same dr / cr, but neither the
    // rest of cr nor dr is 1. In this case, we have met
    // the unbreakable multi-dr-multi-cr case. And we have
    // to stop immediately, return miserably.
    // 
    // typically the unbreakable multi-dr-multi-cr will be
    // found at the first run of the outer while loop.
    clear(groupEntries);
    groupEntries.push(...newGroup, ...drRecs, ...crRecs);
    return;
  }

  // after extracting possible records, we check if the 1Dr-nCr
  // or nDr-1Cr cases still apply to the remaining records.
  if (drs.length === 1 && crs.length === 1){
    console.log(newGroup, '1-1');
    assignDest(drRecs[0], crRecs[0], 'info')
    newGroup.push(drRecs[0], crRecs[0]);
  } else {
    const restGroup = [...drRecs, ...crRecs];
    if (drs.length === 1){
      handleSingleDrMultiCr(restGroup, 'info');
    } else if (crs.length === 1){
      handleMultiDrSingleCr(restGroup, 'info');
    }
    newGroup.push(...restGroup);
  }
  clear(groupEntries);
  groupEntries.push(...newGroup);
}

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

  let flattenedBalance = flat(balance.data);
  let newBalance = Object.fromEntries(flattenedBalance.map(({ccode, ccode_name}) => {
    return [ccode, {ccode, ccode_name, __children:[]}]
  }));

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);

  for (let i = 0; i < data.length; i++){
    if (isDr(data[i]) && (data[i].mc === undefined)){
      data[i].mc = 0;
    }
    if (isCr(data[i]) && (data[i].md === undefined)){
      data[i].md = 0;
    }
  }

  data.sort((prev, next) => {
    const {iperiod: pP, voucher_id:vidP, voucher_line_num: vlnP} = prev;
    const {iperiod: pN, voucher_id:vidN, voucher_line_num: vlnN} = next;

    return pP !== pN
    ? pP - pN
    : vidP !== vidN
    ? vidP - vidN
    : vlnP - vlnN
  })

  data = data.map(({iperiod, voucher_id, voucher_line_num, digest, ...rest}) => {
    return {digest:`${iperiod}-${voucher_id}-${voucher_line_num}: ${digest}`, ...rest};
  })

  // then we are going to do something tricky here. We walk through the whole
  // journal, and check the multi-credit/debit issue.
  // 
  // 1) For the two consecutive record (entry), that the first is debit, followed by a credit,
  //    then this is the normal / correct case
  // 2) for multiple records, that multiple debit record followed by a credit, then break the
  //    credit into several records, with accrual corresponds to the debit.
  // 3) for single debit followed by multiple credit, break the debit into several records that
  //    correspond to credits.
  // 4) for multiple-credit-multiple-debit, skip.

  const groups = [];

  for (let end = 1, start = 0; end < data.length - 1; end++){

    // Case 1), the simplest one.
    if (isCr(data[end]) && isDr(data[end+1])){
      const groupEntries = data.slice(start, end+1);
      
      let type;
      if (groupEntries.length === 2){
        type = '1DR-1CR';
      } else if (isCr(groupEntries[1])){
        type = '1DR-nCR';
      } else if (isDr(groupEntries.slice(-2)[0])){
        type = 'nDR-1CR'
      } else {
        type = 'nDR-nCR'
      }

      groups.push( {
        groupEntries,
        type,
        start_id: groupEntries[0].id
      })

      start = end + 1;
    }
  }

  // console.log(groups.map(({start_id, groupEntries, type}) => {
  //   const joined = groupEntries.map(rec => {
  //     return isCr(rec) ? 'cr' : isDr(rec) ? 'dr' : 'non';
  //   }).join(' ');
  //   return `${start_id}: ${joined} ${type}`
  // }))

  for (let {type, groupEntries} of groups) {
    switch(type){
      case '1DR-1CR':
        assignDest(groupEntries[0], groupEntries[1]);
        break;
      case '1DR-nCR':
        handleSingleDrMultiCr(groupEntries);
        break;
      case 'nDR-1CR':
        handleMultiDrSingleCr(groupEntries);
        break;
      case 'nDR-nCR':
        handleMultiDrMultiCr(groupEntries);
        break;
    }
  }

  data = groups.map(({groupEntries}) => groupEntries).flat();

  const groupedAccruals = Object.entries(group(data, 'ccode'));
  for (let [ccode, group] of groupedAccruals){
    // if (!(ccode in newBalance)){
    //   console.log(ccode, group[0].ccode_name);
    // }
    console.log(ccode, ccode in newBalance);
  }
  

  // console.log(groups);

  // data = uniq(data, 'ccode');
  // data = cascade(data, 'ccode');
  // console.log(data.length, 'processed');

  await setTable({project_id}, 'ACCRUAL_ANALYSIS', {data})

  return {data};
}

module.exports = accrual_analysis;