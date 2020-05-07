import React, {useContext, useState} from 'react';

import {Spinner} from 'reactstrap';
import TreeList from './TreeList';
import UploadManager from './UploadManager';
import GenerateTemplate from './GenerateTemplate';
import useCreateManager from './useCreateManager';
import ExportManager from './ExportManager';
import Header from './Header';
import {Exchange} from '@marvintau/exchange';
import { DepRouterContext } from '../DepRouter';

import CreateRow from './Row';
import CreateFilterRow from './FilterRow';

import './list.css';

const LoadIndicator = ({status}) => {
  const text = {
    'PUSH': '更新',
    'PULL': '载入'
  }[status];
  return <div className="nodata-indicator">
    <Spinner color="info" />
    <div style={{marginTop:'20px'}}>正在{text}数据...</div>
  </div>
};

const ErrorIndicator = ({status}) => {
  const text = {
    'DEAD_LOAD' : '网络错误，请刷新重试，或联系开发人员',
    'DEAD_INFO' : '未指定数据和远程地址。请联系开发人员',
    'DEAD_NOT_FOUND' : '没有找到数据，可能是您还没上传',
    'DEAD_NOT_IMPL' : '服务器上没有对应数据的处理方法，请联系开发人员',
    'DEAD_PROC_ERROR' : '处理数据时发生了错误，请联系开发人员'
  }[status];
  return <div className="nodata-indicator">
    <div className="bad-icon" />
    <div style={{marginTop:'20px'}}>{text}</div>
  </div>
}

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

export default ({sheet, status, sheetName, desc, colSpecs, rowEdit}) => {
  
  const {addSheets, setStatus, pull, push} = useContext(Exchange);
  const {currPage, currArgs} = useContext(DepRouterContext);
  const {toggleCreate, isCreating, createManager} = useCreateManager(sheetName, colSpecs);

  const {isCascaded, tools} = currPage;
  const [folded, setFold] = useState(true);
  
  // Due to the legacy code and convention (bootstrap grid), the width is represented
  // in twelfths. However, as long as we are not going to give exact column width (in
  // pixels), the conversion here is mandatory. Or the width "1" will be considered as 
  // one twelfth pixel.
  const newCols = Object.fromEntries(Object.entries(colSpecs).map(([k, v]) => {
    const {width} = v;
    return [k, {...v, width:`${(width/12*100)}%`}]
  }))
  const [cols, setCols] = useState(newCols);

  const setColWidth = (key, width) => {
    console.log(Object.values(cols).map(({width}) => width), 'widths');
    const col = {...cols[key], width};
    setCols({...cols, [key]: col})
  }

  let content;
  if (status.startsWith('DEAD')){
    content = <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    content = <LoadIndicator {...{status}} />
  } else if (status.startsWith('DONE')){
    const {data} = sheet;

    const Row = CreateRow(cols, rowEdit, sheetName);
    const FilterRow = CreateFilterRow(cols)
    const HistRow = CreateRow(cols, rowEdit, sheetName, {editable: false, push, pull})

    content = <TreeList {...{Row, FilterRow, HistRow, itemData: (!isCascaded || !folded) ? flatten(data) : data}} />;

  }

  const save = () => {
    push(sheetName, {type:'DATA', data: sheet.data, ...currArgs});
  }

  let toolElems = [];
  for (let tool of tools){
    if (tool === 'ImportExcel'){
      console.log(`${sheetName} before passing into upload manager`)
      let props = {name:sheetName, refresh:addSheets, setStatus, context:{...currPage, ...currArgs}};
      toolElems.push(<UploadManager key={tool} title={`上传${desc}Excel文件`} {...props} />);
    }
    if (tool === 'HeaderCreate'){
      toolElems.push(<button key={tool}
        className='button'
        onClick={() => toggleCreate()}
      >{`${isCreating ? '取消' : ''}创建${desc}条目`}
      </button>)
    }
    if (tool === 'SaveRemote'){
      toolElems.push(<button key="saveRemote"
        className='button warning'
        onClick={() => save()}
      >保存至服务器</button>)
    }
    if (tool === 'ExportExcel'){
      toolElems.push(<ExportManager key={tool} {...{name:sheetName, colSpecs}}/>);
    }
    if (tool === 'GenerateTemplate') {
      toolElems.push(<GenerateTemplate key={tool} {...currArgs} />)
    }
  }

  return <div className="list-wrapper">
    <div className="upload-file-bar">
      {isCascaded && <button className='button' onClick={() => setFold(!folded)}>{folded ? '展开' : '收拢'}</button>}
      {toolElems}
    </div>
    <div>
      {createManager}
    </div>
    <Header {...{setColWidth, colSpecs, hidden: !status.startsWith('DONE')}} />
    {content}
  </div>
  // return content
}