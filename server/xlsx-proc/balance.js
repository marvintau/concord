const fs = require('fs').promises;
const path = require('path');

const {cascade} = require('./utils');

async function balance(data, context){

  const {pid} = context;

  const result = cascade(data, 'ccode');
  await fs.writeFile(path.resolve(`./file_store/Project/${pid}/BALANCE`), JSON.stringify(result));

  return result;
}

module.exports = balance;