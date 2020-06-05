const {retrieveTable} = require('../database');

async function get(context) {
  const {project_id} = context;
  const doc = await retrieveTable({project_id, table:'PROJECT'}, 'PAL');
  return doc;
}

module.exports = get;