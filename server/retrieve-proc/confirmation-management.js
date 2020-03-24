const {retrieveRecs} = require('../database');
// const fs = require('fs').promises;
// const path = require('path');

async function retrieve(context, fetch) {

  if (fetch !== undefined){
    const {project_id, ID} = context;
    const data = await retrieveRecs({table: 'CONFIRMATION_MANAGEMENT', project_id, ID})
    
    if (data.length === 0) {
      throw {code: 'NOT_FOUND'};
    } else {
      return {data: data[0]};
    }

  } else {
    const {project_id} = context;
    const data = await retrieveRecs({table: 'CONFIRMATION_MANAGEMENT', project_id});
    console.log('confirmation', data);
    if (data.length === 0){
      throw {code: 'NOT_FOUND'};
    }
    return {data};
  }

}

module.exports = retrieve;