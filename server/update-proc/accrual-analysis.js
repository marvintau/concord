const {setTable, retrieveTable} = require('../database');

const update = async (args) => {
  const {data, project_id} = args;
  
  await setTable({project_id}, 'ACCRUAL_ANALYSIS', {data});
  
  const doc = await retrieveTable({project_id, table:'PROJECT'}, 'ACCRUAL_ANALYSIS');
  return doc;
}

module.exports = update