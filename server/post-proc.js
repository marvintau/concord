const {insert} = require('./database');
const fs = require('fs').promises;
const path = require('path');
const {v4} = require('uuid');

console.log(__dirname, 'post');

async function PROJECT(data){
  try {
    for (let record of data){
      if (record.link === undefined){
        console.log(record, 'to be inserted');
        const res = await insert({...record, pid:v4(), link:record.table});
        const projectPath = path.resolve(__dirname, '../file_store', `PROJECT/${res.pid}`);
        console.log(projectPath);
        await fs.mkdir(projectPath, {recursive: true})
      }
    }
  } catch (err){
    throw err;
  }
}

module.exports = {
  PROJECT
}