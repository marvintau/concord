import React, {useState, useContext} from 'react';

import Autosuggest from 'react-autosuggest';
import {GrandExchangeContext} from '../../GrandExchange';

import Check from './check.svg';

import './react-autosuggest.css';
import './refcell.css';


const getSuggValue = (input, sugg) => {
  return input.replace(/(?<=[$:/])([^$:/]*)$/, sugg);
}

export default ({sheetName, colName, disabled, children: cellData, data:{__path}}) => {

  const {expr="", result, code} = cellData;
  
  const [editing, setEditing] = useState()
  const [value, setValue] = useState(expr);
  const [delayed, setDelayed] = useState(false);
  const [suggestions, setSugg] = useState([]);

  const {getSuggs, setField, evalSheet} = useContext(GrandExchangeContext);

  // the method below will be directly used by Autosuggest
  // check: https://github.com/moroshko/react-autosuggest
  const funcs = {
    getSuggestionValue : (sugg) => getSuggValue(value, sugg),
    renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
    onSuggestionsFetchRequested : ({ value }) => {
      if (!delayed){
        console.log('inputing ');
        setDelayed(true);
        setTimeout(() => {
          setDelayed(false);
          setSugg(getSuggs(value))
        }, 500);
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
    setField(sheetName, __path, colName, {expr:value});
    evalSheet(sheetName);
    setEditing(false);
  }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2})
  : result

  // const id = `ID${Math.random().toString(36).substring(2)}`

  const displayedResult = result !== undefined
  ? <div>
      <div className={`refcell-badge ${code.slice(0, 4).toLowerCase()}`}>{displayed}</div>
    </div>
  : <></>

  return editing
  ? <div className="refcell-line">
      <Autosuggest {...{...funcs, suggestions, inputProps}} />
      <img className='refcell-button' src={Check} onClick={saveEdit} />
    </div>
  : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
      <div className="react-autosuggest__input refcell-text"
        onClick={() => {(!disabled) && setEditing(true)}}
      >{expr}</div>
      {displayedResult}
    </div>
}