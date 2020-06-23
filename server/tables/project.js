const {create:c, remove:d, retrieve:r} = require('../database');
const {v4} = require('uuid');

async function retrieve() {
  const orig = await r({table: 'PROJECT'});

  const data = orig.map(({data, ...rest}) => rest);

  data.sort(({date:dateA}, {date:dateB}) => {
    return dateB - dateA;
  })

  return {data};
}

async function update (args) {
  const {type, rec} = args;
  if (type === 'ADD_REC'){

    const project_id = v4();

    await c('PROJECT', {...rec, project_id, link:'PROJECT', date: Date.now()})

  }
  if (type === 'REM_REC'){
    console.log('removing project rec', args);
    const {project_id} = rec;
    try {
      const num = await d({project_id});
      console.log('removed', project_id, num);
    } catch (error){
      console.error(error);
    }
  }

  return await retrieve();
}

module.exports = {
  update,
  retrieve
}