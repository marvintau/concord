import React, {useContext, useState,useRef} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import {store as assignRec} from '@marvintau/chua';

import { Exchange } from '../../Exchange';

const buttonStyle = {
  background: '#FAFAFA',
  border: '1px solid lightgray',
  borderRadius: '5px'
}

export default ({sheetName, colName, data:rec, getPathSuggValue, getPathSuggs, getExprSuggs, getExprSuggValue}) => {

  const {Sheets, evalSheet} = useContext(Exchange);

  const {cases, result, disabled} = rec[colName];
  
  const lines = cases.map(({cond, path:storePath}, i, arr) => {
    const exprInputProps = {
      expr: cond,
      disabled,
      getSuggs(value){
        return getExprSuggs(value, rec);
      },
      getSuggValue: getExprSuggValue,
      saveEdit(value){
        cases[i].cond = value;
      }, 
      placeholder: '条件表达式',
      style:{flexBasis: '40%'}
    }
  
    const pathInputProps = {
      expr:storePath,
      disabled,
      getSuggs: getPathSuggs,
      getSuggValue: getPathSuggValue,
      saveEdit(value){
        cases[i].path = value;
      }, 
      placeholder: '分类路径'
    }

    const removeCase = () => {
      cases.splice(i, 1);
      evalSheet(sheetName, colName);
    }

    return <div key={i} className='refcell-line'>
      {arr.length > 1 && <SuggInput {...exprInputProps} />}
      <SuggInput {...pathInputProps} />
      <button style={buttonStyle} onClick={removeCase}> - </button>
    </div> 
  })
  
  const addCase = (e) => {
    e.preventDefault();
    e.stopPropagation();
    cases.push({cond:'', path: ''});
    evalSheet(sheetName, colName)
  }

  const saveApplyToSub = (e) => {
    console.log(e.target.value);
    rec.__apply_spec = e.target.value;
  }

  if (!disabled){
    lines.push(<div key='add' className='refcell-line left'>
      <button key='add' style={{...buttonStyle, margin:'5px 0 0 8px'}} onClick={addCase}> + </button>
      <div className='refcell-option'>
        <input
          placeholder='如何应用于子级项目'
          value={rec.__apply_spec}
          onChange={saveApplyToSub}
          onClick={(e) => {e.stopPropagation();}}
        />
      </div>
    </div>)
  }

  return <div className='refcell-line'>
    <div style={{width: '100%'}}>{lines}</div>
    <RefBadge {...{result, code: rec[colName].code}} />
  </div>
}