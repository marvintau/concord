const {fetchTable} = require('../data-store-util');

async function retrieve({project_id}) {
  const retrieved = await fetchTable({project_id, table:'SOFP'});
  console.log(Object.keys(retrieved), 'retrieved Statement of Financial Position');
  return retrieved;
}

module.exports = {
  retrieve
}