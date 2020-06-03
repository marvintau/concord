const {remove, createRecs} = require('../database');

// 注：
// 将所有的条目删除，同时从前端返回所有条目不是一个好方法，原因有二
// 1. 大部分的条目没有改变
// 2. 当数据量增大时，会导致 "413 Request Entity Too Large error"错误

// 如果发生了问题，考虑改动这部分请求。

const update = async ({data}) => {
  console.log(data, 'update, equiv names');
  await remove({table: 'CATEGORY_NAME_ALIASES'});
  
  const newData = [];
  for (let {alias} of data){
    newData.push({alias});
  }
  
  await createRecs('CATEGORY_NAME_ALIASES', newData);

  const result = await retrieveRecs({table: 'CATEGORY_NAME_ALIASES'});

  return {data: result};
}

module.exports = update