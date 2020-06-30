const now = require('performance-now');

const group = require('@marvintau/chua/src/group');
const flat = require('@marvintau/chua/src/flat');
const trav = require('@marvintau/chua/src/trav');
const add = require('@marvintau/chua/src/add');
const get = require('@marvintau/chua/src/get');

const getCategoryPathDict = (cascadedCategories) => {

  let categoryPathDict = flat(cascadedCategories).map(({ccode, __path}) => [ccode, __path]);

  return Object.fromEntries(categoryPathDict);

}

// groupSum

// 一个group指的是，group中的每个key都代表了array of record，那么现在是要
// 通过array of record的加和操作，得到key所对应的一个新的record，那么基于
// 原先的group就会得到一个array of record，而原先每个key所对应的array of
// record则成为结果中每个record的__children。

// 具体应用是，例如我们拥有了关于余额表某科目的若干条分录，但是我们需要先将这若干
// 条分录按照其对方科目分组，并得到对于不同的对方科目的总发生额，那么我们需
// 要在余额表的某科目下创建针对不同对方科目的发生额，再将不同对方科目的分录
// 关联至对方科目总发生额条目的下面。

// 需要注意，group key就不再重要，因此不会参与到后续运算。
// 此外，extra中如果和其它字段有重复属性名，则会覆盖原有属性，这是故意的。

const groupSum = (group, extra={}) => {
  return Object.entries(group).map(([k, g]) => {
    let {ccode, ccode_name} = g[0];
    let idInfo = {ccode, ccode_name};

    let md = g.reduce((acc, {md}) => acc + md, 0);
    let mc = g.reduce((acc, {mc}) => acc + mc, 0);
    let __children = g;

    let ex = {};
    for (let exKey in extra) {
      ex[exKey] = typeof extra[exKey] === 'function'
      ? ex[exKey] = extra[exKey](g, k)
      : ex[exKey] = extra[exKey]
    }

    return {...idInfo, mc, md, __children, ...ex};
  })
}

const categorize = (balance, decomposed) => {

  trav(balance);
  const pathDict = getCategoryPathDict(balance);
  trav(balance);

  // 1. 将已经分解的分录按照本方科目编码分组。
  const groupedJournal = group(decomposed, 'ccode');

  const extra = {
    dest_ccode([{dest_ccode}]) {return dest_ccode},
    dest_ccode_name(_, k) { return k },
    digest([first]){
      const {dest_ccode:dc, dest_ccode_name:dcn} = first;
      return dc ? `对方科目为 ${dcn && dcn.desc || dcn} - ${dc}` : '未归类';
    },
    __categorized:{cond:'', cases:[], type:'ref-cond-store'}
  }

  // 2. 对于每个分组，如果分组内的分录有curr属性，即意味着它是之前处理过的
  //    往来科目，那么我们需要依据明细科目（客户/供应商/个人）再进行分组，
  //    再对明细科目按照其对方科目发生额进行分类，否则，则直接按对方科目发
  //    生额分类

  const beforeCascadeT = now();
  let groupTimes = 0, groupedRecords = 0;

  for (let ccode in groupedJournal){
    const entries = groupedJournal[ccode];
    if (entries.some(({__curr}) => __curr !== undefined)) {

      const groupedSub = group(entries, ({__curr:{item}={}}) => item || '其他明细科目');
      for (let subName in groupedSub) {
        const subEntries = groupedSub[subName];
        const groupedDest = group(subEntries, ({dest_ccode_name}) => {
          return dest_ccode_name 
          ? (dest_ccode_name.desc || dest_ccode_name)
          : '其他对方科目'
        });
        groupedSub[subName] = groupSum(groupedDest, extra);
      }

      groupedJournal[ccode] = groupSum(groupedSub, {
        ccode_name(g, k){ return k }
      });
      for (let rec of groupedJournal[ccode]) {
        rec.__detailed_level = true;
      }
    } else {
      const groupedDest = group(entries, ({dest_ccode_name}) => {
        return dest_ccode_name 
        ? (dest_ccode_name.desc || dest_ccode_name)
        : '其他对方科目'
      });

      groupedJournal[ccode] = groupSum(groupedDest, extra);
    }
  }
  const endCascadeT = now();
  console.log(endCascadeT - beforeCascadeT, 'total grouping time');

  // 5. 将分组后的分录填到对应的科目目录中
  for (let [ccode, entries] of Object.entries(groupedJournal)){
    add(balance, entries, {path: pathDict[ccode]});
    if (entries.every(({__detailed_level}) => __detailed_level === undefined)) {
      const {record} = get(balance, {path: pathDict[ccode]});
      record.__detailed_level = true;
    }
  }

  console.log(flat(balance).filter(({__detailed_level}) => __detailed_level), 'has detailed level');

  trav(balance, (rec) => {

    if (rec.md === undefined){
      rec.md = rec.__children.reduce((acc, {md}) => acc + md, 0);
    }

    if (rec.mc === undefined){
      rec.mc = rec.__children.reduce((acc, {mc}) => acc + mc, 0);
    }

  }, 'POST')
}

module.exports = {
  categorize
}