import React, {useState, useContext} from 'react';

import Autosuggest from 'react-autosuggest';
import {GrandExchangeContext} from '../../GrandExchange';

import {Input, UncontrolledTooltip} from 'reactstrap';

import Check from './check.svg';

import './react-autosuggest.css';
import './refcell.css';

const level = (header) => {
  return header.split('#').length - 1;
}

const rem = (header) => {
  return header.replace(/#/g, '');
}

const getSuggValue = (input, sugg) => {
  return input.replace(/(?<=[$:/])([^$:/]*)$/, sugg);
}

export default ({sheetName, colName, disabled, children: cellData, data:{__path}}) => {

  const {item="", expr="", result, code} = cellData;
  
  const [editing, setEditing] = useState()
  const [desc, setDesc] = useState(item);
  const [value, setValue] = useState(expr);
  const [suggestions, setSugg] = useState([]);

  const {getSuggs, setField, evalSheet} = useContext(GrandExchangeContext);

  // the method below will be directly used by Autosuggest
  // check: https://github.com/moroshko/react-autosuggest
  const funcs = {
    getSuggestionValue : (sugg) => getSuggValue(value, sugg),
    renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
    onSuggestionsFetchRequested : ({ value }) => setSugg(getSuggs(value)),
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
    setField(sheetName, __path, colName, {item:desc, expr:value});
    evalSheet(sheetName);
    setEditing(false);
  }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2})
  : result

  // const id = `ID${Math.random().toString(36).substring(2)}`

  const displayedResult = result !== undefined
  ? <div>
      <div className={`refcell-badge ${code.startsWith('WARN') ? 'warn' : 'norm' }`}>{displayed}</div>
      {/* <UncontrolledTooltip placement="left" target={id}>{code}</UncontrolledTooltip> */}
    </div>
  : <></>

  const displayedContent = !item.startsWith('#')
  ? <span className='expr'>{expr}</span>
  : <span className={`header-${__path.length}`}>{rem(item)}</span>;

  return editing
  ? <div className="refcell-line">
      <Input placeholder="在这里修改描述" style={{height: '28.5px', marginRight: '5px'}} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <Autosuggest {...{...funcs, suggestions, inputProps}} />
      <img className='refcell-button' src={Check} onClick={saveEdit} />
    </div>
  : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
      <div className="react-autosuggest__input refcell-text"
        onClick={() => {(!disabled) && setEditing(true)}}
      >{displayedContent}</div>
      {displayedResult}
    </div>

  // // return <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
  // //   <div className="react-autosuggest__input refcell-text"
  // //     onClick={() => {(!disabled) && setEditing(true)}}
  // //   >{displayedContent}</div>
  // //   {displayedResult}
  // // </div>

  // return <></>
}