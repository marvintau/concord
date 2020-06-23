const {retrieve} = require('../database');

async function e() {
  const orig = await retrieve({table: 'PROJECT'});

  const data = orig.map(({data, ...rest}) => rest);

  data.sort(({date:dateA}, {date:dateB}) => {
    return dateB - dateA;
  })

  return {data};
}

module.exports = e;