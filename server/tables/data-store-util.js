const {retrieve:r, remove:d, create:c} = require('../database');

// When calling create table, you just created the project and begin
// to upload the most fundamental data. If you call this again, all
// other data based on this will be cleaned.

async function storeTable({project_id, table, data, ...rest}) {
  
  await d({project_id, table});
  // save other additional information like indexColumn as supplementary
  // data.
  await c({project_id, table, ...rest, ___DIGEST: true});

  // finally store the data.
  return await c({project_id, table}, data, {flatten: true});
}

async function fetchTable({project_id, table}) {

  const [digest] = await r({project_id, table, ___DIGEST: true});
  const result = await r({project_id, table});

  return {data: result, ...digest};
}

const purge = (recs) => {
  for (let i = 0; i < recs.length; i ++) {
    const {_id, ...rest} = recs[i];
    recs[i] = rest;
  }
}

module.exports = {
  storeTable,
  fetchTable,
  purge
}