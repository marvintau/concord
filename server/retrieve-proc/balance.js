const fs = require('fs').promises;
const path = require('path');

async function retrieve(context) {
  const {pid} = context;
  const filePath = path.resolve('./file_store/PROJECT/', pid, 'BALANCE');
  console.log(filePath);
  const data = await fs.readFile(filePath)
  return {data: JSON.parse(data.toString()), pathColumn:'ccode_name'};
}

module.exports = retrieve;