import React, {useContext, useState,useRef} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import {store as assignRec, expr as evalExpr} from '@marvintau/chua';
import { Exchange } from '../../Exchange';

const buttonStyle = {
  background: '#FAFAFA',
  border: '1px solid lightgray',
  borderRadius: '5px'
}

export default ({sheetName, colName, data:rec, getPathSuggValue, getPathSuggs, getExprSuggs, getExprSuggValue}) => {

  const {Sheets, evalSheet} = useContext(Exchange);

  const {cases, result, code, disabled} = rec[colName];
  
  const condAssignRec = () => {
    console.log(cases, 'cond assign');
    rec.__cands = cases.map(({cond, path}) => {
      const {result} = evalExpr(cond, {Sheets, vars:rec});
      return {result, path};
    }).filter(({result}) => result);
    
    console.log(rec.__cands, 'cands')
    if (rec.__cands.length === 1){
      const [{path}] = rec.__cands;
      assignRec(path, rec, Sheets[sheetName].data, Sheets);
    } else {
      assignRec('INVALID', rec, Sheets[sheetName].data, Sheets);
    }
    evalSheet(sheetName, colName);
  }

  const lines = cases.map(({cond, path:storePath}, i) => {
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
        condAssignRec();
      }, 
      placeholder: '分类路径'
    }

    const removeCase = () => {
      cases.splice(i, 1);
      evalSheet(sheetName, colName);
    }

    return <div key={i} className='refcell-line'>
      <SuggInput {...exprInputProps} />
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

  lines.push(<button key='add' style={{...buttonStyle, margin:'5px 0 0 8px'}} onClick={addCase}> + </button>)

  return <div className='refcell-line'>
    <div style={{width: '100%'}}>{lines}</div>
    <RefBadge {...{result, code}} />
  </div>
}