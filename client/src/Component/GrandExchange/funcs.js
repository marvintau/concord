
function sumCode(children, fieldName='ref'){
  return children.some(({[fieldName]:{code}}) => code !== 'NORM') ? 'WARN' : 'NORM';
}

function sumResult(children, fieldName='ref'){
  const result = children
    .filter(({[fieldName]:{code, result}}) => ['NORM', 'WARN'].includes(code) ? result : 0)
    .reduce((acc, {[fieldName]:{result}}) => acc+result, 0);
  
    return parseFloat(result.toFixed(2));
}

export default {
  NONE(){
    return {result: undefined, code: 'NONE'}
  },

  SUMSUB(rec, fieldName='ref'){
    const {__children} = rec;

    if(__children === undefined){
      return {code: 'NORM', result: 0};
    }

    return {
      code: sumCode(__children, fieldName),
      result: sumResult(__children, fieldName)
    };
  },
  SUB1(rec, fieldName='ref'){
    if (rec.__children && rec.__children.length > 0){
      const {result, code} = rec.__children[0][fieldName];
      return {result, code};
    } else {
      return {result: 0, code: 'WARN'};
    }
  }
};
