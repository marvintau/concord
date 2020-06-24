const group = require('@marvintau/chua/src/group');
const flat = require('@marvintau/chua/src/flat');
const trav = require('@marvintau/chua/src/trav');
const add = require('@marvintau/chua/src/add');

const __categorized = {cond:'', cases:[], type:'ref-cond-store'}

const getCategoryPathDict = (cascadedCategories) => {

  let categoryPathDict = flat(cascadedCategories).map(({ccode, __path}) => [ccode, __path]);

  return Object.fromEntries(categoryPathDict);

}

const addJournalEntries = (cascaded, decomposed) => {

  // 1. 得到科目目录所对应的路径表。如果cascaded中的记录没有path属性，那么
  //    再进行一次trav，重新补上path。这个path事实上在实现了数据的聚合之后
  //    就没有用了。

  trav(cascaded);
  const pathDict = getCategoryPathDict(cascaded);
  trav(cascaded);

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
      
      return {ccode, ccode_name, dest_ccode, dest_ccode_name, mc, md, __children, digest, __categorized};
    })
  }


  // 5. 将分组后的分录填到对应的科目目录中
  for (let [ccode, entries] of Object.entries(groupedJournal)){
    add(cascaded, entries, {path: pathDict[ccode]});
  }


  trav(cascaded, (rec) => {

    rec.sub_num = rec.__children
    ? rec.__children.reduce((acc, {sub_num, analyzed}) => {
      if (analyzed){
        return acc + 1;
      } else if (sub_num){
        return acc + sub_num;
      } else {
        return acc
      }
    }, 0)
    : undefined

    if (rec.md === undefined){
      rec.md = rec.__children.reduce((acc, {md}) => acc + md, 0);
    }

    if (rec.mc === undefined){
      rec.mc = rec.__children.reduce((acc, {mc}) => acc + mc, 0);
    }

    // if (rec.__children && rec.__children.every(({digest}) => digest !== undefined)){
    //   rec.dest_ccode_name = `共 ${rec.__children.length} 个对方科目`
    // }

  }, 'POST')
}

module.exports = {
  addJournalEntries
}