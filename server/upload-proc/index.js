const SOFP = require('./sofp');
const JOURNAL = require('./journal');
const TRIAL_BALANCE = require('./trial-balance');
const BALANCE = require('./balance');
const ASSISTED = require('./assisted');
const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const CONFIRMATION_MANAGEMENT = require('./confirmation-management');
const CATEGORY_NAME_ALIASES = require('./category-name-aliases');
const CONFIRMATION_TEMPLATE = require('./confirmation-template');

const uploadDict = {
  SOFP,
  JOURNAL,
  TRIAL_BALANCE,
  BALANCE,
  ASSISTED,
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
    console.log(dataName, uploadDict[dataName])
    const result = await uploadDict[dataName](fileBuffer, context);
    return {ok: 'DONE', data:result}
  // } catch ({code}) {
  //   throw {code}
  // }
}

module.exports = dataProc