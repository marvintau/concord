import React, {createContext, useState, useEffect} from 'react';
import Agnt from 'superagent';

import evalTable from './evaluate';
import parseTable from './parse';

const msg = {
  unsupp: '不支持的表达式，或者引用的数字并不存在',
  unrecog: '未识别',
  notfoundref: '未能按路径找到引用的记录'
}

export const RefDataContext = createContext({
  
  // data refss
  refs: [],
  data: [],
  pathColumn: '',
  colAlias: {},

  push: () => {},
  pull: () => {},

  // // update the value of whole refs
  // evaluate: () => {},

  // get the cell data through cell path
  // the path should be an array of array index (integers);
  // if the path is empty or containing invalid index, return undefined.
  setCell: () => {},

  setStatus: () => {}
})


export const RefData = ({dataName, refsName, pathColumn, colAlias, children}) => {

  const [vars, setVars] = useState({});
  const [refs, setRefs] = useState([]);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('INIT');

  useEffect(() => {
    console.log(status, 'effect');
    (async() => {
      if (status === 'INIT'){
        await pull();
      }
      if (status === 'DONE_PULL'){
        evaluate();
      }
    })()
  }, [status])

  const pull = async () => {
    setStatus('PULL');
    try{
      const {body:remoteData} = await Agnt.get(`/pull/${dataName}`);
      if (remoteData.error === 'DEAD_NOT_FOUND') {
        setStatus('DEAD_DATA_NOT_FOUND');
        return;
      }
      const {body:remoteRefs} = await Agnt.get(`/pull/${refsName}`);
      if (remoteRefs.error === 'DEAD_NOT_FOUND'){
        setStatus('DEAD_REFS_NOT_FOUND');
        return;
      }

      const parsedRefs = parseTable(remoteRefs);
      console.log(parsedRefs);
      setData(remoteData);
      setRefs(parsedRefs);
      setStatus('DONE_PULL');
    } catch(e){
      console.error(e);
      setStatus('DEAD_LOAD');
    }
  }

  const push = async () => {
    setStatus('PUSH');
    try{
      const response = await Agnt.post(`/push/${dataName}`).send(data);
      if (response.error){
        throw Error(response.error.message);
      }
      setStatus('DONE');

    } catch(e){
      console.error(e);
      setStatus('DEAD_LOAD');
    }
  }

  const refresh = (data) => {
    setData(data);
  }
  
  const setCell = (index, value) => {
    refs[index].value = value;
    evaluate();
  }

  const evaluate = () => {
    evalTable(refs, pathColumn, colAlias, data, vars);
  };

  const values = {
    data, refs, status,
    pathColumn, colAlias,
    setCell,
  }

  return <RefDataContext.Provider value={values}>
    {children}
  </RefDataContext.Provider>
}
