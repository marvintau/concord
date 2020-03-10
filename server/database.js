const path = require('path');

const Datastore = require('nedb-promise');
const db = new Datastore({
  filename: path.resolve(__dirname, '../data_store/data.json'),
  autoload: true
});

function insert ({table, ...rest}) {
  if (table === undefined){
    throw {error: 'DEAD_TABLE_NOT_SPECIFIED'}
  } else {
    return db.insert({table, ...rest})
  }
}

function remove (critCol, critVal) {
  return db.remove({[critCol]: critVal}, {multi: true});
}

function update (critCol, critVal, column, val) {
  return db.update({[critCol]: critVal}, {[column]: val});
}

function retrieve (critCol, critVal) {
  return db.find({[critCol]: critVal})
}

module.exports = {
  insert,
  remove,
  update,
  retrieve
}