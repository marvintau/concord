const {retrieveTable} = require('../database');

async function get(context) {
  const {project_id} = context;
  console.log(context, 'MEDIATE CON')
  const doc = await retrieveTable({project_id, table:'PROJECT'}, 'MEDIATE');
  console.log(doc, 'MEDIATE');
  return doc;
}

module.exports = get;