const {update} = require('../database');

const ex = async (fileBuffer, {type, template_id, key}) => {
  if (type === 'UPDATE') {
    console.log("updating with file buffer", type, template_id, key);
    const res = await update({table: 'CONFIRMATION_TEMPLATE', template_id}, {$set: {[key]: fileBuffer}});
    console.log(res, 'updated');
  }
}

module.exports = ex