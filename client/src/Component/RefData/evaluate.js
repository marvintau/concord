const msg = {
  unsupp: '不支持的表达式，或者引用的数字并不存在',
  unrecog: '未识别',
  notfoundref: '未能按路径找到引用的记录'
}

const traverse = (refs, func, order='POST', ...args) => {
  for (let record of refs){
    order === 'PREV' && func(record, ...args);
    record.children  && traverse(record.children, func, order, ...args);
    order === 'POST' && func(record, ...args);
  }
}  

export default (refTable, pathColumn, evalDict, dataTable, varTable, funcTable) => {
  traverse(refTable, evalSingle, 'POST', pathColumn, evalDict, dataTable, varTable, funcTable)
  return [...refTable];
}

// For every refRecord, we need the record itself, and
// the two tables, variable table, and function table.
const evalSingle = (rec, pathColumn, evalDict, dataTable, varTable, funcTable) => {
  let {item, expr} = rec.ref;
  let varName;

  // Found an expression prefixed with a variable bind. In
  // this case we will alter the expr with the latter part.
  if(expr.includes('@') && expr.split('@').length === 2){
    [varName, expr] = expr.split('@');
  }

  // the actual evaluation is left to evalExpr. Save the
  // result into refRecord Note this is an inplace operation
  // that writes the result into rec.
  // console.log('before eval expr', expr, rec);
  // console.log(expr, 'original');
  evalExpr(expr, rec, pathColumn, evalDict, dataTable, varTable, funcTable);

  // if a binding is detected, then insert it into varTable.
  // if the result is problematic, then the binded variable
  // will be set 0.
  if (varName){
    varTable[varName] = rec.status === 'NORM' ? rec.result : 0;
  }
}

const evalExpr = (expr, rec, pathColumn, evalDict, dataTable, varTable, funcTable) => {
  
  // if found expr a function name, then pass the rec and varTable
  // into it. It doesn't support complex operation with dataTable
  // yet. 
  if (expr in funcTable){
    funcTable[expr](rec)

  // or, check if the expression conforms to a reference
  } else if (expr.startsWith('/') && expr.includes(':') && expr.split(':').length === 2){
    let path;
    [path, expr] = expr.split(':');
    let dataRecs = evalPath(path, pathColumn, dataTable);
    evalArithExpr(expr, rec, evalDict, varTable, dataRecs);

  // otherwise, it falls back to a general arithmetic expression.
  } else {
    evalArithExpr(expr, rec, evalDict, varTable);
    // console.log(rec.ref)
  }
}

const evalSinglePath = (pathSegs, pathColumn, dataTable) => {

  let list = dataTable, ref;
  for (let seg of pathSegs) {
    ref = list.find(({[pathColumn]: pathCol}) => pathCol === seg);
    if (ref === undefined) break;
    list = ref.children;
  }
  return ref;

}

const outer = (listOfLists) => {

  if (listOfLists.some(elem => !Array.isArray(elem))){
      throw Error('outer必须得用在list of lists上')
  }

  // wrap the innermost level with list. note that the
  // value inside first should be a string in our use
  // case.
  let [first, ...rest] = listOfLists,
      res = first.map(e => [e]);

  // for every element from list, make it a list that
  // every existing list of res concat with it.
  for (let list of rest){
      res = res.map(e => list.map(l => e.concat(l))).flat();
  }

  return res;
}

const evalPath = (pathString, pathColumn, dataTable) => {
  
  const pathSegs = pathString.split('/').slice(1);
  
  return outer(pathSegs.map(e => e.split('&')))
    .map(segs => ({
      dataRec: evalSinglePath(segs, pathColumn, dataTable),
      path: segs
    }))
}

const evalArithExpr = (expr, rec, evalDict, table, dataRecs) => {
  
  // remove all whitespace chars;
  expr = expr.replace(/[\s$]*/g, '');
  // console.log(expr, evalDict)

  // handle if there is a equal operator
  if(expr.includes('===') && expr.split('===').length === 2){
    console.log('eq');

  // in this case we are handling a plain expression without
  // reference
  } else if (dataRecs === undefined){
    Object.assign(rec.ref, evalSingleArithExpr(expr, evalDict, table));

  // otherwise, we are handling a set of path which refers to the
  // data table, and we will process them respectively. Finally,
  // we will add the results up, and update the overall status.
  } else {
    const summedResult = dataRecs
      .map(({dataRec, path}) => {
        const evalResult = evalSingleArithExpr(expr, evalDict, table, dataRec)
        return {...evalResult, undefPath: dataRec === undefined ? [path] : []}
      })
      .reduce(({result:resultAcc, status:statusAcc, undefPath:undefPathAcc}, {result, status, undefVar, undefPath}) => ({
        result: resultAcc + result,
        status: statusAcc !== 'NORM' ? statusAcc : status,
        undefPath: undefPathAcc.concat(undefPath),
        undefVar,
      }), {result: 0, status: 'NORM', undefPath: []});
    // console.log(summedResult, 'summed');
    Object.assign(rec.ref, summedResult);
  }
}

const evalSingleArithExpr = (expr, evalDict, varTable, dataRec={}) => {
  const {expr: newExpr, undefVar} = prepareExpr(expr, evalDict, varTable, dataRec);
  return evalSingleArithExprResult(newExpr, undefVar);
}

const prepareExpr = (expr, evalDict, varTable, dataRec) => {
  let varList = expr.split(/[()*/+-]+/).filter(e => e.length > 0);
  const undefVar = [];
  for (let variable of varList){
    if(!isNaN(variable)){
      continue;
    }
    if(variable in varTable){
      expr = expr.replace(variable, `(${varTable[variable]})`);
    } else if (evalDict[variable] in dataRec){
      expr = expr.replace(variable, `(${dataRec[evalDict[variable]]})`);
    } else {
      expr = expr.replace(variable, '(0)');
      undefVar.push(variable);
    }
  }
  return {expr, undefVar}
}

const evalSingleArithExprResult = (expr, undefVar) => {
  try{
    let result = eval(expr);
    if(!isNaN(result)){
      result = parseFloat(result.toFixed(2))
    }
    let res = {result, status: 'NORM'};
    if (undefVar.length > 0){
      res = {...res, status: 'WARN', undefVar}
    }
    return res;
  } catch {
    return {result: 'ERROR', status: 'DEAD'};
  }
}