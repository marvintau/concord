import React, {useState} from 'react';
import {Resizable as Resz} from 're-resizable';

import './header.css';

const HeaderCol = ({colKey, width:initWidth, children, setColWidth=e=>e}) =>{

  const [width, setHeaderWidth] = useState(`${(initWidth/12*100)}%`);

  return <Resz
    size={{width}}
    className={`list-header-col`}
    onResizeStop={(e, direction, ref, d) => {
      const {width} = getComputedStyle(ref);
      setHeaderWidth(width + d.width);
      setColWidth(colKey, width);
    }}
    enable={{ top:false, right:true, bottom:false, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false}}
  ><div className="list-header-col-inner">{children}</div>
  </Resz>;
}
export default ({colSpecs, hidden, setColWidth}) => {

  const actualCols = hidden ? {none:{width:12}} : colSpecs;

  const cols = [];
  for (let key in actualCols){
    const {width, desc, HeaderColRenderer=HeaderCol, noBackground} = actualCols[key];

    cols.push(<HeaderColRenderer
      key={key}
      colKey={key}
      width={width}
      noBack={noBackground}
      setColWidth={setColWidth}
    >{desc}</HeaderColRenderer>)
  }

  return <div className="list-header">
    {cols}
  </div>
}
