const {setTable, retrieveTable} = require('../database');

const update = async (args) => {
  const {data, project_id} = args;
  
  await setTable({project_id}, 'CASHFLOW_WORKSHEET', {data});
  
  const doc = await retrieveTable({project_id, table:'PROJECT'}, 'CASHFLOW_WORKSHEET');
  return doc;
}

module.exports = update