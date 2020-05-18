const group = require('@marvintau/chua/src/group');
const flat = require('@marvintau/chua/src/flat');
const casc = require('@marvintau/chua/src/casc');
const {trav} = require('@marvintau/chua/src/util');
const add = require('@marvintau/chua/src/add');

// 我们
const getCascadedCategories = (balanceData) => {

  const flattenedBalance = flat(balanceData);

  // get the dictionary of category from balance table.
  let cascadedCategories = flattenedBalance.map(({ccode, ccode_name}) => {
    return {ccode, ccode_name, __children:[]}
  });
  // cascade it.
  let cascaded = casc(cascadedCategories, {cascCol:'ccode'});
  // traverse the cascaded to get path of each node.
  trav(cascaded);

  return cascaded;
}

const getCategoryPathDict = (cascadedCategories) => {

  let categoryPathDict = flat(cascadedCategories).map(({ccode, __path}) => [ccode, __path]);

  return Object.fromEntries(categoryPathDict);

}

const addJournalEntries = (cascaded, decomposed) => {

  // 1. 得到科目目录所对应的路径表
  const pathDict = getCategoryPathDict(cascaded);

  // 2. 按照路径表找到所有的对方科目所在路径
  for(let i = 0; i < decomposed.length; i++){
    const {dest_ccode} = decomposed[i];
    if (dest_ccode){
      const dest_path = pathDict[dest_ccode];
      decomposed[i].dest_ccode_name.path = dest_path;
    }
  }

  // 3. 将已经分解的分录按照本方科目编码分组
  const groupedJournal = group(decomposed, 'ccode');

  // 4. 在每个本方分组内，按照对方科目编码分组
  for (let ccode in groupedJournal){
    const entries = groupedJournal[ccode];
    const groupedByDest = group(entries, 'dest_ccode');
    groupedJournal[ccode] = Object.values(groupedByDest).map(g => {
      let {ccode, ccode_name, dest_ccode, dest_ccode_name} = g[0];
      let md = g.reduce((acc, {md}) => acc + md, 0);
      let mc = g.reduce((acc, {mc}) => acc + mc, 0);
      let __children = g;
      let digest = dest_ccode
      ? `对方科目为 ${dest_ccode_name && dest_ccode_name.desc || dest_ccode_name} - ${dest_ccode}`
      : '未归类';
      
      return {ccode, ccode_name, dest_ccode, dest_ccode_name, mc, md, __children, digest};
    })
  }

  // 5. 将分组后的分录填到对应的科目目录中
  for (let [ccode, entries] of Object.entries(groupedJournal)){
    add(cascaded, entries, {path: pathDict[ccode]});
  }

  trav(cascaded, (rec) => {
    // console.log(rec);
    if (rec.__children === undefined || rec.__children.length === 0){
      rec.descendant_num = 1;
    } else {
      rec.descendant_num = rec.__children.reduce((acc, {descendant_num}) => acc + descendant_num, 0);
    }

    if (rec.md === undefined){
      rec.md = rec.__children.reduce((acc, {md}) => acc + md, 0);
    }

    if (rec.mc === undefined){
      rec.mc = rec.__children.reduce((acc, {mc}) => acc + mc, 0);
    }

  }, 'POST')

}

module.exports = {
  getCascadedCategories,
  addJournalEntries
}