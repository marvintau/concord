const {remove, createRecs} = require('../database');

const update = async ({data}) => {
  console.log(data, 'update, equiv names');
  await remove({table: 'CATEGORY_NAME_ALIASES'});
  
  const newData = [];
  for (let {alias} of data){
    newData.push({alias});
  }
  return createRecs('CATEGORY_NAME_ALIASES', newData);
}

module.exports = update