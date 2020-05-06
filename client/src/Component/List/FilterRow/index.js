import React, {useState} from 'react';
import {Input} from 'reactstrap';

import './filter.css'

const FilterCol = ({colKey, isFilterable, filterCol, width, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');

const FilterComp = <div style={{display:'flex', width: '100%'}}>
    <Input className="filter-input" bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyPress={(e) => {
      if (e.key === 'Enter') filterCol(colKey, inputVal);
    }} />
  </div>

  return <div style={{width, flexShrink: 0, padding:'0px 5px'}} {...colProps} >
    {isFilterable && FilterComp}
  </div>
}

export default (colSpecs) => {
  if(Object.values(colSpecs).every(({isFilterable}) => !isFilterable)){
    return () => <div className="filter-row"></div>;
  }

  return ({filterCol}) => {

    const cols = [];
    for (let key in colSpecs){
      const {width, isFilterable} = colSpecs[key];
      cols.push(<FilterCol key={key} {...{colKey:key, isFilterable, filterCol, width}} />)
    }
  
    return <div className="filter-row">{cols}</div>
  }
}