const {insertRec, remove, retrieveRecs} = require('../database');
const {v4} = require('uuid');

const update = async (args) => {
  const {type, rec} = args;
  if (type === 'ADD_REC'){
    await insertRec('PROJECT', {...rec, project_id:v4(), link:'PROJECT', date: Date.now()})
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