const {retrieveRecs} = require('../database');

async function retrieve() {
  
  const data = await retrieveRecs({table: 'CATEGORY_NAME_ALIASES'});
  console.log('category name aliases', data.length);
  if (data.length === 0){
    throw {code: 'DEAD_NOT_FOUND'};
  }
  return {data};
}

module.exports = retrieve;