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
  modify: () => {},

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

export const Data = ({initData=[], tableName='', dataType="file", pushProc=ident, pullProc=ident, children}) => {

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
      if (remoteData.error === 'DEAD_NOT_FOUND') {
        setStatus('DEAD_DATA_NOT_FOUND');
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

  const insert = (rec, index=0) => {
    data.splice(index, 0, rec);
    setData([...data]);
    setStatus('DONE_MODIFIED');
  }

  const remove = (index) => {
    data.splice(index, 1);
    setData([...data]);
    setStatus('DONE_MODIFIED');
  }

  const modify = (index, rec) => {
    data.splice(index, 1, rec);
    setData([...data]);
    setStatus('DONE_MODIFIED');
  }

  const refresh = (newData) => {
    console.log('refresh!');
    setStatus('DONE_REFRESH');
    setData(newData)
  }

  return <DataContext.Provider value={{data, flat, status, push, pull, insert, remove, modify, refresh}}>
    {children}
  </DataContext.Provider>
}

