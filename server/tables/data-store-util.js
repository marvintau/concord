const {retrieve:r, remove:d, create:c} = require('../database');

async function storeTable({project_id, table, data, ...rest}) {
  
  // remove all existing stuff related to given project_id and table.
  await r({project_id, table});

  // save other additional information like indexColumn as supplementary
  // data.
  await c({project_id, table, ...rest, ___DIGEST: true});

  // finally store the data.
  return await c({project_id, table}, data, {flatten: true});
}

async function fetchTable({project_id, table}) {

  const [digest] = await r({project_id, table, ___DIGEST: true});
  const result = await r({project_id, table});

  console.log(digest, 'digest');
  console.log(result.slice(0, 10), 'records');

  return {data: result, ...digest};
}


module.exports = {
  storeTable,
  fetchTable
}