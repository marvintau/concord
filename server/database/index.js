const mongo = require('mongodb').MongoClient;

let conn, db, coll;

const init = async () => {
  try {
    if (conn !== undefined) {
      console.log('database has been initialized.');
      return;
    }

    conn = await mongo.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
    db = conn.db('main');
    coll = db.collection('tables');
    // console.log(coll);
  } catch (error) {
    console.log(error);
    console.log('Error during initializing DB');
  }
};

const getColl = () => {
  if (coll === undefined) {
    throw Error('Database not initialized');
  }
  return coll;
}

// const Datastore = require('nedb-promise');
// const db = new Datastore({
//   filename: path.resolve(__dirname, '../data_store/data.json'),
//   autoload: true
// });

// for creating flattened data
async function createRecs(table, records) {
  if (table === undefined) {
    throw {code: 'DEAD_TABLE_NOT_SPECIFIED'}
  }
  const preparedRecs = records.map(rec => ({...rec, table}));
  return getColl().insertMany(preparedRecs);
}

// for creating / updating structured data. the crit
// could be a project ID. thus all the tables here will
// be associated with the ID.
async function setTable(crit, table, doc) {
  if (table === undefined) {
    throw {code: 'DEAD_TABLE_NOT_SPECIFIED'}
  }
  return getColl().update(crit, {$set: {[`data.${table}`]: doc}}, {upsert: true});
}

async function insertRec (table, rec) {
  if (table === undefined){
    throw {code: 'DEAD_TABLE_NOT_SPECIFIED'}
  } else {
    return getColl().insertOne({...rec, table})
  }
}

async function remove (crit) {
  return getColl().deleteMany(crit);
}

async function update (crit, vals) {
  return getColl().updateMany(crit, vals);
}

async function retrieveRecs (crit) {
  return getColl().find(crit).toArray();
}

async function retrieveTable (crit, table) {
  const doc = await coll.findOne(crit);
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
  init
}