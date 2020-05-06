
const BALANCE = require('./balance');
const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const CONFIRMATION_MANAGEMENT = require('./confirmation-management');
const CATEGORY_NAME_ALIASES = require('./category-name-aliases');
const CONFIRMATION_TEMPLATE = require('./confirmation-template');

const uploadDict = {
  BALANCE,
  CASHFLOW_WORKSHEET,
  CONFIRMATION_MANAGEMENT,
  CATEGORY_NAME_ALIASES,
  CONFIRMATION_TEMPLATE
}

async function dataProc(fileBuffer, dataName, context){

  console.log('retrieving', dataName)

  if (!(dataName in uploadDict)){
    console.error(`Upload handler not implemented. Did nothing.`)
    return {error: 'DEAD_NOT_IMPL'}
  }

  try {
    const result = await uploadDict[dataName](fileBuffer, context);
    return {ok: 'DONE', data:result}
  } catch (er) {
    console.log(er);
    console.error('The error above comes from the upload handler');
    return {error: 'DEAD_PROC_ERROR'}
  }
}

module.exports = dataProc