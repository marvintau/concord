const ACCRUAL_ANALYSIS = require('./accrual-analysis');
const BALANCE = require('./balance');
const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const CONFIRMATION_MANAGEMENT = require('./confirmation-management');
const CATEGORY_NAME_ALIASES = require('./category-name-aliases');
const CONFIRMATION_TEMPLATE = require('./confirmation-template');

const uploadDict = {
  ACCRUAL_ANALYSIS,
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
    throw {code: 'DEAD_NOT_IMPL'}
  }

  // try {
    const result = await uploadDict[dataName](fileBuffer, context);
    return {ok: 'DONE', data:result}
  // } catch ({code}) {
  //   throw {code}
  // }
}

module.exports = dataProc