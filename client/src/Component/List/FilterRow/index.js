import React, {useState} from 'react';
import {Input, Button, Col} from 'reactstrap';

import FilterIcon from './filter.svg';
import SortIcon from './sort-ascending.svg';
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

const FilterCol = ({colKey, isFilterable, isSortable, sort=ident, filter=ident, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');

  const colStyle = {
    display:'flex',
  }

  const FilterComp = <div style={{display:'flex'}}>
    <Input bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
    <Button color="warning" size="sm" style={{marginLeft:'0.5rem'}} onClick={() => filter(colKey, inputVal)}>
      <img alt="filter-button" style={{height:'1rem'}} src={FilterIcon} />
    </Button>
  </div>

  return <Col style={colStyle} {...colProps} >
    {isFilterable && FilterComp}
    {isSortable && <Button color="warning" size="sm" onClick={() => {sort(colKey)}} style={{marginLeft:'0.5rem'}}>
        <img alt="sort-button" style={{height:'1rem'}} src={SortIcon} />
      </Button>}
  </Col>
}

export default (colSpecs) => {
  console.log(colSpecs, 'filter')
  let isNothing = Object.values(colSpecs).every(({isSortable, isFilterable}) => !(isSortable || isFilterable));
  if(isNothing){
    return undefined;
  }

  const cols = [];
  for (let key in colSpecs){
    const {width, isSortable, isFilterable} = colSpecs[key];
    cols.push(<FilterCol md={width} key={key} colKey={key} isSortable={isSortable} isFilterable={isFilterable} />)
  }

  return ({topLength}) => 
    <FilterContainer topLength={topLength}>
      {cols}
    </FilterContainer>
  }