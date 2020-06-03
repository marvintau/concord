const {setTable} = require('../database');

const update = (args) => {
  const {type, data, project_id} = args;
  if (type === 'DATA'){
    return setTable({project_id}, 'CASHFLOW_WORKSHEET', {data});
  }
}

module.exports = update