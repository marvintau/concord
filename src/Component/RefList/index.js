import React, {forwardRef, useState, useContext} from 'react';
import {Col, Input, Button} from 'reactstrap';
import {DynamicSizeList as List} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import {RefListContext, RefListProvider} from './reflist-context';
import RefCell from './refcell';

import FilterIcon from './filter.svg';

import './ref-list.css';

const Row = forwardRef(({index, style}, ref) => {
  return <div ref={ref} className='treelist-row hovered' style={style}>
    <RefCell {...{index}} />
  </div>
})

const FilterRow = () => {

  const [inputVal, setInputVal] = useState('');
  const {filter} = useContext(RefListContext);

  return <div className="reflist-filter-row sticky" style={{top:'0', height: '40px'}}>
    <Col sm="12" style={{display:'flex', margin:'0.5rem'}}>
      <Input bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
      <Button color="warning" size="sm" style={{marginLeft:'0.5rem'}} onClick={() => filter(inputVal)}>
        <img alt="filter-button" style={{height:'1rem'}} src={FilterIcon} />
      </Button>
    </Col>
  </div>
}

const TableBodyRenderer = ({colSpecs}) => {

  const {filtered} = useContext(RefListContext);

  return <div style={{height:'100%'}}>
    <AutoSizer>
    {({height, width}) => {
      return <List {...{height, width, itemData:filtered, itemCount:filtered.length}}>
        {Row}
      </List>
    }}
    </AutoSizer>  
  </div>
}

export default ({table, referredTable, pathColumn, evalColumnDict, colSpecs}) => {

  return <div style={{display:'flex', flexDirection:"column", width:'50%'}}>
    <div className="reflist-header"><Col md="12"><div style={{margin:'0.5rem'}}>项目</div></Col></div>
    <FilterRow />
    <RefListProvider {...{table, referredTable, pathColumn, evalColumnDict}}>
      <TableBodyRenderer {...{colSpecs}} />
    </RefListProvider>
  </div>
}