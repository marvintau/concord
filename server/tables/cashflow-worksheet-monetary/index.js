const {fetchTable} = require('../data-store-util');

async function retrieve({project_id}) {
  return await fetchTable({project_id, table:'CASHFLOW_WORKSHEET_MONETARY'});
}

module.exports = {
  retrieve
}