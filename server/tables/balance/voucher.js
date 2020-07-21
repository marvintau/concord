function isDr({mc, md}) {
  return md !== 0 && (mc === 0 || mc === undefined)
}

function isCr({mc, md}) {
  return mc !== 0 && (md === 0 || md === undefined)
}

function assignDest(rec1, rec2, {label='succ', desc='1Dr/1Cr'}={}){

  const getNewVal = (rec) => {
    const {ccode, ccode_name, __curr:curr} = rec;

    const topLevelCode = ccode.toString().slice(0, 4);
    const desc = curr && curr.item ? `${topLevelCode}:${curr.item}` : ccode_name;

    return {
      dest_ccode: ccode,
      dest_ccode_name: {desc},
      analyzed: {label, desc}
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

function handleSingleDrMultiCr(groupEntries, {label='succ', desc='1Dr/nCr'}={}) {
  const drIndex = groupEntries.findIndex(isDr);
  const [dr] = groupEntries.splice(drIndex, 1);
  const brokenDrs = groupEntries.map(({mc}) => ({...dr, md: mc}));
  for (let i = 0; i < groupEntries.length; i++){
    assignDest(groupEntries[i], brokenDrs[i], {label, desc});
  }
  groupEntries.unshift(...brokenDrs);
}

function handleMultiDrSingleCr(groupEntries, {label='succ', desc='nDr/1Cr'}={}) {
  const crIndex = groupEntries.findIndex(isCr);
  const [cr] = groupEntries.splice(crIndex, 1);
  const brokenCrs = groupEntries.map(({md}) => ({...cr, mc: md}));
  for (let i = 0; i < groupEntries.length; i++){
    assignDest(groupEntries[i], brokenCrs[i], {label, desc});
  }
  groupEntries.push(...brokenCrs);
}

function handleMultiDrMultiCr(groupEntries){

  const drRecs = groupEntries.filter(isDr);
  for (let rec of drRecs){
    rec.analyzed = {label:'warn', desc:'nDr/nCr'};
  }
  const crRecs = groupEntries.filter(isCr);
  for (let rec of crRecs){
    rec.analyzed = {label:'warn', desc:'nDr/nCr'};
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
          assignDest(foundDr, foundCr, {label: 'info'});
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
    // console.log(newGroup, '1-1');
    assignDest(drRecs[0], crRecs[0], {label: 'info'})
    newGroup.push(drRecs[0], crRecs[0]);
  } else {
    const restGroup = [...drRecs, ...crRecs];
    if (drs.length === 1){
      handleSingleDrMultiCr(restGroup, {label: 'info'});
    } else if (crs.length === 1){
      handleMultiDrSingleCr(restGroup, {label: 'info'});
    }
    newGroup.push(...restGroup);
  }
  clear(groupEntries);
  groupEntries.push(...newGroup);
}

// normalize
// 在这里主要做三件事：
// 1. 某些借贷方发生额在导出时是null或undefined，将其设为0。同时对于红
//    字冲销的负数发生额进行调整。负数借方发生额调整为正数贷方，vice
//    versa
// 2. 在导出时如果顺序错误的，将其纠正过来。按照期间-凭证编号-行号排序
// 3. 由于在后续的操作中，我们不再需要完整的凭证数据结构，因此我们将
//    期间-凭证编号-凭证行号-摘要
//    化为同一个数据结构，从而得到每一行所在凭证的完整信息，关于凭证信息
//    可以之后再从序时账中查询。
const normalize = (data) => {
  for (let i = 0; i < data.length; i++){
    if (isDr(data[i])){
      const {md} = data[i];
      Object.assign(data[i], md < 0 ? {mc:-md, md: 0} : {md, mc: 0});
    }
    if (isCr(data[i])){
      const {mc} = data[i];
      Object.assign(data[i], mc < 0 ? {md:-mc, mc: 0} : {mc, md: 0});
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

  return data.map(({iperiod, voucher_id, voucher_line_num=0, digest, ...rest}) => {
    return {digest:`${iperiod}-${voucher_id}-${voucher_line_num}: ${digest}`, ...rest};
  })
}

// then we are going to do something tricky here. We walk through the whole
// journal, and check the multi-credit/debit issue.
// 接下来进行一些比较微妙的调整。我们将遍历整个序时帐，并且解决单个凭证中多借
// 多贷的问题
// 
// 1) For the two consecutive record (entry), that the first is debit, followed by a credit,
//    then this is the normal / correct case
//    对于两个相邻的分录（一般算作一条分录），如果第一行是借，第二行是贷，那么它是最一般的一借
//    一贷格式。
// 2) for multiple records, that multiple debit record followed by a credit, then break the
//    credit into several records, with accrual corresponds to the debit.
//    对于多借一贷的情形，将最后的一条贷分录拆分为多个发生额与借方对应的记录
// 3) for single debit followed by multiple credit, break the debit into several records that
//    correspond to credits.
//    一借多贷与上述同理
// 4) for multiple-credit-multiple-debit, first attempt to break it into the 3 cases mentioned
//    above. If not breakable, or MC/MD with different value, then mark and skip.
//    

const decompose = (data) => {
  const groups = [];

  let mc = 0, md = 0;
  for (let start = 0, end = 0; end < data.length - 1; end++){

    mc += data[end].mc || 0;
    md += data[end].md || 0;

    // console.log(data[end].mc, data[end].md, Math.abs(mc - md), 'check')

    if (Math.abs(mc - md) < 1e-4){
      let groupEntries = data.slice(start, end+1);
      const drRecs = groupEntries.filter(isDr);
      const crRecs = groupEntries.filter(isCr);
      groupEntries = [...drRecs, ...crRecs];

      let type;
      if (groupEntries.length === 2){
        type = '1DR-1CR';
      } else if (groupEntries.filter(isDr).length === 1){
        type = '1DR-nCR';
      } else if (groupEntries.filter(isCr).length === 1){
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

  // console.log(groups, 'for test')

  return groups.map(({groupEntries}) => groupEntries).flat();
}

module.exports = {
  normalize,
  decompose
}