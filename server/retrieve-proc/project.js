const {retrieve} = require('../database');

async function e(context) {
  const data = await retrieve('table', 'Project');
  return {data};
}

module.exports = e;