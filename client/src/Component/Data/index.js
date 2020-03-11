import React, {createContext, useState, useEffect, useContext} from 'react';
import Agnt from 'superagent';
import { DepRouterContext } from '../DepRouter';

export const DataContext = createContext({
  
  // The local data, and status indicator
  data: [],
  status: '',

  // fundamental editing methods
  insert: () => {},
  remove: () => {},
  setCol: () => {},

  // interacting with remote end
  push: () => {},
  pull: () => {},
})

const ident = e => e;

// Status:
// INIT: transient state in the beginning
// DEAD: something wrong.
// PULL: retrieving data
// PUSH: sending data
// DONE: ready to show the table. 

// pushProc & pullProc:
// if you wanted to show a processed data list rather than the original form from server,
// then apply the pullProc of the fetched data. Or you wanted to create some custom saving
// format on the server, then apply the pushProc.

export const Data = ({initData=[], tableName='', pushProc=ident, pullProc=ident, children}) => {

  const {currPage} = useContext(DepRouterContext);

  const [status, setStatus] = useState('INIT');
  
  const [data, setData] = useState(initData);
  const [flat, setFlat] = useState([]);

  // If there is not enough information to infer the data, then will be
  // set error immediately. However, displaying or retrieving the data,
  // will be put in useEffect, which means the status will be set to done
  // in the next rendering.
  // 
  // Thus, even if the initData contains the full and ready data, The inner
  // component should wait for the status set to 'done'.

  if(initData.length === 0 && tableName === '' && status === 'INIT'){
    console.log(tableName, status);
    setStatus('DEAD_INFO');
  }

  const flatten = (list) => {
    const stack = [...list];
    const res = [];
    while(stack.length) {
      const next = stack.shift();
      next.children && stack.unshift(...next.children);
      res.push(next);
    }
    return res;
  }

  useEffect(() => {
    (async () => {
      if (status === 'INIT') {
        if (data.length > 0){
          setStatus('DONE');
        } else {
          await pull();
        }
      }

      if (status === 'DONE_PULL'){
        const flattened = flatten(data);
        setFlat(flattened);  
        setStatus('DONE');
      }
    })()
  }, [status])

  const pull = async () => {
    setStatus('PULL');
    try{
      const {body:remoteData} = await Agnt
        .post(`/pull/${tableName}`)
        .send(currPage);
      if (remoteData.error) {
        setStatus(remoteData.error);
        return;
      }

      const procData = pullProc(remoteData);
      setData(procData);
      setStatus('DONE_PULL');
    } catch(e){
      console.error(e);
      setStatus('DEAD_LOAD');
    }
  }

  const push = async () => {
    setStatus('PUSH');
    try{
      const response = await Agnt.post(`/push/${tableName}`).send(pushProc(data));
      if (response.error){
        throw Error(response.error.message);
      }
      setStatus('DONE');

    } catch(e){
      console.error(e);
      setStatus('DEAD_LOAD');
    }
  }

  const getRec = (path) => {
    let list = data, rec;
    for (let i = 0; i < path.length; i++){
      const index = path[i];
      rec = list[index];
      if (i === path.length - 1) break;
      list = rec.children;
    }
    return {rec, list};
  }

  const insert = (path) => {
    const {list} = getRec(path);
    
    let mostPath = [...path];
    let lastPath = mostPath.pop();

    list.splice(lastPath, 0, {
      ref: {item: '新项目', expr: '0'},
      children: []
    });

    for (let i = 0; i < list.length; i++){
      list[i].path = [...mostPath, i];
    }

    setData([...data]);
    setFlat(flatten(data));
  }

  const remove = (path) => {
    const {list} = getRec(path);
    
    let mostPath = [...path];
    let lastPath = mostPath.pop();

    list.splice(lastPath, 1);

    for (let i = 0; i < list.length; i++){
      list[i].path = [...mostPath, i];
    }

    setData([...data]);
    setFlat(flatten(data));
  }

  const setCol = (path, col, newVal) => {
    const {rec} = getRec(path);
    
    rec[col] = newVal;

    setData([...data]);
    setFlat(flatten(data));
  }

  const refresh = (newData) => {
    console.log('refresh!');
    setStatus('DONE_REFRESH');
    if (newData === undefined){
      setData([...data]);
    } else {
      setData(newData)
    }
  }

  return <DataContext.Provider value={{data, flat, status, push, pull, insert, remove, setCol, refresh}}>
    {children}
  </DataContext.Provider>
}

