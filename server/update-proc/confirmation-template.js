const {insertRec, remove} = require('../database');
const {v4} = require('uuid');

const update = async (args) => {
  const {type, rec} = args;
  if (type === 'ADD_REC'){
    console.log(type, rec, 'accepted adding rec')
    await insertRec('CONFIRMATION_TEMPLATE', {...rec, template_id:v4()})
  }
  if (type === 'REM_REC'){
    console.log('removing project rec', args);
    const {template_id} = rec;
    try {
      const num = await remove({template_id});
      console.log('removed', template_id, num);
    } catch (error){
      console.error(error);
    }
  }
}

module.exports = update