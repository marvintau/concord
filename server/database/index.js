const path = require('path');

const Datastore = require('nedb-promise');
const db = new Datastore({
  filename: path.resolve(__dirname, '../data_store/data.json'),
  autoload: true
});

// for creating flattened data
function createRecs(table, records) {
  if (table === undefined) {
    throw {code: 'DEAD_TABLE_NOT_SPECIFIED'}
  }
  const preparedRecs = records.map(rec => ({...rec, table}));
  return db.insert(preparedRecs);
}

// for creating / updating structured data. the crit
// could be a project ID. thus all the tables here will
// be associated with the ID.
function setTable(crit, table, doc) {
  if (table === undefined) {
    throw {code: 'DEAD_TABLE_NOT_SPECIFIED'}
  }
  return db.update(crit, {$set: {[`data.${table}`]: doc}}, {upsert: true});
}

function insertRec (table, rec) {
  if (table === undefined){
    throw {code: 'DEAD_TABLE_NOT_SPECIFIED'}
  } else {
    return db.insert({...rec, table})
  }
}

function remove (crit) {
  return db.remove(crit, {multi: true});
}

function update (crit, vals) {
  return db.update(crit, vals);
}

function retrieveRecs (crit) {
  return db.find(crit)
}

async function retrieveTable (crit, table) {
  const doc = await db.findOne(crit);
  console.log(doc, 'retrieve table')
  if (doc.data === undefined){
    throw {code: 'DEAD_NOT_FOUND'}
  } else if (doc.data[table] === undefined){
    console.log('not found table', table);
    throw {code: 'DEAD_NOT_FOUND'}
  } else {
    return doc.data[table];
  }
}

module.exports = {
  createRecs,
  setTable,
  insertRec,
  retrieveRecs,
  retrieveTable,
  update,
  remove,
}