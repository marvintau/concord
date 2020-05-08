const {createRecs, remove} = require('../database');
const {readSingleSheet} = require('./utils');

const EQUIVALENT = async (buffer) => {
  
  remove({table: 'CATEGORY_NAME_ALIASES'});

  let data = readSingleSheet(buffer, false);

  for(let recIndex = 0; recIndex < data.length; recIndex++){
    for (let i = 0; i < data[recIndex].length; i++){
      data[recIndex][i] = data[recIndex][i].trim();
    }
  }

  data = data.filter(e => e.length > 1).map(alias => ({alias}));

  createRecs('CATEGORY_NAME_ALIASES', data);

  return {data};
}

module.exports = EQUIVALENT