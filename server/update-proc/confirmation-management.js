const {update, retrieveRecs} = require('../database');

const ex = async (args) => {
  const {type, rec: {project_id, ID}, key, val} = args;
  if (type === 'UPDATE'){
    
    await update({table: 'CONFIRMATION_MANAGEMENT', project_id, ID}, {$set: {[key]: val}});

    const data = await retrieveRecs({table: 'CONFIRMATION_MANAGEMENT', project_id, ID})

    return {data};
  }
}

module.exports = ex