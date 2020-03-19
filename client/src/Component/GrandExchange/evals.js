import evalArithExpr from '@marvintau/arith-expr';
import Func from './funcs';

const evalExpr = (expr, aliases) => {
  try {
    const result = evalArithExpr(expr, aliases);
    return {result, code: 'NORM'};
  } catch ({message}){
    return message.includes('identifier')
    ? {result: expr, code: 'EXPR_IDENT'}
    : {result: expr, code: 'EXPR_ILLEG'}
  }
}

const evalFunc = (currRec, fieldName, expr) => {
  Object.assign(currRec[fieldName], Func[expr](currRec, fieldName));
}

const prepVars = (rec, vars, alias) => {

  const aliasCopy = {...alias};

  if (rec) {
    const {__children, __observers, ...recRest} = rec;
  
    for (let [k, {result}] of Object.entries(recRest)) if (result !== undefined){
      recRest[k] = result;
    }
  
    for (let [k, v] of Object.entries(aliasCopy)){
      aliasCopy[k] = recRest[v];
    }
  
    return {...vars, ...recRest, ...aliasCopy};
  } else {
    return vars;
  }

}

const evalDest = (currRec, fieldName, dest, vars, aliases, getDestRec) => {
  
  if (dest.includes(':')){
    console.log(dest);
    const splitted = dest.split(':');
    if (splitted.length < 3){
      Object.assign(currRec[fieldName], {result: 0, code: 'WARN_ILLIGAL_REF_FORMAT'});
    }

    const [sheetName, pathString, expr] = splitted;
    const {rec} = getDestRec(sheetName, pathString.split('/'));
    if (rec === undefined){
      Object.assign(currRec[fieldName], {result: 0, code: 'WARN_UNDEF_REC'});
    } else {
      Object.assign(currRec[fieldName], evalExpr(expr, prepVars(rec, vars, aliases)))
    }
  } else {
    Object.assign(currRec[fieldName], evalExpr(dest, vars));
  }
}

const evalField = (currRec, fieldName, vars, aliases, getDestRec) => {

  const {expr} = currRec[fieldName];

  if (typeof expr !== 'string')
    return;

  let varName, rest;
  if(expr.includes('@') && expr.split('@').length === 2){
    [varName, rest] = expr.split('@');
  } else {
    rest = expr;
  }

  if (rest in Func){
    evalFunc(currRec, fieldName, rest);
  } else {
    evalDest(currRec, fieldName, rest, vars, aliases, getDestRec);
  }

  if (varName){
    let {code, result} = currRec[fieldName];
    vars[varName] = result;
  }
}

export const evalTable = (table, vars, aliases, getDestRec) => {
  for (let rec of table) {
    if (Array.isArray(rec.__children) && rec.__children.length > 0){
      evalTable(rec.__children, vars, aliases, getDestRec);
    }
    for (let key of Object.keys(rec)) if (!key.startsWith('__') && key !== 'table'){
      evalField(rec, key, vars, aliases, getDestRec);
    }
  }
}