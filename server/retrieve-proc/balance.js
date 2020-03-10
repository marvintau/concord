const fs = require('fs').promises;
const path = require('path');

async function retrieve(context) {
  const {pid} = context;
  const filePath = path.resolve('./file_store/Project/', pid, 'BALANCE');
  console.log(filePath);
  const data = await fs.readFile(filePath)
  return JSON.parse(data.toString());
}

module.exports = retrieve;