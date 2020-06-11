const {retrieveTable} = require('../database');
const {get, flat} = require('@marvintau/chua');

async function exportData(currArgs){

  const {project_id} = currArgs;

  const {data} = await retrieveTable({project_id, table:'PROJECT'}, 'ACCRUAL_ANALYSIS');

  let flattened = flat(data).filter(({analyzed}) => analyzed === undefined);

  flattened = flattened.map(({mc, md, dest_ccode_name, digest, __path}) => {

    const {list:self} = get(data, {path: __path, withList: true});
    console.log(self.length, 'self names')
    const names = self.map(({ccode_name}) => ccode_name.toString().trim()).join('/');
    let otherNames, oth, path;
    if (dest_ccode_name && dest_ccode_name.path){
      path = dest_ccode_name.path;
      oth = get(data, {path, withList: true}).list;
      console.log(oth.length, 'oth names')
      try {
        otherNames = oth.map(({ccode_name}) => ccode_name.toString().trim()).join('/');
      } catch {
        console.log(oth, 'error oth');
      }
    } else {
      otherNames = '';
    }

    return {
      科目名称: names, 
      借方发生: mc, 
      贷方发生: md, 
      对方科目: otherNames,
      摘要: digest || '',
    }
  })

  return flattened;
}

module.exports = exportData;