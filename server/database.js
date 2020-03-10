const Datastore = require('nedb-promise');
const db = new Datastore();

const {v4} = require('uuid');
const {genName} = require('./nameGenerate');

function insert ({table, ...rest}) {
  if (table === undefined){
    throw {error: 'DEAD_TABLE_NOT_SPECIFIED'}
  } else {
    const link = {path: table, query: {[`${table.toLowerCase()}_id`]: v4()}}
    return db.insert({table, ...rest, link})
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

(async () => {
  for (let i = 0; i < 20; i++){
    await insert({table:'Project', name: `${genName()} Inc.`, type:'company', volume: Math.random() * 10e6});
  }

  // let result = await retrieve('type', 'company');

  // console.log(result, 'yeah');
})();

module.exports = {
  insert,
  remove,
  update,
  retrieve
}