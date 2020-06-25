const now = require('performance-now');

const {trav, flat} = require('@marvintau/chua');
// const trav = require('@marvintau/chua/src/trav')
// const flat = require('@marvintau/chua/src/flat')

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

async function insertMany(recs) {
  const newElem = [];
  const existing = [];
  for (let i = 0; i < recs.length; i++) {
    const rec = recs[i];
    rec._id === undefined ? (newElem.push(rec)) : (existing.push(rec));
  }
  if (newElem.length > 0){
    await getColl().insertMany(newElem);
  }

  // for (let i = 0; i < existing.length; i++){
  //   const {_id} = existing[i];
  //   await getColl().updateOne({_id}, {$set: existing[i]}, {upsert: true});
  // }
  Promise.all(existing.map(async rec => {
    const {_id} = rec;
    await getColl().updateOne({_id}, {$set: rec}, {upsert: true});
  }))
}


// 保存大型的数据表文档
// 由于MongoDB的BSON文档有16MB的限制，当我们要存储一个较大企业的序时帐时很可能会不够用。
// 因此保存数据时，我们将nested record扁平化，每个记录作为独立的document进行储存，同时
// 生成一个索引表，帮助我们在retrieve的时候能够较快地恢复其原有结构。
// 
// 显然，如果我们随意增删改动这些被拆分的records，会对整个数据结构造成破坏，所以我们不
// 允许对这单个record进行操作，表只能完整地重新创建或删除。
// 
// 这里所谓的大型文档符合我们在chua中所定义和实现的规范，即添加`__children`和`__path`属
// 性来描述其结构性质。

/**
 * create
 * ======
 * create records / tables
 * 
 * @param {{}} idents additional identification info for record
 * @param {{}} records the record
 * @param {{}} options options
 */
async function create(idents, records, {flatten}={}) {

  let actualRecords = Array.isArray(records) ? records : [records];
  
  if(!flatten) {
    const preparedRecs = actualRecords.map(rec => ({...rec, ...idents}));
    return getColl().insertMany(preparedRecs);
  } else {

    const map = [];

    trav(actualRecords);
    const flattened = flat(actualRecords);

    for (let rec of flattened) {
      const id = rec.__path.join('-');
      rec.___ID = id;
      if (rec.__path.length > 0) {
        const parent_id = rec.__path.slice(0, -1).join('-');
        map.push([id, parent_id]);
      }
    }

    const preparedRecs = flattened.map(({__path, __children, ...rest}) => {
      return {...rest, ...idents}
    })

    const beforeInsertT = now();
    await insertMany(preparedRecs);
    const afterInsertT = now();
    console.log('inserted',preparedRecs.length, 'records, using', afterInsertT - beforeInsertT, 'ms');
    return getColl().insertOne({...idents, ___NESTED:true, map})
  }
}

async function remove (idents) {
  return getColl().deleteMany(idents);
}

async function update (crit, vals) {
  return getColl().updateMany(crit, vals);
}

async function retrieve (idents) {
  const mapHold = await getColl().findOne({...idents, ___NESTED:true});
 
  if (mapHold === null) {
    return await getColl().find(idents).toArray();
  } else {

    const beginRetrieveT = now();

    const records = await getColl().find({...idents, ___ID: {$ne: null}}).toArray();
    const mapped = Object.fromEntries(records.map(rec => [rec.___ID, rec]));
    const result = []

    const {map} = mapHold;
    for (let i = 0; i < map.length; i++) {
      const [child_id, parent_id] = map[i];
      if (parent_id.length === 0) {
        result.push(mapped[child_id]);
      } else {
        const child = mapped[child_id];
        const parent = mapped[parent_id];
        if (parent.__children === undefined) {
          parent.__children = [];
        }
        parent.__children.push(child);
      }
    }

    const endRetrieveT = now();

    console.log('retrieve costs', (endRetrieveT - beginRetrieveT).toFixed(2), 'ms');
    console.log('records', records.length, 'in total');

    return result;
  }
}

module.exports = {
  create,
  retrieve,
  update,
  remove,
  init
}