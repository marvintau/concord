import React, { memo, forwardRef } from "react";
import {areEqual} from 'react-window';
import useContextMenu from 'react-use-context-menu'

import Menu from './Menu';
import Cell from '../../Cell';

import './row.css'

export default (colSpecs, sheetName, {sticky=false}={}) => {
  
  return memo(forwardRef(({ data, style, select}, ref) => {

    const [
      bindMenu,
      bindMenuItems,
      useContextTrigger,
      {setVisible}
    ] = useContextMenu();
    
    const [bindTrigger] = useContextTrigger();
    const hideMenu = () => setVisible(false);

    const cols = [];
    for (let key in colSpecs){
      const {width, cellType:type='Text', attr} = colSpecs[key];
      const ColRenderer = Cell[type];
      cols.push(<div className='list-col' key={key} style={{width}}>
        <ColRenderer data={data} sheetName={sheetName} colName={key} attr={attr}>{data[key]}</ColRenderer>
      </div>)
    }
    
    return <div {...bindTrigger} ref={ref} className={`list-row hovered ${sticky ? 'sticky' : ''}`} style={style} onClick={select}>
      {cols}
      <Menu {...{bindMenu, bindMenuItems, hideMenu, data}} />
    </div>
  }), areEqual);
}
