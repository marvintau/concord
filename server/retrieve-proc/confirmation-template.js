const {retrieveRecs} = require('../database');

async function get() {
  const data = await retrieveRecs({table:'CONFIRMATION_TEMPLATE'});
  return {data}
}

module.exports = get;