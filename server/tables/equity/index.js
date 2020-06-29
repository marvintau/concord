const {fetchTable} = require('../data-store-util');

async function retrieve({project_id}) {
  const retrieved = await fetchTable({project_id, table:'EQUITY'});
  console.log(Object.keys(retrieved), 'retrieved equity transition');
  return retrieved;
}

module.exports = {
  retrieve
}