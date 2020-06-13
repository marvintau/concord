var Window = require('window');
global.window = new Window();

const {setTable} = require('../database');
const {readSingleText} = require('./utils');
const read = require('@marvintau/chua/src/read');
const trav = require('@marvintau/chua/src/trav');

async function sofp(fileBuffer, context){

  const {project_id} = context;

  let data = readSingleText(fileBuffer).filter(line => line.length > 0 && !line.startsWith('*'));
  data = read(data.map(item => ({item})), {indexColumn:'item'})
  trav(data, rec => {
    console.log(rec, 'trav rec')
    rec.item = rec.item.replace(/#\s*/g, '');
  })
  console.log(data[0].__children, data.length, 'processed');
  
  const entry = {data, indexColumn:'item'};
  await setTable({project_id}, 'SOFP', entry)

  return entry;
}

module.exports = sofp;