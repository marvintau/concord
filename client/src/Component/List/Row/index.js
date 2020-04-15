import React, { memo, forwardRef, useContext } from "react";
import {areEqual} from 'react-window';
import useContextMenu from 'react-use-context-menu'

import {DepRouterContext} from '../../DepRouter';

import Menu from './Menu';
import Cell from '../../Cell';

import './row.css'

export default (colSpecs, rowEdit, sheetName, {sticky=false, editable=true}={}) => {
  
  return memo(forwardRef(({ data, style, select}, ref) => {

    const {fore} = useContext(DepRouterContext);

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
    
    const {link} = data;
    const navigate = () => fore(link, data);

    const className = `list-row hovered ${sticky ? 'sticky' : ''} ${link ? 'row-cursor-pointer' : ''}`;
    const onClick = link ? navigate : select;

    return (rowEdit && editable)
    ? <div {...bindTrigger} {...{ref, className, style, onClick}}>
        {cols}
        <Menu {...{bindMenu, bindMenuItems, hideMenu, sheetName, data, rowEdit}} />
      </div>
    :  <div {...{ref, className, style, onClick}}>
        {cols}
      </div>
  }), areEqual);
}
