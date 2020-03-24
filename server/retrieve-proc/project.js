const {retrieveRecs} = require('../database');

async function e() {
  const data = await retrieveRecs({table: 'PROJECT'});
  return {data};
}

module.exports = e;