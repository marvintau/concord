const {retrieveRecs} = require('../database');

async function retrieve() {
  
  const data = await retrieveRecs({table: 'CATEGORY_NAME_ALIASES'});
  console.log('category name aliases', data);
  if (data.length === 0){
    throw {code: 'NOT_FOUND'};
  }
  return {data};
}

module.exports = retrieve;