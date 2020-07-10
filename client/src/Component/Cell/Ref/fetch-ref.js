import React, {useContext, useState} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import {Exchange} from '../../Exchange';

import {fetch as fetchRec} from '@marvintau/jpl';

import './refcell.css'

export default ({sheetName, colName, disabled, data:rec, getPathSuggs, getPathSuggValue, getExprSuggs, getExprSuggValue}) => {

  const [record, setRecord] = useState();
  const {Sheets, evalSheet} =useContext(Exchange);

  const {expr="", path:fetchPath, result, code, disp} = rec[colName];
  
  const pathInputProps = {
    expr:fetchPath,
    disabled,
    getSuggs: getPathSuggs,
    getSuggValue: getPathSuggValue,
    saveEdit(value){
      const {record} = fetchRec(value, Sheets);
      setRecord(record);
      rec[colName].path = value;
    }, 
    placeholder: '路径'
  }

  const exprInputProps = {
    expr,
    disabled,
    getSuggs(value){
      return getExprSuggs(value, record);
    },
    getSuggValue: getExprSuggValue,
    saveEdit(value){
      rec[colName].expr = value;
      console.log(value);
      evalSheet(sheetName, colName);
    }, 
    placeholder: '表达式',
  }

  if (disp === 'full' || disp === undefined) {
    return <div className='refcell-line'>
      <SuggInput {...pathInputProps} />
      <SuggInput {...exprInputProps} />
      <RefBadge {...{result, code}} />
    </div>
  } else if (disp === 'expr') {
    return <div className='refcell-line'>
    <SuggInput {...exprInputProps} />
    <RefBadge {...{result, code}} />
  </div>
  } else if (disp === 'res') {
    return <div className='refcell-line'>
      <RefBadge {...{result, code}} />
    </div>
  }
}