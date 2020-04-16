const {retrieveRecs} = require('../database');

async function e() {
  const data = await retrieveRecs({table: 'PROJECT'});
  data.sort(({date:dateA}, {date:dateB}) => {
    return dateB - dateA;
  })
  console.log(data);
  return {data};
}

module.exports = e;