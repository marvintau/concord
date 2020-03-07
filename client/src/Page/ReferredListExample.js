import React, {useContext} from 'react';
// import TreeList from '../Component/TreeList';
import RefCell from '../Component/RefCell';
import FlatList from '../Component/FlatList';
import {RefDataContext, RefData} from '../Component/RefData';
import UploadManager from '../Component/UploadManager';
import TreeList from '../Component/TreeList';

const TreeCols = {
  desc: {desc: '描述', width: 4, isSortable: true, isFilterable: true, },
  mb:   {desc: '期初', width: 2, isSortable: true, isFilterable: false,},
  mc:   {desc: '贷方', width: 2, isSortable: true, isFilterable: false,},
  md:   {desc: '借方', width: 2, isSortable: true, isFilterable: false,},
  me:   {desc: '期末', width: 2, isSortable: true, isFilterable: false,},
}

const RefCol = ({children}) =>{
  return <RefCell data={children} />
}

const refCols = {
  ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true, ColRenderer:RefCol, HistColRenderer: RefCol}
}

const TableContent = ({name, desc}) => {
  const {data, refs, status, refresh, setStatus} = useContext(RefDataContext);

  return <>
    <div className="upload-file-bar">
      {/* <ExportManager name={name} cols={cols}/> */}
      <UploadManager title={`上传${desc}Excel文件`} {...{name, data, refresh, setStatus}} />
    </div>
    <TreeList {...{data:refs, status, colSpecs:refCols}} />
  </>
}

export default ({name, referredTableName, desc}) => {

  const props = {
    dataName: referredTableName,
    refsName: name,
    pathColumn: 'ccode_name',
  }
  
  return <div style={{margin:'0px 10px', height:'100%'}}>
    <RefData {...props}>
      <TableContent {...{name, desc}} />
    </RefData>
  </div>
}