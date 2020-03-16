const fs = require('fs').promises;
const path = require('path');

async function retrieve(context) {
  const {pid} = context;
  const data = await fs.readFile(path.resolve('./file_store/Project/', pid, 'CONFIRMATION_MANAGEMENT'));
  return {data: JSON.parse(data.toString())};
}

module.exports = retrieve;