import React, {useContext, useState} from 'react';

import {Spinner} from 'reactstrap';
import TreeList from './TreeList';
import FlatList from './FlatList';
import UploadManager from './UploadManager';
import useCreateManager from './useCreateManager';
import Header from './Header';
import {GrandExchangeContext} from '../GrandExchange';
import { DepRouterContext } from '../DepRouter';


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

export default ({sheet, status, name, desc, colSpecs}) => {
  
  const {addSheets, setStatus} = useContext(GrandExchangeContext);
  const {currPage} = useContext(DepRouterContext);

  const [folded, setFold] = useState(true);
  
  let content;
  if (status.startsWith('DEAD')){
    content = <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    content = <LoadIndicator {...{status}} />
  } else if (status.startsWith('DONE')){
    const {data} = sheet;
    console.log(data, 'list')
    if (folded){
      content = <TreeList {...{sheetName:name, data, status, colSpecs}} />;
    } else {
      content = <FlatList {...{sheetName:name, data:flatten(data), status, colSpecs}} />;
    }
  }

  return <div style={{display:'flex', flexDirection:"column", height:'100%', width:'100%'}}>
    <div className="upload-file-bar">
      <button className='button' onClick={() => setFold(!folded)}>{folded ? '展开' : '收拢'}</button>
      {/* <ExportManager name={name} cols={cols}/> */}
      <UploadManager title={`上传${desc}Excel文件`} {...{name, refresh:addSheets, setStatus, context:currPage}} />
    </div>
    <Header {...{colSpecs, hidden: !status.startsWith('DONE')}} />
    {content}
  </div>
}