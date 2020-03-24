const {retrieveTable} = require('../database');

async function get(context) {
  const {project_id} = context;
  console.log(context, 'BALANCE CON')
  const doc = await retrieveTable({project_id}, 'BALANCE');
  console.log(doc, 'BALANCE');
  return doc;
}

module.exports = get;