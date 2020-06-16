import React, {useContext, useState,useRef} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import {store as assignRec} from '@marvintau/chua';
import { Exchange } from '../../Exchange';


export default ({sheetName, colName, data:rec, getPathSuggValue, getPathSuggs}) => {
  
  const {path:storePath, result, code, disabled} = rec[colName];

  const {Sheets, evalSheet} = useContext(Exchange);

  const pathInputProps = {
    expr:storePath,
    disabled,
    getSuggs: getPathSuggs,
    getSuggValue: getPathSuggValue,
    saveEdit(value){
      rec[colName].path = value;
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