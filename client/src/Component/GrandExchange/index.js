import React, {useState, createContext} from 'react';
import Agnt from 'superagent';
import {evalTable} from './evals';

const outer = (listOfLists) => {

  if (listOfLists.some(elem => !Array.isArray(elem))){
    throw Error('outer必须得用在list of lists上')
  }

  let [first, ...rest] = listOfLists,
    res = first.map(e => [e]);

  for (let list of rest){
    res = res.map(e => list.map(l => e.concat(l))).flat();
  }

  return res;
}

export const GrandExchangeContext = createContext({
  Sheets: {},
  status: '',
  addSheets: () => {},
  refreshSheet: () => {},
  evalSheet: () => {},

  getChildren: () => {},

  addRec: () => {},
  remRec: () => {},
  getRec: () => {},
  setField: () => {},

  pull: () => {},
  push: () => {}

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
    const {pathColumn} = Sheets[sheetName];
    const {rec} = getRec(sheetName, path);

    if (rec !== undefined){
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
    console.log(sheetNameList, 'pull');
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

          // evalList(data);
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
      Sheets, status, addSheets, refreshSheet, evalSheet, getChildren,
      getRec, setField, addRec, remRec,
      pull, push
    }}>
    {children}
  </GrandExchangeContext.Provider>
}