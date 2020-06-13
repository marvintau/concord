import React, {useContext, useState} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import {Exchange} from '../../Exchange';

import {fetch as fetchRec} from '@marvintau/chua';

import './refcell.css'

export default ({sheetName, colName, disabled, cellData, getPathSuggs, getPathSuggValue, getExprSuggs, getExprSuggValue}) => {

  const [record, setRecord] = useState();
  const {Sheets, evalSheet} =useContext(Exchange);

  const {expr="", path:fetchPath, result, code} = cellData;
  
  const pathInputProps = {
    expr:fetchPath,
    disabled,
    getSuggs: getPathSuggs,
    getSuggValue: getPathSuggValue,
    saveEdit(value){
      const {record} = fetchRec(value, Sheets);
      setRecord(record);
      cellData.path = value;
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
      cellData.expr = value;
      console.log(value);
      evalSheet(sheetName, colName);
    }, 
    placeholder: '表达式'
  }

  return <div className='refcell-line'>
    <SuggInput {...pathInputProps} />
    <SuggInput {...exprInputProps} />
    <RefBadge {...{result, code}} />
  </div>
}