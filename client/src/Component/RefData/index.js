import React, {createContext, useState, useEffect} from 'react';
import Agnt from 'superagent';

export const RefDataContext = createContext({
  
  // data refss
  refs: [],
  data: [],

  push: () => {},
  pull: () => {},

  // update the value of whole refs
  evaluate: () => {},

  // get the cell data through cell path
  // the path should be an array of array index (integers);
  // if the path is empty or containing invalid index, return undefined.
  getCell: () => {},
  setCell: () => {},
  
  // get all suggestions with given input string
  getSugg:() => {},

  // get the actual value to be filled into the input, with
  // given input value and suggestion options.
  getSuggValue: () => {},

  setStatus: () => {}
})

// Not actually used.
const traverse = (refs, func, order='POST') => {
  for (let record of refs){
    order === 'PREV' && func(record);
    record.children  && traverse(record.children, func);
    order === 'POST' && func(record);
  }
}  

export const RefData = ({dataName, refsName, pathColumn, evalColumnDict, children}) => {

  const [vars, setVars] = useState({});
  const [refs, setRefs] = useState([]);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('INIT');

  const msg = {
    unsupp: '不支持的表达式，或者引用的数字并不存在',
    unrecog: '未识别',
    notfoundref: '未能按路径找到引用的记录'
  }

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

  const refresh = (data) => {
    setData(data);
  }

  const getRef = (path) => {
    let list = data, ref;
    for (let seg of path) {
      ref = list.find(({[pathColumn]: pathCol}) => pathCol === seg);
      if (ref === undefined) break;
      list = ref.children;
    }
    return ref;
  }

  const evalRef = (value) => {
    const [path, expr] = value.split(':');
    const ref = getRef(path.split('/').slice(1));

    if (ref === undefined){
      return {status:'WARN', result: msg.notfoundref};
    } else if(expr.replace(/(\$([^()*/+-]+))/g, '').match(/^[()*/+-]*$/)){
      const result = eval(expr.replace(/(\$([^()*/+-]+))/g, (_,__,arg) => `(${ref[evalColumnDict[arg]]})` ))
      return result === undefined 
      ? {status:'WARN', result: msg.unsupp}
      : {status:'NORM', result}
    } else {
      return {status:'WARN', result: msg.unsupp}
    }
  }

  const evalFunc = (ref, value) => {
    const funcs = {
      sum(){
        let result = ref.children
          .filter(({status}) => status === 'NORM')
          .map(({result}) => result)
          .reduce((e, acc) => e + acc, 0);
        let status = ref.children.every(({status}) => status !== 'NORM') ? 'WARN' : 'NORM';
        return {result, status};
      },
      get(i){
        let {result, status} = ref.children[i];
        return {result ,status};
      }
    }

    if (Object.keys(funcs).includes(value.replace(/([^)]*)/, ''))){
      return eval(`funcs.${value}`);
    } else {
      return {result: msg.unsupp, status:'WARN'}
    }
  }

  const evalExpr = (value) => {
    if(value.replace(/(\$([^()*/+-]+))/g, '').match(/^[()*/+-]*$/)){
      return eval(value.replace(/(\$([^()*/+-]+))/g, (...args) => `(${vars[args[2]]})` ))
    } else {
      return {status:'WARN', result: msg.unrecog}
    }
  }

  const evalSingle = (record) => {
    let {value} = record;
    value = value.replace(/\s/g, '');

    let varName;
    if (value.includes('=')){
      let splitted = value.includes('=');
      varName = splitted[0];
      value = splitted[1];
    }

    if(varName && !varName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)){
      record.result = '变量名不符合规则';
      record.status = 'WARN';
      return 
    }

    if (!isNaN(parseFloat(value))){
      record.result = parseFloat(value);
      record.status = 'NORM'
    } else if (value.startsWith('@')) {
      Object.assign(record, evalFunc(record, value.slice(1)));
    } else if(value.match(/(\/[^\/]+)+:/)) {
      Object.assign(record, evalRef(value));
    } else {
      Object.assign(record, evalExpr(value));
    }

    if(varName){
      setVars(Object.assign({}, vars, {[varName]: record.result}));
    }
  }


  // This handles auto-completing path
  const getPathSugg = (path) => {
    const splitted = path.split('/').slice(1);
    
    if (splitted.length === 0){
      return data.map(({[pathColumn]:col}) => `${col}`);
    }
    
    const ref = getRef(splitted);
    if (ref !== undefined){
      return ref.children.map(({[pathColumn]:pathCol}) => `${pathCol}`);
    }

    return [];
  }

  // this handles auto-completing an identifier of expression
  const getEvalSugg = () => {
    return Object.keys(evalColumnDict);
  }

  const getSugg = (input) => {
    // if the input matches the non-slash-non-semicolon substring in the end,
    // this is an incomplete path, so we remove the last incomplete segment
    // of path, and get the possible candidates.
    if (input.match(/[/][^$/]*$/)) {
      const lastSeg = input.split('/').slice(-1)[0];
      return getPathSugg(input.replace(/[/][^$/]*$/, '')).filter(cand => cand.includes(lastSeg));

    // in this case we are matching an incomplete identifier.
    } else if (input.match(/[$][^$*/+-]*$/)) {
      return getEvalSugg()
    }

    return [];
  }

  const getSuggValue = (inputPath, sugg) => {
    return inputPath.replace(/(?<=[$/])([^$/]*)$/, sugg);
  }

  const getCell = (index) => {
    return refs[index];
  }

  const setCell = (index, value) => {
    refs[index].value = value;
  }

  const evaluate = () => {
    traverse(refs, evalSingle);
  };

  const values = {
    data, refs, status,
    evaluate, getCell, setCell, getSugg, getSuggValue, refresh, setStatus
  }

  return <RefDataContext.Provider value={values}>
    {children}
  </RefDataContext.Provider>
}
