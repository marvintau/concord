import React, {useState, useEffect, createContext, useContext} from 'react';
import {DepRouterContext} from '../DepRouter';
import parseArith from '@marvintau/arith-expr';
import Agnt from 'superagent';

const parseExpr = (expr, aliases) => {
  try {
    const result = parseArith(expr, aliases);
    return {result};
  } catch ({message}){
    return message.includes('identifier')
    ? {result: 0, code: 'EXPR_IDENT'}
    : {result: 0, code: 'EXPR_ILLEG'}
  }
}

const removeObserverFromDest = (rec, field) => {
	if (rec[field].isRef){
	  let observers = rec[field].destRec.__observers;
    let obsIndex = observers.findIndex(({rec:obsRec}) => obsRec === rec);
	  observers.splice(obsIndex, 1);
	}
}

const registerObserverToDest = (destRec, rec, field, aliases) => {
  (!destRec.__observers) && (destRec.__observers = []);
  destRec.__observers.push({rec, field, aliases});
}


export const GrandExchangeContext = createContext({
  Sheets: {},
  status: '',
  addSheets: () => {},
  refreshSheet: () => {},
  evalSheet: () => {},

  addRec: () => {},
  remRec: () => {},
  getRec: () => {},
  setRec: () => {},

  pull: () => {},
  push: () => {}

})

export const GrandExchange = ({children}) => {

  const [Sheets, setSheets] = useState({__COL_ALIASES:{}, __VARS:{}, __PATH_ALIASES: {}});
  const [status, setStatus] = useState('INIT');

  const getVars = (rec) => {

    const {__VARS:vars, __COL_ALIASES:alias} = Sheets;
    const aliasCopy = {...alias};

    if (rec) {
      const {__children, __observers, ...recRest} = rec;
    
      for (let [k, {result}] of Object.entries(recRest)){
        if (result !== undefined){
          recRest[k] = result;
        }
      }
    
      for (let [k, v] of Object.entries(aliasCopy)){
        aliasCopy[k] = recRest[v];
      }
    
      return {...vars, ...recRest, ...aliasCopy};
    } else {
      return vars;
    }

  }
  
  const addSheets = (newSheets) => {
    setSheets({...Sheets, ...newSheets});
  }

  // When refreshing sheets, a new instance of sheet collection
  // is created, and a shallow copy of the specified sheet is 
  // made too.
  const refreshSheet = (sheetName) => {
    setSheets({...Sheets, [sheetName]: [...Sheets[sheetName]]});
  }

// Find specific record on a recursive data sheet.
  const getRec = (sheetName, path) => {
    
    let {data:list, pathColumn} = Sheets[sheetName], rec;
    for (let i = 0; i < path.length; i++){

      rec = (path.all(e => typeof e === 'number')) 
      ? list[path[i]]
      : list.find(({[pathColumn]:col}) => col === path[i])

      if ((rec === undefined) || (i === path.length - 1)) break;

      list = rec.__children;
    }
    return {rec, list};
  }

  const parseRef = (incomingValue) => {
  
    const expr = incomingValue.toString()
    if (expr.includes && expr.includes(':')){
  
      const splitted = expr.split(':');
      if (splitted.length < 3){
        return {isRef:true, result: 0, code: 'WARN_ILLIGAL_REF'}
      }
  
      const [sheetName, path, expr] = splitted;
      const {rec} = getRec(sheetName, path.split('/'));
      if (rec === undefined){
        return {isRef: true, result: 0, code: 'WARN_UNDEF_REC'}
      }
  
      const {result, code} = parseExpr(expr, getVars(rec));
      return {isRef: true, destRec: rec, result, code};
  
    } else {
      const {result, code} = parseArith(expr, getVars());
      return {isRef: false, result, code};
    }
  }
  
  const setRec = (rec, fieldName, expr, item) => {
  
    const {result, destRec, isRef} = parseRef(expr);
  
    const {expr:currExpr} = rec[fieldName];
    if (currExpr){
      (expr === currExpr)  && (rec[fieldName].result = result);
      (item !== undefined) && (rec[fieldName].item = item);
    } else if (isRef){
      rec[fieldName] = { item, expr, result, destRec}
      registerObserverToDest(destRec, rec, fieldName);
    } else {
      removeObserverFromDest(rec, fieldName);
      rec[fieldName] = result;
    }
  
    if (rec.__observers) {
      for (let {rec:obsRec, field: obsField} of rec.__observers){
  
        const {expr:obsExpr} = obsRec[obsField];
        setRec(obsRec, obsField, obsExpr);
      }
    }
  }

  const evalList = (table=[]) => {
    for (let rec of table){
      for (let key in rec) if (!key.startsWith('__')) {
        setRec(rec, key, rec[key]);
      }
      if (rec.__children){
        evalList(rec.__children);
      }
    }
  }  

  const addRec = (sheetName, path, newRec={}) => {
    const {list} = getRec(sheetName, path);
    const index = path.slice(-1)[0];
    list.splice(index, 0, newRec);
  }
  
  const remRec = (sheetName, path) => {
    const {list} = getRec(sheetName, path);
    const index = path.slice(-1)[0];
    list.splice(index, 1);
  }

  const pull = (sheetNameList, currPage) => {
    (async() => {
      setStatus('PULL');
      let pulledSheets = {};
      for (let sheetName of sheetNameList){
        if (sheetName in Sheets){
          continue;
        }
  
        try{
          const {body:{data, pathColumn, error}} = await Agnt.post(`/pull/${sheetName}`).send(currPage);
          
          if (error) {
            setStatus(error);
            return;
          }

          pulledSheets[sheetName] = {data, pathColumn};
        } catch(e){
          setStatus('DEAD_LOAD');
        }
      }
      addSheets(pulledSheets);
      setStatus('DONE_PULL');
    })()
  }

  const push = async () => {
    setStatus('PUSH');
    // try{
    //   const response = await Agnt.post(`/push/${sheetName}`).send(data);
    //   if (response.error){
    //     throw Error(response.error.message);
    //   }
    //   setStatus('DONE');

    // } catch(e){
    //   console.error(e);
    //   setStatus('DEAD_LOAD');
    // }
    setStatus('DONE_PUSH');
  }

  return <GrandExchangeContext.Provider value={{
      Sheets, status, addSheets, refreshSheet,
      getRec, setRec, addRec, remRec,
      pull, push
    }}>
    {children}
  </GrandExchangeContext.Provider>
}