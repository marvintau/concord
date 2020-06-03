var Window = require('window');
global.window = new Window();

const {setTable} = require('../database');
const {read} = require('@marvintau/chua');
const {columnNameRemap, readSingleSheet} = require('./utils');

let header = [
  ['条目', 'desc'],
  ['题目', 'desc'],
  ['项目', 'desc'],
  ['item', 'desc'],
  ['条目-输入', 'ref'],
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
    data[i].ref = {expr: data[i].ref.toString(), type:'fetch-ref'};
  }

  data = read(data, {indexColumn:'desc'})
  const entry = {data};
  await setTable({project_id, table:'PROJECT'}, 'CASHFLOW_WORKSHEET', entry)
  return entry;
}

module.exports = CASHFLOW_WORKSHEET