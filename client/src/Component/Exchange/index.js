import React, {useState, createContext} from 'react';
import Agnt from 'superagent';
import {add, get, del, set, trav, parse} from '@marvintau/chua';
import func from './funcs';

export const Exchange = createContext({
  Sheets: {},
  status: '',
  updateSheets: () => {},
  refreshSheet: () => {},
  evalSheet: () => {},

  getSuggs: () => {},
  addSiblyRec: () => {},
  addChildRec: () => {},
  remRec: () => {},
  setField: () => {},
  assignRecTo: () => {},

  pull: () => {},
  push: () => {},
  fetchURL: () => {}
})

const assignAllDescendants = (rec, key, value) => {
  if (rec.__children){
    trav(rec.__children, (rec) => {
      rec[key] && Object.assign(rec[key], value)
    })
  }
}

const evalAssignExpr = (expr, Sheets) => {

  let code = undefined;
  if (!expr){
    // do nothing
  } else if (expr.split(':').length !== 2){
    return {code: 'WARN_INVALID_REF_FORMAT'};
  } else {
    const [sheetName, pathString] = expr.split(':');
  
    if (Sheets[sheetName] === undefined){
  
      return {code: 'WARN_INVALID_REFERRED_TABLE'};
  
    } else {

      const {data, indexColumn} = Sheets[sheetName];
      const path = pathString.split('/');
      const {record} = get(data, {path, indexColumn});

      return record === undefined
      ? {code: 'WARN_NOT_FOUND_PATH'}
      : {code: 'SUCC', record}

    }
  }

  return code;
}

const assignRecToSheet = (rec, key, newExpr, Sheets) => {

  // 1. We analyzed the new expression and get the result, so set
  //    the current record immediately
  const {code, record:destRec} = evalAssignExpr(newExpr, Sheets);
  Object.assign(rec[key], {
    type: 'store-ref',
    expr: newExpr,
    result: newExpr ? 100 : undefined,
    code,
  });

  if (destRec !== undefined){
    if (destRec.__children.includes(rec)){
      console.log('REC EXISTING');
    }
    add(destRec.__children, rec);
  }

  // 2. Compare the new expression with old one. If the orginal
  //    expression is empty, and the new one is not, then do the
  //    assginAllDescendants as before.
  const isNewExprEmpty = !newExpr || newExpr.length === 0;

  if (!isNewExprEmpty){
    assignAllDescendants(rec, key, {result: 'UPPER', code, disabled: true});
  } else {
    assignAllDescendants(rec, key, {result: undefined, code: undefined, expr: newExpr, disabled: false});
  }

}

const assignAncestors = (rec, key) => {

  const {[key]:col, __children: subs} = rec;

  if ( col && subs ){

    // 由于后序遍历从叶子节点开始，我们首先遇到的节点是第一层含有categorized
    // 属性的节点，严格来说它们无法成为ancestor，因为它们子节点没有这个属性，
    // 所以直接跳过。对它的操作已经通过assignRecToSheet完成了。
    if (subs.every(({[key]:val}) => val === undefined)){
      return;
    }

    // 如果所有子层的result和code都是undefined，那么把它自己也赋值为
    // undefined。包含将原有的清空的操作。这也是唯一的可以解除disabled
    // 的方法。
    if (subs.every(({[key]:{result, code}}) => result === undefined && code === undefined)){
      Object.assign(rec[key], {
        result: undefined,
        code: undefined,
        disabled: undefined
      })
      return;
    }

    // 如果不满足以上条件，则意味着我们遇到了已经被分配的项目。已被分配的项目
    // 包含三种情况
    // 
    // 1. 它被分配是因为它的祖先节点被分配了
    // 2. 它就是刚刚被分配的节点
    // 3. 它是刚被分配节点的祖先节点
    // 
    // 而我们需要的仅是3. 能将3同1和2区分开的条件，是1和2的所有子节点的result
    // 都是'UPPER'，而3的子节点result只可能是数字或undefined

    if (subs.every(({[key]: {result}}) => result === undefined || (!isNaN(result) && result <= 100) )){

      let result = subs.reduce((acc, {[key]: {result}}) => {
        return acc + (result || 0)
      }, 0);
      
      let code = subs.every(({[key]: {code}}) => ['SUCC', undefined].includes(code))
      ? 'SUCC'
      : 'WARN_SUB_LEVEL';
  
      Object.assign(rec[key], {
        result: result / subs.length,
        code, 
        disabled: true
      });  
    }
  }

}

export const ExchangeProvider = ({defaultColumnAliases, children}) => {

  const [Sheets, setSheets] = useState({__COL_ALIASES:{...defaultColumnAliases}, __VARS:{}, __PATH_ALIASES: {}});
  const [status, setStatus] = useState('INIT');
  
  const updateSheets = (newSheets) => {
    console.log('add sheet called');
    setSheets({...newSheets, ...Sheets});
    setStatus('DONE_ADDED');
  }

  // When refreshing sheets, a new instance of sheet collection
  // is created, and a shallow copy of the specified sheet is 
  // made too.
  const refreshSheet = (sheetName) => {
    setSheets({...Sheets, [sheetName]: {...Sheets[sheetName]}});
  }

  const setField = (sheetName, path, fieldName, value) => {
    const {data, indexColumn} = Sheets[sheetName];
    const kvs = {[fieldName]: value};
    set(data, kvs, {path, indexColumn});
  }

  const addSiblyRec = (sheetName, path, newRec) => {
    
    const newPath = path.slice();
    const atIndex = newPath.pop();
    
    const {data, indexColumn} = Sheets[sheetName];
    add(data, newRec, {path:newPath, indexColumn, atIndex});
  }

  const addChildRec = (sheetName, path, newRec) => {
    const {data, indexColumn} = Sheets[sheetName];
    add(data, newRec, {path, indexColumn});
  }

  const remRec = (sheetName, path) => {
    const newPath = path.slice();
    const atIndex = newPath.pop();

    const {data, indexColumn} = Sheets[sheetName];
    console.log(newPath, indexColumn, 'del');
    del(data, {path: newPath, indexColumn, atIndex});
  }

  const assignRecTo = (rec, key, newExpr) => {
    assignRecToSheet(rec, key, newExpr, Sheets);
  }

  const initPathAliases = () => {
    if (Sheets.__PATH_ALIASES === undefined || Object.keys(Sheets.__PATH_ALIASES).length === 0){
      const categoryAliases = {};
      if (Sheets.CATEGORY_NAME_ALIASES) {
        const {data: aliasData} = Sheets.CATEGORY_NAME_ALIASES;
        
        for (let {alias} of aliasData){
          for (let name of alias){
            categoryAliases[name] = alias;
          }
        }
        
        Sheets.__PATH_ALIASES = categoryAliases;
      }
    }
  }

  const evalSheet = (sheetName) => {

    initPathAliases();
    const evalRecord = (rec) => {
      for (let key of Object.keys(rec)){
        const {expr, type} = rec[key];
        if (type) {

          if (type === 'fetch-ref'){
            if (expr !== undefined){
              const {result, code} = parse(expr.toString(), {func, tables: Sheets, self: rec});
              Object.assign(rec[key], {result, code});
            }
          }

          if (type === 'store-ref'){
            assignAncestors(rec, key);
          }

        } else if (expr !== undefined){
          console.warn('判断ref的标准已经变为"fetch-ref"，请重新上传数据')
          const {result, code} = parse(expr.toString(), {func, tables: Sheets, self: rec});
          Object.assign(rec[key], {result, code});
        }
      }  
    }

    trav(Sheets[sheetName].data, evalRecord, 'POST');
    refreshSheet(sheetName);
  }

  const getSuggs = (expr) => {
    const {suggs=[]} = parse(expr, {func, tables: Sheets});
    return suggs;
  }

  const fetchURL = async (url) => {
    const params = new URLSearchParams(url);
    const {sheet, ...rest} = Object.fromEntries(params.entries());

    if (sheet === undefined){
      setStatus('DEAD_FETCH_NO_SHEET_NAME');
      return;
    }

    try {
      console.log(rest, 'rest');
      const {body:{data}} = await Agnt.post(`/fetch/${sheet}`).send(rest);
      return data;
    } catch (error){
      console.log(error);
    }
  }

  const pull = (sheetNameList, currPage) => {
    console.log('pulling', sheetNameList);
    (async() => {
      setStatus('PULL');
      let pulledSheets = {};
      for (let sheetName of sheetNameList) if (Sheets[sheetName] === undefined){
  
        try{
          console.log('PULL: payload: ', currPage)
          const {body:{data, indexColumn, error}} = await Agnt.post(`/pull/${sheetName}`).send(currPage);
          if (error) {
            console.warn('remote error', error);
            setStatus(error);
            return;
          }

          pulledSheets[sheetName] = {data, indexColumn};

        } catch(error){
          console.warn('unknown error of pulling', error);
          setStatus('DEAD_LOAD');
          return
        }
      }
      updateSheets(pulledSheets);
      setStatus('DONE_PULL');
    })()
  }

  const push = (sheetName, {type, crit, rec, key, val, ...rem}) => {
    (async () => {
      setStatus('PUSH');
      try{
        const payload = ['ADD_REC', 'REM_REC'].includes(type)
        ? {type, rec}
        : type === 'UPDATE'
        ? {type, rec, key, val}
        : {type, data: Sheets[sheetName].data, ...rem}

        const response = await Agnt.post(`/push/${sheetName}`).send(payload);
        if (response.error){
          throw Error(response.error.message);
        }
        setStatus('DONE');
  
      } catch(e){
        console.error(e);
        setStatus('DEAD_LOAD');
      }
      setStatus('DONE_PUSH');
    })()
  }

  return <Exchange.Provider value={{
      Sheets, status, setStatus, updateSheets, refreshSheet, evalSheet,
      setField, addSiblyRec, addChildRec, remRec, assignRecTo, getSuggs,
      pull, push, fetchURL,
    }}>
    {children}
  </Exchange.Provider>
}