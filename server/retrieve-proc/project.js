const {retrieveRecs} = require('../database');

async function e() {
  const orig = await retrieveRecs({table: 'PROJECT'});

  const data = orig.map(({data, ...rest}) => rest);

  data.sort(({date:dateA}, {date:dateB}) => {
    return dateB - dateA;
  })

  console.log(data)
  return {data};
}

module.exports = e;