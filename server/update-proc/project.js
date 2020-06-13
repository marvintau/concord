const {insertRec, remove, retrieveRecs, setTable} = require('../database');
const {createRandomData} = require('@marvintau/chua/src/util');
const {v4} = require('uuid');

const SOURCE = {
  name: 'SOURCE',
  desc: '数据源表',
  data: createRandomData({schema: {ccode_name:'string', mc:'number', md:'number'}}),
  indexColumn: 'ccode_name'
};

const TARGET = {
  name: 'TARGET',
  desc: '目标数据表',
  data: createRandomData({schema: {ccode_name:'string', mc:'number', md:'number'}}),
  indexColumn: 'ccode_name'
}

const MEDIATE = {
  name: 'MEDIATE',
  desc: '操作表',
  data: createRandomData({
    recs:50, 
    schema: {item_name:'string', fetch:'fetch', store:'store'}, 
    referredTable:SOURCE
  }),
  indexColumn: 'item_name'
}

const REARRANGE = {
  name: 'REARRANGE',
  desc: '重分类',
  data: createRandomData({
    recs:50, 
    schema: {item_name:'string', fetch:'fetch', store:'condStore'}, 
    referredTable:SOURCE
  }),
  indexColumn: 'item_name'
}

const update = async (args) => {
  const {type, rec} = args;
  if (type === 'ADD_REC'){

    const project_id = v4();

    await insertRec('PROJECT', {...rec, project_id, link:'PROJECT', date: Date.now()})

    await setTable({table:'PROJECT', project_id}, 'SOURCE', SOURCE)
    await setTable({table:'PROJECT', project_id}, 'TARGET', TARGET)
    await setTable({table:'PROJECT', project_id}, 'MEDIATE', MEDIATE)
    await setTable({table:'PROJECT', project_id}, 'REARRANGE', REARRANGE)
  }
  if (type === 'REM_REC'){
    console.log('removing project rec', args);
    const {project_id} = rec;
    try {
      const num = await remove({project_id});
      console.log('removed', project_id, num);
    } catch (error){
      console.error(error);
    }
  }

  const orig = await retrieveRecs({table: 'PROJECT'});

  const data = orig.map(({data, ...rest}) => rest);

  data.sort(({date:dateA}, {date:dateB}) => {
    return dateB - dateA;
  })

  console.log(data.length, 'items, updated projects')
  return {data};
}

module.exports = update