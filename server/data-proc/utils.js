function sort(table, key){

  const val = typeof key === 'string'
  ? (rec) => rec[key]
  : (rec) => key(rec)

  return table.sort((a, b) => {
    const val_a = val(a), val_b = val(b);
    return val_a < val_b ? -1 : val_a > val_b ? 1 : 0
  })
}

function group(table, key){

  let group = {};

  const labelFunc = key.constructor === Function
  ? (rec) => key(rec) 
  : (rec) => rec[key]

  for (let i = 0; i < table.length; i++){
    const rec = table[i];
    const label = labelFunc(rec);

    !(label in group) && (group[label] = []);
    group[label].push(rec);
  }
  console.log()
  return group;
}

function cascade(table, colKey) {

  // grip使用了layerFunc，将列表分为几代（Generation）
  const sorted = sort(table, colKey);
  const layers = Object.values(group(sorted, (rec) => rec[colKey].length));

  console.log(layers.map(e => e[0][colKey].length), 'cascade');

  // 每相邻的两代之间两两比较，如果没有找到父辈的孩子会被弃掉。
  let children;
  for (children = layers.pop(); layers.length > 0; children = layers.pop()) {
    let parents = layers.pop();

    // 如果记录没有children这个属性则清空
    for (let i = 0; i < parents.length; i++){
      parents[i].children = [];
    }
    
    // 在两代中间进行匹配
    while (children.length > 0) {
      let child = children.pop();
      for (let i = 0; i < parents.length; i++){
        let parent = parents[i];
          
        if (child[colKey].startsWith(parent[colKey])) try {
          parent.children.push(child)
        }catch{
          console.log(parent);
          throw Error('found')
        }
      }
    }
    layers.push(parents);
  }
  // 返回祖先一代。
  return children;
}

module.exports = {
  sort,
  group,
  cascade
}