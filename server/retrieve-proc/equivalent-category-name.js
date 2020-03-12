const fs = require('fs').promises;
const path = require('path');

async function retrieve() {
  const data = await fs.readFile(path.resolve('./file_store/General/EQUIVALENT_CATEGORY_NAME'));
  return JSON.parse(data.toString());
}

module.exports = retrieve;