const {insertRec, remove} = require('../database');
const {v4} = require('uuid');

const update = async (args) => {
  const {type, rec} = args;
  if (type === 'ADD_REC'){
    await insertRec('PROJECT', {...rec, project_id:v4(), link:'PROJECT'})
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
}

module.exports = update