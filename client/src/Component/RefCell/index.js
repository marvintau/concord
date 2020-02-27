import React, {useState, useContext} from 'react';
import {RefDataContext} from '../RefData';
import Autosuggest from 'react-autosuggest';

import './react-autosuggest.css';
import './refcell.css';

export default ({index, disabled}) => {

  const {getCell, setCell, getSugg, getSuggValue, evaluate} = useContext(RefDataContext);

  const {value:val, result, status} = getCell(index);
  
  const [editing, setEditing] = useState()
  const [value, setValue] = useState(val);
  const [suggestions, setSugg] = useState([]);
  
  // the method below will be directly used by Autosuggest
  // check: https://github.com/moroshko/react-autosuggest
  const funcs = {
    getSuggestionValue : (sugg) => getSuggValue(value, sugg),
    renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
    onSuggestionsFetchRequested : ({ value }) => setSugg(getSugg(value)),
    onSuggestionsClearRequested : () => setSugg([]),
    onSuggestionSelected : (e, {suggestionValue}) => {
      setValue(suggestionValue);
      setCell(index, suggestionValue);
    },
  }

  const inputProps = {
    value,
    id: 'sugg-input',
    autoFocus: true,
    onChange:(e, {newValue}) => {
      setValue(newValue);
    },
    onBlur:(e) => {
      setCell(index, value)
      setEditing(false);
      evaluate();
    }
  }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us')
  : result

  return editing
  ? <div className="refcell-line">
      <Autosuggest {...{...funcs, suggestions, inputProps}} ref={() => { document.getElementById('sugg-input').focus(); }} />
    </div>
  : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`} onClick={() => !disabled && setEditing(true)}>
      <div className="react-autosuggest__input refcell-text" style={{width:'auto'}}>{val}</div>
      {result && <div className={`refcell-badge ${status.toLowerCase()}`}>{displayed}</div>}
    </div>
}