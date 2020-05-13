const {retrieveTable} = require('../database');

async function get(context) {
  const {project_id} = context;
  const doc = await retrieveTable({project_id, table:'PROJECT'}, 'ACCRUAL_ANALYSIS');
  return doc;
}

module.exports = get;