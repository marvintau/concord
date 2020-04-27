import React, { forwardRef, useContext } from "react";
import useContextMenu from 'react-use-context-menu'

import {DepRouterContext} from '../../DepRouter';

import Menu from './Menu';
import Cell from '../../Cell';

import './row.css'

export default (colSpecs, rowEdit, sheetName, {sticky=false, editable=true, push=e=>e, pull=e=>e}={}) => {
  
  return forwardRef(({ data, style, select}, ref) => {

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
        <ColRenderer {...{data, sheetName, colName:key, attr}} >{data[key]}</ColRenderer>
      </div>)
    }
    
    const {link} = data;
    const navigate = () => fore(link, data);

    const className = `list-row hovered ${sticky ? 'sticky' : ''} ${link ? 'row-cursor-pointer' : ''}`;
    const onClick = link ? navigate : select;

    return (rowEdit && editable)
    ? <div style={style} {...bindTrigger} {...{className, ref, onClick}}>
        {cols}
        <Menu {...{bindMenu, bindMenuItems, hideMenu, sheetName, data, rowEdit, push, pull}} />
      </div>
    : <div style={style} {...{className, ref, onClick}}>
        {cols}
      </div>
      
  });
}
