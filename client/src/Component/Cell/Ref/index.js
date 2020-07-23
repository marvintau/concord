import React, { useContext } from 'react';
import FetchRef from './fetch-ref';
// import StoreRef from './store-ref';
import CondStoreRef from './cond-store-ref';

import {Exchange} from '../../Exchange';
import {fetch as fetchRec} from '@marvintau/jpl';

import Text from '../Text';
import Number from '../Number';

export default ({sheetName, colName, data, attr:{disabled: disabledProp, placeholder='empty', defaultType}={}}) => {

  if (typeof data[colName] === 'string') {
    return <Text>{data[colName]}</Text>;
  }

  if (typeof data[colName] === 'number') {
    return <Number>{data[colName]}</Number>;
  }

  if (data[colName] === undefined ) {
    if (!['ref-fetch', 'ref-store', 'ref-cond-store'].includes(defaultType)) {
      return '';
    } else {
      const defaultValue = {
        'ref-fetch' : {type: 'ref-fetch', path: '', expr: ''},
        'ref-store' : {type: 'ref-store', path: ''},
        'ref-cond-store' : {type: 'ref-cond-store', cases:[]}
      }[defaultType];
      data[colName] = defaultValue;
    }
  }

  const {Sheets} = useContext(Exchange);

  const getPathSuggs = (inputValue) => {

    console.log('getPath clalled', inputValue);

    const separateLast = (inputValue) => {
      if (inputValue.includes('/')){
        const lastDelim = inputValue.lastIndexOf('/');
        const most = inputValue.slice(0, lastDelim);
        const last = inputValue.slice(lastDelim+1);
        return [most, last];
      } else {
        return [inputValue, '']
      }
    }
    
    if (inputValue.split(':').length < 2) {
      return Object.entries(Sheets)
        .filter(([k]) => !k.startsWith('__'))
        .map(([k, {desc}]) => {
          return {desc: `${k} - ${desc || '无描述'}`, value: k}
        })
    } else {
      const [most, last] = separateLast(inputValue);
      const {suggs = [], code} = fetchRec(inputValue, Sheets);
      const filt = suggs.filter(sugg => sugg.includes(last));
      return filt.length > 0 ? filt : suggs;
    }
  }

  const getPathSuggValue = (value, sugg) => {
    if (value.includes(':')){
      return value.replace(/[^/:]*$/, sugg.value || sugg.toString());
    } else {
      return sugg.value || sugg.toString();
    }
  }

  const getExprSuggs = (value, rec={}) => {
    const {__VARS, __COL_ALIASES} = Sheets;
    const regVars = Object.entries(__VARS)
      .map(([k, v]) => ({desc:`${k} - ${v.toFixed(2)}`, value:k}));

    const columns = Object.entries(rec)
      .filter(([col]) => !col.startsWith('__'))
      .map(([k, v]) => ({desc:`${k} - ${ typeof v === 'number' ? v.toFixed(2): v}`, value:k}));

    const aliases = Object.entries(__COL_ALIASES)
      .filter(([_, v]) => rec[v] !== undefined)
      .map(([k, v]) => ({desc: `${k} - ${rec[v].toFixed(2)}`, value: k}));

    return [...regVars, ...columns, ...aliases];
  }

  const getExprSuggValue = (value, sugg) => {
    return value.replace(/[^@*/+-<>= ]*$/, sugg.value || sugg.toString());
  }

  const {type, disabled: disabledData} = data[colName] || {};


  if (['ref-fetch', 'ref-cond-store'].includes(type)) {

    const disabled = disabledProp || disabledData;

    const Ref = {
      'ref-fetch' : FetchRef,
      'ref-cond-store' : CondStoreRef
    }[type];

    return <Ref {...{sheetName, colName, disabled, data, getPathSuggs, getPathSuggValue, getExprSuggs, getExprSuggValue}} />
  }
  else {
    return <div>Ref还不支持{type}类型</div>
  }

}