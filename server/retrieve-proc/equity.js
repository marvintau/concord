const {retrieveTable} = require('../database');

async function get(context) {
  const {project_id} = context;
  const doc = await retrieveTable({project_id, table:'PROJECT'}, 'EQUITY');
  console.log('equity', doc);
  return doc;
}

module.exports = get;