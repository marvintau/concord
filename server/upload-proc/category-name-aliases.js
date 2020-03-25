const {createRecs} = require('../database');
const {readSingleSheet} = require('./utils');

const EQUIVALENT = async (buffer) => {
  
  let data = readSingleSheet(buffer, false);

  for(let recIndex = 0; recIndex < data.length; recIndex++){
    for (let i = 0; i < data[recIndex].length; i++){
      data[recIndex][i] = data[recIndex][i].trim();
    }
  }

  data = data.filter(e => e.length > 1).map(e => ({alias: e.slice(1)}));

  createRecs('CATEGORY_NAME_ALIASES', data);

  return {data};
}

module.exports = EQUIVALENT