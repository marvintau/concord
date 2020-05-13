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
  // rec1.dest_ccode_name = rec2.ccode_name;
  // rec1.dest_ccode = rec2.ccode;
  // rec2.dest_ccode_name = rec1.ccode_name;
  // rec2.dest_ccode = rec1.ccode;
  // rec1.analyzed = {label};
  // rec2.analyzed = {label};
  Object.assign(rec1, getNewVal(rec2));
  Object.assign(rec2, getNewVal(rec1));
}

function clear(group){
  while(group.length > 0){
    group.pop();
  }
}

function handleSingleDrMultiCr(group, label) {
  const dr = group.shift();
  const brokenDrs = group.map(({mc}) => ({...dr, md: mc}));
  for (let i = 0; i < group.length; i++){
    assignDest(group[i], brokenDrs[i], label);
  }
  group.unshift(...brokenDrs);
}

function handleMultiDrSingleCr(group, label) {
  const cr = group.pop();
  const brokenCrs = group.map(({md}) => ({...cr, mc: md}));
  for (let i = 0; i < group.length; i++){
    assignDest(group[i], brokenCrs[i], label);
  }
  group.push(...brokenCrs);
}

function handleMultiDrMultiCr(group){

  const drRecs = group.filter(isDr);
  for (let rec of drRecs){
    rec.analyzed = {label:'warn'};
  }
  const crRecs = group.filter(isCr);
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
    // original group. and update the index.
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
    clear(group);
    group.push(...newGroup, ...drRecs, ...crRecs);
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
  clear(group);
  group.push(...newGroup);
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

  let newBalance = balance.data.map(({ccode, ccode_name}) => {
    return [ccode, {ccode, ccode_name, __children:[]}]
  });
  console.log(Object.keys(newBalance))

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
      const group = data.slice(start, end+1);
      
      let type;
      if (group.length === 2){
        type = '1DR-1CR';
      } else if (isCr(group[1])){
        type = '1DR-nCR';
      } else if (isDr(group.slice(-2)[0])){
        type = 'nDR-1CR'
      } else {
        type = 'nDR-nCR'
      }

      groups.push( {
        group,
        type,
        start_id: group[0].id
      })

      start = end + 1;
    }
  }

  // console.log(groups.map(({start_id, group, type}) => {
  //   const joined = group.map(rec => {
  //     return isCr(rec) ? 'cr' : isDr(rec) ? 'dr' : 'non';
  //   }).join(' ');
  //   return `${start_id}: ${joined} ${type}`
  // }))

  for (let {type, group} of groups) {
    switch(type){
      case '1DR-1CR':
        assignDest(group[0], group[1]);
        break;
      case '1DR-nCR':
        handleSingleDrMultiCr(group);
        break;
      case 'nDR-1CR':
        handleMultiDrSingleCr(group);
        break;
      case 'nDR-nCR':
        handleMultiDrMultiCr(group);
        break;
    }
  }

  data = groups.map(({group}) => group).flat();

  // console.log(groups);

  // data = uniq(data, 'ccode');
  // data = cascade(data, 'ccode');
  // console.log(data.length, 'processed');

  await setTable({project_id}, 'ACCRUAL_ANALYSIS', {data})

  return {data};
}

module.exports = accrual_analysis;