
function sumStatus(children, key='ref'){
  return children.some(({[key]:{status}}) => status !== 'NORM') ? 'WARN' : 'NORM';
}

function sumResult(children, key='ref'){
  const result = children
    .filter(({[key]:{status, result}}) => ['NORM', 'WARN'].includes(status) ? result : 0)
    .reduce((acc, {[key]:{result}}) => acc+result, 0);
  
    return parseFloat(result.toFixed(2));
}

export default {
  NONE(rec, key='ref'){
    Object.assign(rec[key], {result: undefined, status: 'NONE'})
  },
  SUMSUB(rec, key='ref'){
    const {children} = rec;

    if(children === undefined){
      Object.assign(rec[key], {status: 'NORM', result: 0});
      return;
    }
    Object.assign(rec[key], {
      status: sumStatus(children, key),
      result: sumResult(children, key)
    });
  },
  SUB1(rec){
    if (rec.children && rec.children.length > 0){
      const child = rec.children[0];
      Object.assign(rec.ref, child.ref);
    }
    Object.assign(rec.ref, {result: 0, status: 'WARN'});
  }
};
