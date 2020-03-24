const {update} = require('../database');

const ex = async (args) => {
  const {type, rec: {project_id, ID}, key, val} = args;
  if (type === 'UPDATE'){
    console.log(args, 'update, confirmation');
    const res = await update({table: 'CONFIRMATION_MANAGEMENT', project_id, ID}, {$set: {[key]: val}});
    console.log(res, 'updated');
  }
}

module.exports = ex