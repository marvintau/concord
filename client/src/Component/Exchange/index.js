import React, {useState, createContext} from 'react'; 
import Agnt from 'superagent';
import {add, del, set, trav, expr as evalExpr, fetch as fetchRec, flat} from '@marvintau/chua';

export const Exchange = createContext({
  Sheets: {},
  status: '',
  updateSheets: () => {},
  refreshSheet: () => {},
  evalSheet: () => {},
  clearAllSheets: () => {},

  getPathSuggs: () => {},
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
  const refreshSheets = (sheetName) => {
    if (sheetName !== undefined){
      setSheets({...Sheets, [sheetName]: {...Sheets[sheetName]}});
    }
    setSheets({...Sheets});
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
    trav(data);
  }

  const addChildRec = (sheetName, path, newRec) => {
    const {data, indexColumn} = Sheets[sheetName];
    add(data, newRec, {path, indexColumn});
    trav(data);
  }

  const remRec = (sheetName, path) => {
    const newPath = path.slice();
    const atIndex = newPath.pop();

    const {data, indexColumn} = Sheets[sheetName];
    console.log(newPath, indexColumn, 'del');
    del(data, {path: newPath, indexColumn, atIndex});
    trav(data);
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

  const evalSheet = (sheetName, colName) => {
    initPathAliases();
    const evalRecord = (rec) => {
      
      const evalCol = (col, colName) => {
        if (col === undefined || col === null){
          return;
        }        
        if (col.type) {
        
          const {type, path, expr, cases} = col;
          if (type === 'ref-fetch'){
  
            if (expr.startsWith('=')){
              const {result, code} = evalExpr(expr, {Sheets, vars:rec, colKey:colName});
              Object.assign(col, {result, code});
            } else {
              const {record} = fetchRec(path, Sheets);
              const {result, code} = evalExpr(expr, {Sheets, vars:record});
              Object.assign(col, {result, code});
            }
            // console.log(result, code);
          }
  
          if (['ref-store', 'ref-cond-store'].includes(type)){
            const {__assigned_ances, __assigned_desc, __children, __dest_map, __cands, __apply_spec} = rec;
            if (__dest_map && __dest_map.size > 0) {
              // 说明是执行evalSheet前刚刚被分配的那个记录
              Object.assign(col, {
                result: '已分配',
                code:'SUCC'
              })
            } else if (__assigned_desc && __assigned_desc.length > 0) {           

              const result = `${__assigned_desc.length}/${__children.length} 已分配`
              const code = __assigned_desc.length === __children.length ? 'SUCC' : 'WARN';

              Object.assign(col, { result, code, disabled: !__apply_spec})

            } else if (__assigned_ances && __assigned_ances.length > 0) {
              Object.assign(col, {
                result: '⇧已分配',
                code: 'INFO',
                disabled: true
              })
              // if(rec.__detailed_level) console.log(rec, col);
            } else if (__dest_map === undefined || __dest_map.size === 0) {
  
              const refStoreAndPath = type === 'ref-store' && (path && path.length > 0);
              const refCondStoreAndAnyPath = type === 'ref-cond-store' && cases.some(path => path && path.length > 0);
  
              if (__cands !== undefined) {

                const code = col.code || (__cands.length > 1 ? 'FAIL_MUL_ASSIGN_COND' : 'FAIL_NO_ASSIGN_COND');
                Object.assign(col, { code, result : '未分配'})
  
              } else if (refStoreAndPath || refCondStoreAndAnyPath) {
                Object.assign(col, {
                  result: '未分配',
                  code: 'FAIL',
                  disabled: false
                })
              } else {
                Object.assign(col, {
                  result: undefined,
                  code: 'NONE',
                  disabled: false
                })
              }
            }
          }
        }
      }

      if (colName !== undefined) {
        evalCol(rec[colName], colName);
      } else {
        for (let [colName, col] of Object.entries(rec)){
          evalCol(col, colName);
        }
      }
    }

    trav(Sheets[sheetName].data, evalRecord, 'POST');
    refreshSheets(sheetName);
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
      for (let {name: sheetName} of sheetNameList) if (Sheets[sheetName] === undefined){
  
        try{
          console.log('PULL:', sheetName,' payload: ', currPage)
          const {body:{ error, ...sheetContent}} = await Agnt.post(`/pull/${sheetName}`).send(currPage);
          if (error) {
            console.warn('remote error', error);
            setStatus(error);
            return;
          }

          pulledSheets[sheetName] = sheetContent;
          // console.log(sheetContent);
          // evalSheet(sheetName);

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
      setField, addSiblyRec, addChildRec, remRec,
      pull, push, fetchURL,
    }}>
    {children}
  </Exchange.Provider>
}