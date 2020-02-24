import React, {createContext, useState, useEffect} from 'react';
import Agnt from 'superagent';

export const DataFetchContext = createContext({
  
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

const nop = e => e;

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

export const DataFetch = ({initData=[], api='', pushProc=nop, pullProc=nop, children}) => {

  const [status, setStatus] = useState('INIT');
  const [data, setData] = useState(initData);

  // If there is not enough information to infer the data, then will be
  // set error immediately. However, displaying or retrieving the data,
  // will be put in useEffect, which means the status will be set to done
  // in the next rendering.
  // 
  // Thus, even if the initData contains the full and ready data, The inner
  // component should wait for the status set to 'done'.

  if(initData.length === 0 && api === '' && status === 'INIT'){
    setStatus('DEAD_INFO');
  }

  useEffect(() => {
    if (status !== 'DEAD_INFO')
      if (data.length > 0){
        setStatus('DONE');
      } else {
        (async () => {
          setStatus('LOAD');
          pull();
        })();
      }
  }, [status])

  const pull = async () => {
    setStatus('PULL');
    try{
      const remoteData = await Agnt.get(`/pull/${api}`);
      const procData = pullProc(remoteData);
      setData(procData);
      setStatus('DONE');
    } catch(e){
      console.error(e);
      setStatus('DEAD_LOAD');
    }
  }

  const push = async () => {
    setStatus('PUSH');
    try{
      const localData = pushProc(data);
      const response = await Agnt.post(`/push/${api}`).send(localData);
      if (response.error){
        throw Error(response.error.message);
      }
      setStatus('DONE');

    } catch(e){
      console.error(e);
      setStatus('DEAD_LOAD');
    }
  }

  return <DataFetchContext.Provider value={{data, status, push, pull}}>
    {children}
  </DataFetchContext.Provider>
}

