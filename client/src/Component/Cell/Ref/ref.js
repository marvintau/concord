import React, {useState} from 'react';

import Autosuggest from 'react-autosuggest';

import Check from './check.svg';

import './react-autosuggest.css';
import './refcell.css';

/**
 * getSuggValue
 * ============
 * 
 * 表reference的格式：
 * 
 * 表名称:目录级次1/目录级次2/.../目录级次n:表达式
 * 
 * 表达式中可能包含目录级次下条目的column name作为变量，也可以引用全局变量
 * 
 * input是当前输入的值，sugg是建议的值。由于sugg是基于当前末级输入的不完整
 * 的结果推荐的，因此最终形成的完整路径，需要将当前不完整的末级输入删除，然
 * 后将sugg结果添加到最近的"/"或":"处。
 */

const getSuggValue = (input, sugg) => {
  return input.replace(/(?<=[$:/])([^$:/]*)$/, sugg);
}

/**
 * expr: 输入的表达式
 * result: 计算的结果
 * code: 计算结果的代号，用于控制badge样式
 * desc: 鼠标悬停时显示的结果描述
 * getSuggs: 显示建议的选项
 * saveEdit: 保存更改及后续动作
 */

export default ({expr='', result, code, desc, placeholder, disabled, getSuggs=()=>[], saveEdit=()=>{}}) => {
  
  const [editing, setEditing] = useState()
  const [explained, setExplained] = useState();
  const [value, setValue] = useState(expr.toString());
  const [delayed, setDelayed] = useState(false);
  const [suggestions, setSugg] = useState([]);

  const updateSugg = (value) => {
    setDelayed(false);

    // check if we are handling a full path or a simple expression
    const exprType = value.split(':').length;
    const curr = exprType > 1
          ? value.split(':')[1].split('/').slice(-1)[0]
          : value;

    // this part is for handling a situation that the return suggestions
    // are not array of strings.
    const suggs = getSuggs(value);
    const transSuggs = suggs.every(sugg => typeof sugg === 'string')
          ? suggs
          : suggs.map((sugg) => sugg.ccode_name ? sugg.ccode_name : sugg.toString());

    const filteredSuggs = transSuggs.filter(sugg => sugg.includes(curr));

    setSugg(filteredSuggs.length > 0 ? filteredSuggs : transSuggs)
  }

  const onSuggestionsFetchRequested = ({ value }) => {
    if (!delayed){
      setDelayed(true);
      setTimeout(updateSugg, 100, value.replace('\n', ''));
    }
  }

  // the method below will be directly used by Autosuggest
  // check: https://github.com/moroshko/react-autosuggest
  const funcs = {
    getSuggestionValue : (sugg) => getSuggValue(value, sugg),
    renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
    onSuggestionsFetchRequested,
    onSuggestionsClearRequested : () => setSugg([]),
    onSuggestionSelected : (e, {suggestionValue}) => {
      setValue(suggestionValue);
    },
  }

  const save = (e) => {
    e.preventDefault();
    e.stopPropagation();

    saveEdit(value);
    setEditing(false);
  }

  const inputProps = {
    placeholder,
    value,
    id: 'sugg-input',
    onChange:(e, {newValue}) => {
      e.preventDefault();
      e.stopPropagation();
      setValue(newValue);
    },
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2})
  : result

  // console.log(result, displayed, 'displayed result ref core');

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

  return editing
  ? <div className="refcell-line">
      <Autosuggest {...{...funcs, suggestions, inputProps}} />
      <img className='refcell-button' src={Check} onClick={save} />
    </div>
  : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
      <div className="refcell-text"
        onClick={(e) => {
          console.log(value,' before ');
          e.preventDefault();
          e.stopPropagation();
          !disabled && setEditing(true)
        }}
      >{expr === '' ? placeholder : expr}</div>
      {displayedResult}
      {explained && <div className="refcell-result-tip">{desc || '不解释'}</div>}
    </div>
}