const fs = require('fs').promises;
const path = require('path');

const CASHFLOW_WORKSHEET = async (data, context) => {
  
  const {pid} = context;

  await fs.writeFile(path.resolve(`./file_store/Project/${pid}/CASHFLOW_WORKSHEET`), JSON.stringify(data));

  return data;
}

module.exports = CASHFLOW_WORKSHEET