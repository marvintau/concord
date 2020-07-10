const {storeTable, fetchTable} = require('../data-store-util');
const {readSingleSheet, columnNameRemap} = require('../data-process-util');

const {flat, trav, group} = require('@marvintau/jpl');

let header = [
  ['科目名称' , 'ccode_name'],
  ['应用于', 'apply_spec'],
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
    entry.categorized_to_tb = {type:'ref-cond-store', applySpec:'', cases:[]};
  }

  const balanceDict = group(balanceEntries, ({ccode_name}) => ccode_name.toString().trim().replace(/\s*/g, ''));

  let rules = readSingleSheet(fileBuffer);
  rules = columnNameRemap(rules, header);
  // console.log(rules);

  rules = rules.reduce((acc, {ccode_name, apply_spec, cond, path}) => {
    if (ccode_name === undefined || ccode_name.toString().trim().length === 0){
      const [last, ...rest] = acc;
      const {cases} = last;
      return [{...last, cases:[...cases, {cond, path}]}, ...rest];
    } else {
      return [{ccode_name, type:'ref-cond-store', applySpec:apply_spec, cases:[{cond, path}]}, ...acc];
    }
  }, [])
  rules.reverse();

  for (let rule of rules) {
    if (balanceDict[rule.ccode_name]) {
      const entries = balanceDict[rule.ccode_name];
      for (let entry of entries){
        entry.categorized_to_tb = rule;
      }
    }
  }

  storeTable(balance);
  return balance;
}

module.exports = {
  upload
};