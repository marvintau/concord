import React from 'react';
import Cell from '../Cell';

import './doc.css'

export default ({colSpecs, data, sheetName}) => {
  
  const cols = [];
  for (let key in colSpecs){
    const {desc, cellType:type='Text'} = colSpecs[key];
    const ColRenderer = Cell[type];
    cols.push(<div className="item" key={key}>
      <div className="col-name">{desc}</div>
      <ColRenderer data={data} sheetName={sheetName} colName={key} isMobile={true}>{data[key]}</ColRenderer>
    </div>)
  }
  
  return <div className='doc-container'>
    {cols}
  </div>
}
