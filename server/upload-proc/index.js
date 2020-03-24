
const BALANCE = require('./balance');
const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const CONFIRMATION_MANAGEMENT = require('./confirmation-management');
const EQUIVALENT_CATEGORY_NAME = require('./equivalent-category-name');

const uploadDict = {
  BALANCE,
  CASHFLOW_WORKSHEET,
  CONFIRMATION_MANAGEMENT,
  EQUIVALENT_CATEGORY_NAME
}

async function dataProc(fileBuffer, dataName, context){

  console.log('retrieving', dataName)

  if (!(dataName in uploadDict)){
    return {error: 'DEAD_NOT_IMPL'}
  }

  try {
    const result = await uploadDict[dataName](fileBuffer, context);
    return {ok: 'DONE', data:result}
  } catch (er) {
    console.log(er);
    return {error: 'DEAD_PROC_ERROR'}
  }
}

module.exports = dataProc