import React, {useState, useContext} from 'react';

// import {RefDataContext} from '../../../RefData';

import Autosuggest from 'react-autosuggest';
import {Input} from 'reactstrap';

import Check from './check.svg';

import './react-autosuggest.css';
import './refcell.css';

const level = (header) => {
  return header.split('#').length - 1;
}

const rem = (header) => {
  return header.replace(/#/g, '');
}


// const getSuggValue = (inputPath, sugg) => {
//   return inputPath.replace(/(?<=[$/])([^$/]*)$/, sugg);
// }

// const getRef = (path, pathColumn, data) => {
//   let list = data, ref;
//   for (let seg of path) {
//     ref = list.find(({[pathColumn]: pathCol}) => pathCol === seg);
//     if (ref === undefined) break;
//     list = ref.children;
//   }
//   return ref;
// }

// // This handles auto-completing path
// const getPathSugg = (path, pathColumn, data) => {
//   const splitted = path.split('/').slice(1);
  
//   if (splitted.length === 0){
//     return data.map(({[pathColumn]:col}) => `${col}`);
//   }
  
//   const ref = getRef(splitted, pathColumn, data);
//   if (ref !== undefined){
//     return ref.children.map(({[pathColumn]:pathCol}) => `${pathCol}`);
//   }

//   return [];
// }


export default ({colName, disabled, children: cellData, data:{path}}) => {

  console.log(cellData);

  const {item, expr, result, status} = cellData;
  
  const [editing, setEditing] = useState()
  const [desc, setDesc] = useState(item);
  const [value, setValue] = useState(expr);
  // const [suggestions, setSugg] = useState([]);

  // const getSugg = (input) => {
  //   // if the input matches the non-slash-non-semicolon substring in the end,
  //   // this is an incomplete path, so we remove the last incomplete segment
  //   // of path, and get the possible candidates.
  //   if (input.match(/[/][^$/]*$/)) {
  //     const lastSeg = input.split('/').slice(-1)[0];
  //     const mostPart = input.replace(/[/][^$/]*$/, '');
  //     return getPathSugg(mostPart, pathColumn, data).filter(cand => cand.includes(lastSeg));

  //   }

  //   return [];
  // }


  // // the method below will be directly used by Autosuggest
  // // check: https://github.com/moroshko/react-autosuggest
  // const funcs = {
  //   getSuggestionValue : (sugg) => getSuggValue(value, sugg),
  //   renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
  //   onSuggestionsFetchRequested : ({ value }) => setSugg(getSugg(value)),
  //   onSuggestionsClearRequested : () => setSugg([]),
  //   onSuggestionSelected : (e, {suggestionValue}) => {
  //     setValue(suggestionValue);
  //   },
  // }

  // const inputProps = {
  //   value,
  //   id: 'sugg-input',
  //   onChange:(e, {newValue}) => {
  //     setValue(newValue);
  //   }
  // }

  // const saveEdit = (e) => {
  //   // setCol(path, colName, {item:desc, expr:value})
  //   setEditing(false);
  // }

  const displayed = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2})
  : result

  // const id = `ID${Math.random().toString(36).substring(2)}`

  const displayedResult = result !== undefined
  ? <div className={`refcell-badge ${status.toLowerCase()}`}>
      {displayed}
    </div>
  : <></>

  const displayedContent = !item.startsWith('#')
  ? <span className='expr'>{expr}</span>
  : <span className={`header-${level(item)}`}>{rem(item)}</span>;

  // return editing
  // ? <div className="refcell-line">
  //     <Input placeholder="在这里修改描述" style={{height: '28.5px', marginRight: '5px'}} value={desc} onChange={(e) => setDesc(e.target.value)} />
  //     <Autosuggest {...{...funcs, suggestions, inputProps}} />
  //     <img className='refcell-button' src={Check} onClick={saveEdit} />
  //   </div>
  // : <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
  //     <div className="react-autosuggest__input refcell-text"
  //       onClick={() => {(!disabled) && setEditing(true)}}
  //     >{displayedContent}</div>
  //     {displayedResult}
  //   </div>

  return <div className={`refcell-line ${editing ? "refcell-line-editing" : ''}`}>
    <div className="react-autosuggest__input refcell-text"
      onClick={() => {(!disabled) && setEditing(true)}}
    >{displayedContent}</div>
    {displayedResult}
  </div>

  return <></>
}