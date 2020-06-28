const {storeTable, fetchTable} = require('../data-store-util');
const {readSingleSheet, columnNameRemap} = require('../data-process-util');

const {flat, trav, group} = require('@marvintau/chua');

let header = [
  ['科目名称' , 'ccode_name'],
  ['是否应用于末级科目', '__applyToSub'],
  ['条件', 'cond'],
  ['分配路径', 'path'],
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
  
  const balanceDict = group(flat(balance.data).filter(({cclass}) => cclass !== undefined), 'ccode_name');
  
  console.log(Object.keys(balanceDict));

  let rules = readSingleSheet(fileBuffer);
  rules = columnNameRemap(rules, header);

  rules = rules.reduce((acc, {ccode_name, __applyToSub, cond, path}) => {
    if (ccode_name.trim().length > 0){
      return [{ccode_name, type:'ref-cond-store', __applyToSub: __applyToSub === 'true', cases:[{cond, path}]}, ...acc];
    } else {
      const [last, ...rest] = acc;
      const {cases} = last;
      return [{...last, cases:[...cases, {cond, path}]}, ...rest];
    }
  }, [])
  rules.reverse();

  for (let rule of rules) {
    if (balanceDict[rule.ccode_name]) {
      const [entry] = balanceDict[rule.ccode_name];
      entry.__categorized_to_tb = rule;

      console.log('found', rule.ccode_name, entry, rule);
    }
  }

  console.log(balance.data.find(({ccode}) => ccode === '1221'))

  return balance;
}

module.exports = {
  upload
};