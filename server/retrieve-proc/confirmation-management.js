const {retrieveRecs} = require('../database');
// const fs = require('fs').promises;
// const path = require('path');

async function retrieve(context) {
  const {project_id} = context;
  const data = await retrieveRecs({table: 'CONFIRMATION_MANAGEMENT', project_id});
  if (data.length === 0){
    throw {code: 'NOT_FOUND'};
  }
  return {data};
}

module.exports = retrieve;