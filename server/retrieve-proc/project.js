const {retrieve} = require('../database');

async function e(context) {
  const data = await retrieve('table', 'PROJECT');
  return {data};
}

module.exports = e;