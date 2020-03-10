import React, {useState} from 'react';
import {Input, Button, Col} from 'reactstrap';

import './filter.css'

const HIST_LINE_HEIGHT = 30;

const ident = e => e;

const FilterContainer = ({children, topLength}) => {
  
  const style = {
    top: topLength * HIST_LINE_HEIGHT,
    height: 40,
  }
  
  return <div className="filter-row sticky" style={style}>{children}</div>
}

const FilterCol = ({colKey, isFilterable, filterCol, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');
  console.log(inputVal, 'filter');
  const FilterComp = <div style={{display:'flex', width: '100%', maxWidth: '500px'}}>
    <Input className="filter-input" bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyPress={(e) => {
      if (e.key === 'Enter') filterCol(colKey, inputVal);
    }} />
  </div>

  return <Col {...colProps} >
    {isFilterable && FilterComp}
  </Col>
}

export default (colSpecs) => {
  if(Object.values(colSpecs).every(({isFilterable}) => !isFilterable)){
    return undefined;
  }

  return ({topLength, filterCol}) => {

    const cols = [];
    for (let key in colSpecs){
      const {width, isFilterable} = colSpecs[key];
      cols.push(<FilterCol md={width} key={key} {...{colKey:key, isFilterable, filterCol}} />)
    }
  
    return <FilterContainer topLength={topLength}>
      {cols}
    </FilterContainer>
  }
}