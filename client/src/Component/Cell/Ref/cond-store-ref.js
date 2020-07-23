import React, {useState, useContext} from 'react';
import SuggInput from './sugg-input';
import RefBadge from './ref-badge';

import { Exchange } from '../../Exchange';

export default ({sheetName, colName, data:rec, getPathSuggValue, getPathSuggs, getExprSuggs, getExprSuggValue}) => {

  const {evalSheet} = useContext(Exchange);

  const [isEditing, setEditing] = useState(false);

  const {cases, result, disabled} = rec[colName];
  
  const toggleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(!isEditing);
  }

  if (isEditing) {

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
  
      const removeCase = (e) => {
        e.preventDefault();
        e.stopPropagation();  
        cases.splice(i, 1);
        evalSheet(sheetName, colName);
      }
  
      return <div key={i} className='refcell-line'>
        {arr.length > 1 && <SuggInput {...exprInputProps} />}
        <SuggInput {...pathInputProps} />
        <button className='button upload' onClick={removeCase}> - </button>
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
      rec[colName].applySpec = e.target.value;
    }
  
    if (!disabled){
      lines.push(<div key='add' className='refcell-line left'>
        <button key='add' className="button upload" style={{margin:'5px 0 0 8px'}} onClick={addCase}> + </button>
        <div className='refcell-option'>
          <input
            placeholder='如何应用于子级项目'
            value={rec[colName].applySpec || ''}
            onChange={saveApplyToSub}
            onClick={(e) => {e.stopPropagation();}}
          />
        </div>
      </div>)
    }

    return <div className='refcell-line'>
      <div style={{width: '100%'}}>{lines}</div>
      <button className="button upload" onClick={toggleEdit} style={{width: 120}}> 保存 </button>
      <RefBadge {...{result, code: rec[colName].code}} />
    </div>
  
  } else {
    const lines = cases.map(({cond, path}, i, a) => {
      const condElem = <div style={{minWidth: 100, marginRight:3}}>{cond && a.length > 1 ? `如 ${cond}` : ''}</div>;
      const pathElem = <div style={{overflow: 'visible', whiteSpace:'pre'}}>{a.length > 1 ? '则' : ''}分配至 {path}</div>;
      return <div key={i} style={{display:'flex', fiexDirection:'column'}}>{condElem}{pathElem}</div>
    })

    return<div className='refcell-line'>
      <div style={{width: '100%', overflowX:'scroll'}}>{lines}</div>
      <button  className="button upload" style={{width: 120}} onClick={toggleEdit}> 编辑 </button>
      <RefBadge {...{result, code: rec[colName].code}} />
    </div>
  }

}