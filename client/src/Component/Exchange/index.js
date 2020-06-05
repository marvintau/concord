import React, {useState, createContext} from 'react'; 
import Agnt from 'superagent';
import {add, del, set, trav, parse} from '@marvintau/chua';
import func from './funcs';

import {assignAncestors, assignRecToSheet} from './assign-to';

export const Exchange = createContext({
  Sheets: {},
  status: '',
  updateSheets: () => {},
  refreshSheets: () => {},
  evalSheet: () => {},
  clearAllSheets: () => {},

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


export const ExchangeProvider = ({defaultColumnAliases, children}) => {

  const initialSheets = {
    __COL_ALIASES:{...defaultColumnAliases},
    __VARS:{},
    __PATH_ALIASES: {}
  }

  const [Sheets, setSheets] = useState(initialSheets);
  const [status, setStatus] = useState('INIT');
  
  const updateSheets = (newSheets) => {
    console.log('add sheet called');
    setSheets({...Sheets, ...newSheets});
    setStatus('DONE_ADDED');
  }

  const clearAllSheets = () => {
    setSheets(initialSheets);
  }

  // When refreshing sheets, a new instance of sheet collection
  // is created, and a shallow copy of the specified sheet is 
  // made too.
  const refreshSheets = () => {

    const newSheetColl = Object.fromEntries(Object.entries(Sheets).map(([k, v]) => {
      return [k, {...v}]
    }));

    setSheets(newSheetColl);
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
      for (let {name:sheetName} of sheetNameList) if (Sheets[sheetName] === undefined){
  
        try{
          console.log('PULL: payload: ', currPage)
          const {body:{data, indexColumn, error}} = await Agnt.post(`/pull/${sheetName}`).send(currPage);
          if (error) {
            console.warn('remote error', error);
            setStatus(error);
            return;
          }

          console.log('PULL: respond:', data);

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
      let pushedResult = {};
      try{
        const payload = ['ADD_REC', 'REM_REC'].includes(type)
        ? {type, rec}
        : type === 'UPDATE'
        ? {type, rec, key, val}
        : {type, data: Sheets[sheetName].data, ...rem}

        const {body: {data, indexColumn, error}} = await Agnt.post(`/push/${sheetName}`).send(payload);
        console.log(data, 'push return');
        if (error){
          console.warn('remote error', error);
          setStatus(error);
          return;
        }

        pushedResult[sheetName] = {data, indexColumn};

      } catch(e){
        console.error(e);
        setStatus('DEAD_LOAD');
      }

      updateSheets(pushedResult);
      setStatus('DONE_PUSH');
    })()
  }

  return <Exchange.Provider value={{
      Sheets, status, setStatus, updateSheets, refreshSheets, evalSheet, clearAllSheets,
      setField, addSiblyRec, addChildRec, remRec, assignRecTo, getSuggs,
      pull, push, fetchURL,
    }}>
    {children}
  </Exchange.Provider>
}