const parse = ([first, ...restTable], {delim="#", col='ref', children='__children', path='__path'}={}) => {

  const cascadedTable = [];
  const stack = [{[col]:first, [children]:[], [path]:[0]}];
  
  const count = (str) =>
    str.split(delim).length - 1;

  const top = () =>
    stack[stack.length - 1];
  
  const push = (rec) =>{
    (stack.length === 0) && (rec[path] = [cascadedTable.length]);
    stack.push(rec);
  }
  
  const add = (rec) =>{
    const stackTop = top();
    (stackTop[children] === undefined) && (stackTop[children] = []);
    rec[path] = stackTop[path].concat(stackTop[children].length);
    stackTop[children].push(rec);
  }

  const pop = (recLevel) => {
    let popped;
    while (stack.length > 0 && count(top()[col]) >= recLevel) {
      popped = stack.pop()
    };
    return popped;
  }

  if (count(top()[col]) !== 1){
    throw Error('parseTable: 表的第一行记录必须得是一级标题');
  }

  for (let rec of restTable){

    const wrapRec = {[col]: rec};

    const currLevel = count(wrapRec[col]);
    if (currLevel === 0){
      add(wrapRec);
    } else {
      const popped = pop(currLevel);
      (stack.length > 0) ? add(wrapRec) : cascadedTable.push(popped);
      push(wrapRec);
    }
  }
  
  return cascadedTable;
}

module.exports = parse;