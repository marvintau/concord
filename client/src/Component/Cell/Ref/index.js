import React, { useCallback, useContext } from 'react';
import FetchRef from './fetch-ref';
import StoreRef from './store-ref';
import CondStoreRef from './cond-store-ref';

import {Exchange} from '../../Exchange';
import {fetch as fetchRec} from '@marvintau/chua';

import Text from '../Text';
import Number from '../Number';

export default ({sheetName, colName, disabled: disabledProp, children: cellData, data, attr:{placeholder='empty'}={}}) => {

  if (cellData === undefined) {
    return "";
  }

  if (typeof cellData === 'string') {
    return <Text>{cellData}</Text>;
  }

  if (typeof cellData === 'number') {
    return <Number>{cellData}</Number>;
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
      console.log(most, last);
      const {suggs = [], code} = fetchRec(inputValue, Sheets);
      console.log(code, 'fetchRec');
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

  const {type, disabled: disabledData} = cellData;

  const disabled = disabledProp || disabledData;

  if (type === 'ref-fetch') {
    return <FetchRef {...{sheetName, colName, disabled, cellData, data, getPathSuggs, getPathSuggValue, getExprSuggs, getExprSuggValue}} />
  }
  else if (type === 'ref-store') {
    return <StoreRef {...{sheetName, colName, disabled, cellData, data, getPathSuggs, getPathSuggValue}} />
  }
  else if (type === 'ref-cond-store') {
    return <CondStoreRef {...{sheetName, colName, disabled, cellData, data, getPathSuggs, getPathSuggValue, getExprSuggs, getExprSuggValue}} />
  }
  else {
    return <div>Ref还不支持{type}类型</div>
  }

}