const fs = require('fs').promises;
const path = require('path');
const {columnNameRemap, readSingleSheet} = require('./utils');

let header = [
  ['项目', 'item'],
  ['值', 'expr']
  ['item', 'item'],
  ['expr', 'expr']
]



const CASHFLOW_WORKSHEET = async (fileBuffer, context) => {
  
  const {pid} = context;

  const data = readSingleSheet(fileBuffer);
  const mapped = columnNameRemap(data, header);
  await fs.writeFile(path.resolve(`./file_store/Project/${pid}/CASHFLOW_WORKSHEET`), JSON.stringify(mapped));

  return data;
}

module.exports = CASHFLOW_WORKSHEET