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

    rec.__cands = cases.length === 1
    ? [{result: true, path:cases[0].path}]
    : cases.map(({cond, path}) => {
        const {result} = evalExpr(cond, {Sheets, vars:rec});
        return {result, path};
      }).filter(({result}) => result);
    
    const destPath = rec.__cands.length === 1
    ? rec.__cands[0].path
    : 'INVALID';
    if (rec.__applyToSub){
      if (rec.__children === undefined) {
        assignRec('INVALID', rec, Sheets[sheetName].data, Sheets);
      } else for (let sub of rec.__children){
        assignRec(destPath, sub, Sheets[sheetName].data, Sheets);
      }
    } else {
      assignRec(destPath, rec, Sheets[sheetName].data, Sheets);
    }
  }

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
        condAssignRec();
        evalSheet(sheetName, colName);
        console.log(rec, 'after asasigned');
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

  const toggleApplySub = (e) => {
    rec.__applyToSub = !rec.__applyToSub;
  }

  if (!disabled){
    lines.push(<div key='add' className='refcell-line left'>
      <button key='add' style={{...buttonStyle, margin:'5px 0 0 8px'}} onClick={addCase}> + </button>
      <div className='refcell-option'>
        <input type='checkbox' checked={rec.__applyToSub} onChange={toggleApplySub} onClick={(e) => {
          e.stopPropagation();
        }} />
        <span onClick={(e) => e.stopPropagation()}>用于子项</span>
      </div>
    </div>)
  }

  return <div className='refcell-line'>
    <div style={{width: '100%'}}>{lines}</div>
    <RefBadge {...{result, code}} />
  </div>
}