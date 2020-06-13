import React, {useContext, useState,useRef} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import {store as assignRec} from '@marvintau/chua';
import { Exchange } from '../../Exchange';


export default ({sheetName, colName, cellData, data:rec, getPathSuggValue, getPathSuggs}) => {
  
  const {path:storePath, result, code, disabled} = cellData;

  const {Sheets, evalSheet} = useContext(Exchange);

  const pathInputProps = {
    expr:storePath,
    disabled,
    getSuggs: getPathSuggs,
    getSuggValue: getPathSuggValue,
    saveEdit(value){
      cellData.path = value;
      assignRec(value, rec, Sheets[sheetName].data, Sheets);
      evalSheet(sheetName, colName);
    }, 
    placeholder: '路径'
  }
  
  return <div className='refcell-line'>
    <SuggInput {...pathInputProps} />
    <RefBadge {...{result, code}} />
  </div>
}