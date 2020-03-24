const fs = require('fs').promises;
const path = require('path');
const {readSingleSheet} = require('./utils');

const EQUIVALENT = async (buffer) => {
  
  let data = readSingleSheet(buffer, false);

  for(let recIndex = 0; recIndex < data.length; recIndex++){
    for (let i = 0; i < data[recIndex].length; i++){
      data[recIndex][i] = data[recIndex][i].trim();
    }
  }

  data = data.filter(e => e.length > 1).map(e => ({equiv: e.slice(1)}));

  await fs.mkdir(`./file_store/General`, {recursive: true});
  await fs.writeFile(path.resolve(`./file_store/General/EQUIVALENT_CATEGORY_NAME`), JSON.stringify(data));

  console.log(data);
  return data;
}

module.exports = EQUIVALENT