import React, {useState} from 'react';

import Autosuggest from 'react-autosuggest';

import './react-autosuggest.css';

export default ({
  expr='',
  disabled,
  placeholder,
  getSuggs=()=>['未指定getSugg函数'],
  getSuggValue=()=>'未指定getSuggValue',
  saveEdit=()=>{}
}) => {
  
  const [value, setValue] = useState(expr.toString());
  const [delayed, setDelayed] = useState(false);
  const [suggestions, setSugg] = useState([]);

  const updateSugg = (value) => {
    setDelayed(false);
    const suggs = getSuggs(value);
    setSugg(suggs);
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
    getSuggestionValue(sugg){
      return getSuggValue(value, sugg)
    },
    renderSuggestion(sugg){
      if (sugg && sugg.desc && sugg.desc.split(' - ').length > 1) {
        return <div style={{display:'flex', justifyContent:'space-between', margin:'2px'}}>
          {sugg.desc.split(' - ').map((e, i) => <div key={i}>{e}</div>)}
        </div>
      } else {
        return <div style={{margin:'2px'}}>{sugg.desc || sugg.toString()}</div>
      }
    },
    onSuggestionsFetchRequested,
    onSuggestionsClearRequested(){
      setSugg([])
    },
    onSuggestionSelected(e, {suggestionValue}){
      e.preventDefault();
      e.stopPropagation();
      setValue(suggestionValue);
      setSugg([]);
    },
  }

  const inputProps = {
    placeholder,
    value,
    disabled,
    onChange(e, {newValue}){
      e.preventDefault();
      e.stopPropagation();
      setValue(newValue);
    },
    onKeyUp(e){
      if (e.nativeEvent.key === 'Enter'){
        console.log(suggestions.length, 'Enter pressed')
        if (suggestions.length === 0){
          e.preventDefault();
          e.stopPropagation();
          saveEdit(value);
        }
      }
    },
    onClick(e){
      console.log('clicked');
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return <Autosuggest {...{...funcs, suggestions, inputProps}} />
}