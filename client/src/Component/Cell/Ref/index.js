import React, {useState, useContext} from 'react';

import Autosuggest from 'react-autosuggest';
import {Exchange} from '../../Exchange';

import Check from './check.svg';

import './react-autosuggest.css';
import './refcell.css';


const getSuggValue = (input, sugg) => {
  return input.replace(/(?<=[$:/])([^$:/]*)$/, sugg);
}

export default ({sheetName, colName, disabled, children: cellData, data:{__path}}) => {

  const {expr="", result, code} = cellData;
  
  const [editing, setEditing] = useState()
  const [explained, setExplained] = useState();
  const [value, setValue] = useState(expr.toString());
  const [delayed, setDelayed] = useState(false);
  const [suggestions, setSugg] = useState([]);

  const {getSuggs, setField, evalSheet} = useContext(Exchange);

  // the method below will be directly used by Autosuggest
  // check: https://github.com/moroshko/react-autosuggest
  const funcs = {
    getSuggestionValue : (sugg) => getSuggValue(value, sugg),
    renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
    onSuggestionsFetchRequested : ({ value:rawValue }) => {

      const value = rawValue.replace('\n', '');

      if (!delayed){
        setDelayed(true);
        setTimeout(() => {
          setDelayed(false);

          console.log(value, 'before split')
          const exprType = value.split(':').length;
          const curr = exprType > 1
          ? value.split(':')[1].split('/').slice(-1)[0]
          : value;
          const suggs = getSuggs(value);
          const transSuggs = suggs.every(sugg => typeof sugg === 'string')
                ? suggs
                : suggs.map((sugg) => sugg.ccode_name ? sugg.ccode_name : sugg.toString());

          console.log(transSuggs, curr);
          const filteredSuggs = transSuggs.filter(sugg => sugg.includes(curr));

          setSugg(filteredSuggs.length > 0 ? filteredSuggs : transSuggs)
        }, 100);
      }
    },
    onSuggestionsClearRequested : () => setSugg([]),
    onSuggestionSelected : (e, {suggestionValue}) => {
      console.log(suggestionValue, 'select');
      setValue(suggestionValue);
    },
  }

  const inputProps = {
    value,
    id: 'sugg-input',
    onChange:(e, {newValue}) => {
      setValue(newValue);
    }
  }

  const saveEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setField(sheetName, __path, colName, {expr:value});
    evalSheet(sheetName);
    setEditing(false);
  }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2})
  : result

  // const id = `ID${Math.random().toString(36).substring(2)}`
  const displayedResult = (result !== undefined)
    ? <div className={`refcell-badge ${code.slice(0, 4).toLowerCase()}`}
        onClick={(e)=>{
          e.preventDefault();
          e.stopPropagation();
          setExplained(!explained)
        }}
      >
        {displayed}
      </div>
    : <></>

  const expln = {
    WARN_UNDEFINED_FUNC:              '函数没有定义',
    WARN_INCOMPLETE_REFERENCE_FORMAT: '不是一个完整的引用（可能是没写取哪个数？）',
    WARN_SHEET_NOT_EXISTS:            '被引用的表没找到（再确认下名称）',
    WARN_RECORD_NOT_FOUND:            '按给定的路径没找到对应条目',
    WARN_NOT_EQUAL:                   '校验结果不相等',
    WARN_VAR_NOT_FOUND:               '要取的数或变量不存在',
    WARN:                             '请参考子项中的错误信息',
    INFO_ALTER_PATH:                  '此结果是通过等效的路径名称得到的',
    SUCC:                             '成功!',
    FAIL:                             '失败...',
    NORM:                             '正常'
  }

  return editing
  ? <div className="refcell-line">
      <Autosuggest {...{...funcs, suggestions, inputProps}} />
      <img className='refcell-button' src={Check} onClick={saveEdit} />
    </div>
  : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
      <div className="refcell-text"
        onClick={(e) => {
          console.log(value,' before ');
          e.preventDefault();
          e.stopPropagation();
          (!disabled) && setEditing(true)
        }}
      >{expr}</div>
      {displayedResult}
      {explained && <div className="refcell-result-tip">{expln[code] || '不解释'}</div>}
    </div>
}