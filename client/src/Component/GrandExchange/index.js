import React, {useState, createContext} from 'react';
import Agnt from 'superagent';
import {evalTable} from './evals';

const outer = (listOfLists) => {

  if (listOfLists.some(elem => !Array.isArray(elem))){
    throw Error('outer必须得用在list of lists上')
  }

  if (listOfLists.length === 0){
    return [];
  }

  let [first, ...rest] = listOfLists,
    res = first.map(e => [e]);

  for (let list of rest){
    res = res.map(e => list.map(l => e.concat(l))).flat();
  }

  return res;
}

const dupRec = (rec, init=true) => {
  let {__children, __path, ...newRec} = rec;
  newRec = JSON.parse(JSON.stringify(newRec));
  
  if (init){
    for (let key in newRec) switch (typeof key){
      case 'number':
        newRec[key] = 0; break;
      case 'string':
        newRec[key] = ""; break;
      case 'undefined':
        newRec[key] = ''; break;
      default:
        newRec[key] = {}; break;
    }
  }

  return newRec;
}

const resetPath = (list, currPath=[]) => {
  for (let [index, rec] of list.entries()){
    const nextPath = [...currPath, index];
    rec.__path = nextPath;
    if(rec.__children !== undefined){
      resetPath(rec.__children, nextPath);
    }
  }
}

export const GrandExchangeContext = createContext({
  Sheets: {},
  status: '',
  addSheets: () => {},
  refreshSheet: () => {},
  evalSheet: () => {},

  getChildren: () => {},

  addRec: () => {},
  addChild: () => {},
  remRec: () => {},
  getRec: () => {},
  setField: () => {},

  pull: () => {},
  push: () => {},
  fetchURL: () => {}
})

export const GrandExchange = ({children}) => {

  const aliases = {借方: 'md', 贷方: 'mc', 期初: 'mb', 期末:'me'}

  const [Sheets, setSheets] = useState({__COL_ALIASES:{...aliases}, __VARS:{}, __PATH_ALIASES: {}});
  const [status, setStatus] = useState('INIT');
  
  const addSheets = (newSheets) => {
    setSheets({...Sheets, ...newSheets});
  }

  // When refreshing sheets, a new instance of sheet collection
  // is created, and a shallow copy of the specified sheet is 
  // made too.
  const refreshSheet = (sheetName) => {
    setSheets({...Sheets, [sheetName]: {...Sheets[sheetName]}});
  }

  // Find specific record on a recursive data sheet.
  const getSingleRec = (sheetName, path) => {
    console.log(sheetName, 'get single');
    let {data:list, pathColumn} = Sheets[sheetName], rec;
    for (let i = 0; i < path.length; i++){

      rec = (path.every(e => typeof e === 'number')) 
      ? list[path[i]]
      : list.find(({[pathColumn]:col}) => col === path[i])

      if ((rec === undefined) || (i === path.length - 1)) break;

      list = rec.__children;
    }
    return {rec, list};
  }

  const getRec = (sheetName, path) => {

    const {__PATH_ALIASES:aliases} = Sheets;

    if (path === undefined || path.length === 0){
      const {data} = Sheets[sheetName];
      return {rec:undefined, list:data, path:undefined};
    }

    const candidatePaths = outer(path.map(seg => (seg in aliases) ? aliases[seg] : [seg] ));

    for (let candiPath of candidatePaths){
      const {rec, list} = getSingleRec(sheetName, candiPath);
      if (rec !== undefined){
        return {rec, list, path:candiPath}
      }
    }

    return {rec: undefined, list:[], path: undefined}

  }

  const getChildren = (sheetName, path) => {
    const {pathColumn, data} = Sheets[sheetName];
    const {rec} = getRec(sheetName, path);
    if (path.length === 0){
      console.log('here')
      return data.map(({[pathColumn]:pathCol}) => pathCol);
    } else if (rec !== undefined){
      return rec.__children.map(({[pathColumn]:pathCol}) => pathCol);
    } else {
      return [];
    }
  }

  const setField = (sheetName, path, fieldName, value) => {
    const {rec} = getRec(sheetName, path);
    if (rec !== undefined){
      if (typeof rec[fieldName] === 'object'){
        Object.assign(rec[fieldName], value)
      } else {
        rec[fieldName] = value;
      }
    }
  }

  const evalSheet = (sheetName) => {
    evalTable(Sheets[sheetName].data, Sheets.__VARS, Sheets.__COL_ALIASES, getRec);
    refreshSheet(sheetName);
  }

  const addRec = (sheetName, path, newRec) => {

    const {list, rec} = getRec(sheetName, path);

    if (path.length === 0){
      list.unshift(newRec);
      resetPath(list, []);
    } else {
      const index = path.pop();
      const insertRec = newRec === undefined ? dupRec(rec) : newRec;
      list.splice(index, 0, insertRec);
      resetPath(list, path);
    }
  }
  
  const remRec = (sheetName, path) => {

    if (path === undefined || path.length === 0){
      return;      
    }

    const {list} = getRec(sheetName, path);
    const index = path.slice(-1)[0];
    list.splice(index, 1);

    resetPath(list);
  }

  const addChild = (sheetName, path) => {
    const {rec} = getRec(sheetName, path);
    if (rec.__children === undefined || rec.__children.length === 0){
      let newRec = dupRec(rec);
      newRec.__path = [...path, 0]
      rec.__children = [newRec];
    }
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

  const pull = (sheetNameList, currPage, forceUpdate=false) => {
    console.log(sheetNameList, 'pull');
    (async() => {
      setStatus('PULL');
      let pulledSheets = {};
      for (let sheetName of sheetNameList){
  
        try{
          const {body:{data, pathColumn, error}} = await Agnt.post(`/pull/${sheetName}`).send(currPage);
          if (error) {
            setStatus(error);
            return;
          }

          pulledSheets[sheetName] = {data, pathColumn};
        } catch(e){
          console.error(e);
          setStatus('DEAD_LOAD');
          return
        }
      }
      addSheets(pulledSheets);
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

  return <GrandExchangeContext.Provider value={{
      Sheets, status, addSheets, refreshSheet, evalSheet, getChildren,
      getRec, setField, addRec, addChild, remRec,
      pull, push, fetchURL,
    }}>
    {children}
  </GrandExchangeContext.Provider>
}