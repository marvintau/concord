import React, {createContext, useState, useEffect, useContext} from 'react';
import Agnt from 'superagent';

import evalTable from './evaluate';
import { DepRouterContext } from '../DepRouter';

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

  counter: [],

  push: () => {},
  pull: () => {},

  insert: () => {},
  remove: () => {},
  // get the cell data through cell path
  // the path should be an array of array index (integers);
  // if the path is empty or containing invalid index, return undefined.
  setCol: () => {},

  setStatus: () => {}
})

export const RefData = ({dataName, refsName, pathColumn, children}) => {

  const {currPage} = useContext(DepRouterContext);

  const [refs, setRefs] = useState([]);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('INIT');

  let counter = 0;

  useEffect(() => {

    console.log(status, 'effect');
    (async() => {
      if (status === 'INIT'){
        await pull();
      }
      if (status === 'DONE_PULL'){
        evalTable(refs, pathColumn, data);
      }
    })()
  }, [status])

  const pull = async () => {
    setStatus('PULL');
    try{
      const {body:remoteData} = await Agnt
        .post(`/pull/${dataName}`)
        .send(currPage);

      if (remoteData.error) {
        setStatus(remoteData.error);
        return;
      }

      const {body:remoteRefs} = await Agnt
        .post(`/pull/${refsName}`)
        .send(currPage);

      if (remoteRefs.error){
        setStatus(remoteRefs.error);
        return;
      }

      // const parsedRefs = parseTable(remoteRefs);
      setData(remoteData);
      setRefs(remoteRefs);
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

  const getRec = (path) => {
    let list = refs, rec;
    for (let i = 0; i < path.length; i++){
      const index = path[i];
      rec = list[index];
      if (i === path.length - 1) break;
      list = rec.children;
    }
    return {rec, list};
  }

  const setCol = (path, col, newVal) => {
    console.log(path, 'set cell');
    const {rec} = getRec(path);
    rec[col] = newVal;
    const newRefs = evalTable(refs, pathColumn, data);
    setRefs(newRefs);
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

    setRefs([...refs]);
  }

  const remove = (path) => {
    const {list} = getRec(path);
    
    let mostPath = [...path];
    let lastPath = mostPath.pop();

    list.splice(lastPath, 1);

    for (let i = 0; i < list.length; i++){
      list[i].path = [...mostPath, i];
    }

    setRefs([...refs]);
  }

  const refresh = (newData) => {
    setStatus('DONE_REFRESH');
    setData(newData);
  }

  const values = {
    counter,
    data, refs, status,
    pathColumn, setCol, refresh, insert, remove
  }

  return <RefDataContext.Provider value={values}>
    {children}
  </RefDataContext.Provider>
}
