import React, {useContext, useState, useEffect} from 'react';

import TreeList from './TreeList';

import DataTool from '../DataTool';

import Header from './Header';
import {Exchange} from '../Exchange';
import { DepRouterContext } from '../DepRouter';

import CreateRow from './Row';
import CreateFilterRow from './FilterRow';

import './list.css';

const flatten = (data) => {
  const stack = [...data];
  const res = [];
  while(stack.length) {
    const next = stack.shift();
    next.__children && stack.unshift(...next.__children);
    res.push(next);
  }
  return res;
}

// Due to the legacy code and convention (bootstrap grid), the width is represented
// in twelfths. However, as long as we are not going to give exact column width (in
// pixels), the conversion here is mandatory. Or the width "1" will be considered as 
// one twelfth pixel.
function attachColumnsWithWidth(colSpecs) {
  return Object.fromEntries(Object.entries(colSpecs).map(([k, v]) => {
    const {width} = v;
    return [k, {...v, width:`${(width/12*100)}%`}]
  }))
}

export default ({sheet, sheetName, status, colSpecs, rowEdit, isCascaded, tools}) => {

  const {updateSheets, setStatus, pull, push} = useContext(Exchange);
  const {currPage, currArgs} = useContext(DepRouterContext);
  // const {toggleCreate, isCreating, createManager} = useCreateManager(sheetName, colSpecs);

  // const {isCascaded, tools} = currPage;
  const [folded, setFold] = useState(true);

  // the cols state could be updated from two source. The first is triggered
  // by resizing the columns, and the second is when the original colSpecs
  // changed.
  // When using useState hook, changing the props that used for initializing
  // state won't lead the state automatically re-initialized, we have to use
  // an extra useEffect to reset the state.
  const [cols, setCols] = useState(attachColumnsWithWidth(colSpecs));
  useEffect(() => {
    setCols(attachColumnsWithWidth(colSpecs));
  }, [colSpecs])

  const setColWidth = (key, width) => {
    console.log(Object.values(cols).map(({width}) => width), 'widths');
    const col = {...cols[key], width};
    setCols({...cols, [key]: col})
  }

  const data = sheet ? sheet.data : [];

  const treeListProps = {
    Row: CreateRow(cols, rowEdit, sheetName),
    FilterRow: CreateFilterRow(cols),
    HistRow: CreateRow(cols, rowEdit, sheetName, {editable: false, push, pull}),
    itemData: (!isCascaded || !folded) ? flatten(data) : data,
    overscan: 40,
    initialItemHeight: 20,
    status
  }

  let toolButtonElems = [];
  let toolForms = [];

  for (let [toolName, tool] of Object.entries(DataTool)){

    let toolArgs = {
      hidden: !tools.includes(toolName),
      sheetName,
      colSpecs,
      setStatus,
      context:{...currPage, ...currArgs},
      refresh: updateSheets
    }
  
    const [button, elem] = tool(toolArgs);
    toolButtonElems.push(button);
    toolForms.push(elem);

  }

  return <div className="list-wrapper">
    <div className="upload-file-bar">
      <button className='button' onClick={() => setFold(!folded)}>{folded ? '展开' : '收拢'}</button>
      {toolButtonElems}
    </div>
    <div>
      {toolForms}
    </div>
    <Header {...{setColWidth, colSpecs, hidden: !status.startsWith('DONE')}} />
    <TreeList {...treeListProps} />
  </div>
}