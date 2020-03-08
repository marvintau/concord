import React, {useContext, useState} from 'react';

import {Spinner} from 'reactstrap';
import {RefDataContext, RefData} from '../RefData';
import UploadManager from '../UploadManager';
import TreeList from './TreeList';
import FlatList from './FlatList';
import Header from './Header';


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
    'DEAD_REFS_NOT_FOUND' : '没有找到引用表的数据，可能是您还没上传',
    'DEAD_DATA_NOT_FOUND' : '没有找到数据表的数据，可能是您还没上传',
    'DEAD_NOT_IMPL' : '服务器上没有对应数据的处理方法，请联系开发人员',
    'DEAD_PROC_ERROR' : '处理数据时发生了错误，请联系开发人员'
  }[status];
  return <div className="nodata-indicator">
    <div className="bad-icon" />
    <div style={{marginTop:'20px'}}>{text}</div>
  </div>
}


const TableComponent = ({name, desc, colSpecs}) => {
  const {refs, flat, status, refresh, setStatus} = useContext(RefDataContext);

  const [folded, setFold] = useState(true);

  let content;
  if (status.startsWith('DEAD')){
    content = <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    content = <LoadIndicator {...{status}} />
  } else if (status.startsWith('DONE')){
    if (folded){
      content = <TreeList {...{data:refs, status, colSpecs}} />;
    } else {
      content = <FlatList {...{data:flat, status, colSpecs}} />;
    }
  }

  return <div style={{display:'flex', flexDirection:"column", height:'100%', width:'100%'}}>
    <div className="upload-file-bar">
      {/* <ExportManager name={name} cols={cols}/> */}
      <UploadManager title={`上传${desc}Excel文件`} {...{name, refresh, setStatus}} />
      <button className='button' onClick={() => setFold(!folded)}>{folded ? '展开' : '收拢'}</button>
    </div>
    <Header {...{colSpecs, hidden: !status.startsWith('DONE')}} />
    {content}
  </div>

}

export default ({tableName, referredName, desc, colSpecs}) => {

  const props = {
    dataName: referredName,
    refsName: tableName,
    pathColumn: 'ccode_name',
  }
  
  return <div style={{margin:'0px 10px', height:'100%'}}>
    <RefData {...props}>
      <TableComponent {...{name:tableName, desc, colSpecs}} />
    </RefData>
  </div>
}