const {insert} = require('./database');

async function Project(data){
  try {
    for (let record of data){
      if (record.link === undefined){
        console.log(record, 'to be inserted');
        await insert(record);
      }
    }
  } catch (err){
    throw err;
  }
}

module.exports = {
  Project
}