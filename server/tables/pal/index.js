
const {fetchTable} = require('../data-store-util');

async function retrieve({project_id}) {
  const retrieved = await fetchTable({project_id, table:'PAL'});
  console.log(Object.keys(retrieved), 'retrieved profit & loss');
  return retrieved;
}

module.exports = {
  retrieve
}