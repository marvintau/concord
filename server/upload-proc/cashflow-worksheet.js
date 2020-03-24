const {setTable} = require('../database');
const parse = require('./parse');
const {columnNameRemap, readSingleSheet} = require('./utils');

let header = [
  ['项目', 'item'],
  ['值', 'expr'],
  ['item', 'item'],
  ['expr', 'expr'],
  ['value', 'expr']
]

async function CASHFLOW_WORKSHEET(fileBuffer, context){

  const {project_id} = context;

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);
  data = parse('BALANCE', data);

  const entry = {data};
  await setTable({project_id}, 'CASHFLOW_WORKSHEET', entry)
  return entry;
}

module.exports = CASHFLOW_WORKSHEET