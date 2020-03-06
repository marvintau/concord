import React, {useState, useContext} from 'react';

import {RefDataContext} from '../RefData';

import Autosuggest from 'react-autosuggest';
import {Input} from 'reactstrap';

import './react-autosuggest.css';
import './refcell.css';

const level = (header) => {
  return header.split('#').length - 1;
}

const rem = (header) => {
  return header.replace(/#/g, '');
}

export default ({data}) => {

  const {setCell, getSugg, getSuggValue, evaluate} = useContext(RefDataContext);

  const {item, expr, result, status} = data;

  // const {} = getCell(index);
  
  const [editing, setEditing] = useState()
  const [desc, setDesc] = useState(item);
  const [value, setValue] = useState(expr);
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
      // setCell(index, suggestionValue);
    },
  }

  const inputProps = {
    value,
    id: 'sugg-input',
    autoFocus: true,
    onChange:(e, {newValue}) => {
      setValue(newValue);
    }
  }

  const saveEdit = (e) => {
    // setCell(path, desc, value)
    setEditing(false);
    evaluate();
  }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us')
  : result

  const id = `ID${Math.random().toString(36).substring(2)}`

  const displayedResult = result !== undefined
  ? <div className={`refcell-badge ${status.toLowerCase()}`}>
      {displayed}
    </div>
  : <></>

  const displayedContent = !item.startsWith('#')
  ? <span className='expr'>{expr}</span>
  : <span className={`header-${level(item)}`}>{rem(item)}</span>;

  return editing
  ? <div className="refcell-line">
      <Input placeholder="在这里修改描述" style={{height: '28.5px', marginRight: '5px'}} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <Autosuggest {...{...funcs, suggestions, inputProps}} ref={() => { document.getElementById('sugg-input').focus(); }} />
      <button className="button" onClick={saveEdit}>好</button>
    </div>
  : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
      <div className="react-autosuggest__input refcell-text"
        onClick={() => setEditing(true)}
      >{displayedContent}</div>
      {displayedResult}
    </div>
}