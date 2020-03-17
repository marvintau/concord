const fs = require('fs').promises;
const path = require('path');
const parse = require('./parse');
const {columnNameRemap, readSingleSheet} = require('./utils');

let header = [
  ['项目', 'item'],
  ['值', 'expr'],
  ['item', 'item'],
  ['expr', 'expr'],
  ['value', 'expr']
]

const CASHFLOW_WORKSHEET = async (fileBuffer, context) => {
  
  const {pid} = context;

  let data = readSingleSheet(fileBuffer);
  data = columnNameRemap(data, header);
  data = parse('BALANCE', data);

  await fs.writeFile(path.resolve(`./file_store/Project/${pid}/CASHFLOW_WORKSHEET`), JSON.stringify(data));

  return {data};
}

module.exports = CASHFLOW_WORKSHEET