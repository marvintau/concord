import React, {useState} from 'react';
import {Input} from 'reactstrap';

import './filter.css'

const FilterCol = ({colKey, isFilterable, isSortable, filterCol, sortCol, width, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');

  const SortComp = <div className="sort-button" onClick={() => sortCol(colKey)}>排序</div>;
  console.log(isSortable, 'isSortable')

  const FilterComp = <Input className="filter-input" bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyPress={(e) => {
    if (e.key === 'Enter') filterCol(colKey, inputVal);
  }} />;

  return <div style={{width, flexShrink: 0, padding:'0px 5px'}} {...colProps} >
    <div style={{display:'flex', width: '100%'}}>
      {isFilterable && FilterComp}
      {isSortable && SortComp}
    </div>
  </div>
}

export default (colSpecs) => {
  if(Object.values(colSpecs).every(({isFilterable}) => !isFilterable)){
    return () => <div className="filter-row"></div>;
  }

  return ({filterCol, sortCol}) => {

    const cols = [];
    for (let key in colSpecs){
      const {width, isFilterable, isSortable} = colSpecs[key];
      cols.push(<FilterCol key={key} {...{colKey:key, isFilterable, isSortable, filterCol, sortCol, width}} />)
    }
  
    return <div className="filter-row">{cols}</div>
  }
}