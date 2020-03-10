import React, {useContext, useState} from 'react';

import {Spinner} from 'reactstrap';
import {RefDataContext, RefData} from '../RefData';
import {DataContext, Data} from '../Data';
import UploadManager from './UploadManager';
import TreeList from './TreeList';
import FlatList from './FlatList';
import useCreateManager from './useCreateManager';
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


const RefTableComp = ({name, desc, colSpecs}) => {
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

const DataTableComp = ({name, desc, colSpecs}) => {
  const {data, status, refresh, setStatus, push} = useContext(DataContext);
  console.log(status, 'status');

  const {toggleCreate, isCreating, createManager} = useCreateManager(colSpecs);

  let content;
  if (status.startsWith('DEAD')){
    content = <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    content = <LoadIndicator {...{status}} />
  } else if (status.startsWith('DONE')){
    content = <FlatList {...{data, status, colSpecs}} />;
  }

  return <div style={{display:'flex', flexDirection:"column", height:'100%', width:'100%'}}>
    <div className="upload-file-bar">
      {/* <ExportManager name={name} cols={cols}/> */}
      <UploadManager title={`上传${desc}Excel文件`} {...{name, refresh, setStatus}} />
      {/* <button className='button' onClick={() => setFold(!folded)}>{folded ? '展开' : '收拢'}</button> */}
      <button className='button' onClick={() => toggleCreate()}>{!isCreating ? '创建新条目' : '取消创建'}</button>
      <button className={status === 'DONE_MODIFIED' ? 'button warning' : 'button'} onClick={() => push()}>更新</button>
    </div>
    <div>
      {createManager}
    </div>
    <Header {...{colSpecs, hidden: !status.startsWith('DONE')}} />
    {content}
  </div>

}

export default ({type, ...restProps}) => {

  if (type === 'REFT'){

    const {referredName, tableName, pathColumn="ccode_name", desc, colSpecs} = restProps;

    const props = {
      dataName: referredName,
      refsName: tableName,
      pathColumn
    }

    return <div style={{margin:'0px 10px', height:'100%'}}>
      <RefData {...props}>
        <RefTableComp {...{name:tableName, desc, colSpecs}} />
      </RefData>
    </div>
  } else if (type === 'DATA') {

    const {tableName, dataType, desc, colSpecs} = restProps;

    return <div style={{margin:'0px 10px', height:'100%'}}>
      <Data {...{name:tableName, dataType}}>
        <DataTableComp {...{name:tableName, desc, colSpecs}} />
      </Data>
    </div>
  } else {
    console.log(type, restProps);
    return <></>
  }
}