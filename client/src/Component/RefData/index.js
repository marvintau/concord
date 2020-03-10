import React, {createContext, useState, useEffect, useContext} from 'react';
import Agnt from 'superagent';

import evalTable from './evaluate';
import parseTable from './parse';
import { DepRouterContext } from '../DepRouter';

const msg = {
  unsupp: '不支持的表达式，或者引用的数字并不存在',
  unrecog: '未识别',
  notfoundref: '未能按路径找到引用的记录'
}

export const RefDataContext = createContext({
  
  // data refss
  refs: [],
  flat: [],
  data: [],
  pathColumn: '',

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

export const RefData = ({dataName, dataType="FILE", refsType="FILE", refsName, pathColumn, children}) => {

  const {currPage} = useContext(DepRouterContext);

  const [refs, setRefs] = useState([]);
  const [flat, setFlat] = useState([]);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('INIT');

  useEffect(() => {
    console.log(status, 'effect');
    (async() => {
      if (status === 'INIT'){
        await pull();
      }
      if (status === 'DONE_PULL'){
        evalTable(refs, pathColumn, data);
        const flattened = flatten(refs);
        console.log(flattened.map(({ref:{result}}) => result));
        setFlat(flattened);
      }
    })()
  }, [status])

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

  const pull = async () => {
    setStatus('PULL');
    try{
      const {body:remoteData} = await Agnt
        .post(`/pull/${dataName}`)
        .send(currPage);

      if (remoteData.error === 'DEAD_NOT_FOUND') {
        setStatus('DEAD_DATA_NOT_FOUND');
        return;
      }

      const {body:remoteRefs} = await Agnt
        .post(`/pull/${refsName}`)
        .send(currPage);

      if (remoteRefs.error === 'DEAD_NOT_FOUND'){
        setStatus('DEAD_REFS_NOT_FOUND');
        return;
      }

      const parsedRefs = parseTable(remoteRefs);
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

  const setCell = (index, value) => {
    refs[index].value = value;
    evalTable(refs, pathColumn, data);
  }

  const refresh = (newData) => {
    setStatus('DONE_REFRESH');
    setData(newData);
  }

  const values = {
    data, refs, flat, status,
    pathColumn, setCell, refresh
  }

  return <RefDataContext.Provider value={values}>
    {children}
  </RefDataContext.Provider>
}