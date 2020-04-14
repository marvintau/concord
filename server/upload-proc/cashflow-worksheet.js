var Window = require('window');
global.window = new Window();

const {setTable} = require('../database');
const {trav, read} = require('@marvintau/chua');
const {columnNameRemap, readSingleSheet} = require('./utils');

let header = [
  ['条目', 'desc'],
  ['项目', 'desc'],
  ['item', 'desc'],
  ['取值', 'ref'],
  ['expr', 'ref'],
  ['value', 'ref']
]

async function CASHFLOW_WORKSHEET(fileBuffer, context){

  const {project_id} = context;

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);
  for (let i = 0; i < data.length; i++){
    if (data[i].desc === undefined) data[i].desc = '';
    data[i].ref = {expr: data[i].ref};
  }

  data = read(data, {indexColumn:'desc'})
  const entry = {data};
  await setTable({project_id}, 'CASHFLOW_WORKSHEET', entry)
  return entry;
}

module.exports = CASHFLOW_WORKSHEET