const {fetchTable} = require('../data-store-util');

async function retrieve({project_id}) {
  const retrieved = await fetchTable({project_id, table:'CASHFLOW'});
  console.log(Object.keys(retrieved), 'retrieved Cashflow');
  return retrieved;
}

module.exports = {
  retrieve
}