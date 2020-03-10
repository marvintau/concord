const {insert} = require('./database');
const fs = require('fs').promises;
const path = require('path');

console.log(__dirname, 'post');

async function Project(data){
  try {
    for (let record of data){
      if (record.link === undefined){
        console.log(record, 'to be inserted');
        const res = await insert(record);
        const projectPath = path.resolve(__dirname, '../file_store', `Project/${res.link.query.project_id}`);
        console.log(projectPath);
        await fs.mkdir(projectPath, {recursive: true})
      }
    }
  } catch (err){
    throw err;
  }
}

module.exports = {
  Project
}