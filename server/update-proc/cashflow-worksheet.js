const update = (args) => {
  console.log(args, 'update, cashflow');
  const {type, data, project_id} = args;
  if (type === 'DATA'){
    setTable({project_id}, 'CASHFLOW_WORKSHEET', {data});
  }
}

module.exports = update