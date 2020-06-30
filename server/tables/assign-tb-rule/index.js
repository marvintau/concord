const {storeTable, fetchTable} = require('../data-store-util');
const {readSingleSheet, columnNameRemap} = require('../data-process-util');

const {flat, trav, group} = require('@marvintau/chua');

let header = [
  ['科目名称' , 'ccode_name'],
  ['应用于', '__apply_spec'],
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
  
  const balanceEntries = flat(balance.data).filter(({cclass}) => cclass !== undefined);
  for (let entry of balanceEntries) {
    entry.__categorized_to_tb = undefined;
  }

  const balanceDict = group(balanceEntries, 'ccode_name');

  let rules = readSingleSheet(fileBuffer);
  rules = columnNameRemap(rules, header);
  console.log(rules);

  rules = rules.reduce((acc, {ccode_name, __apply_spec, cond, path}) => {
    if (ccode_name.trim().length > 0){
      return [{ccode_name, type:'ref-cond-store', __apply_spec, cases:[{cond, path}]}, ...acc];
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
      entry.__apply_spec = rule.__apply_spec;
    }
  }

  return balance;
}

module.exports = {
  upload
};