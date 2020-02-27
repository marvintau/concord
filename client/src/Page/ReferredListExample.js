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

const RefCol = ({children: {index}}) =>
  <RefCell index={index} />

const refCols = {
  ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true, }
}

const RefList = ({colSpecs}) => {
  const {table} = useContext(RefDataContext);
  const wrappedTable = table.map((_e, i) => ({ref: {index:i}}));

  for (let key in colSpecs){
    colSpecs[key].ColRenderer = RefCol;
  }

  return <FlatList data={wrappedTable} colSpecs={colSpecs} />
}

const evalColumnDict = {
  借方: 'md',
  贷方: 'mc',
  期初: 'mb',
  期末: 'me'
}

const TableContent = ({name, desc}) => {
  const {data, refs, status, refresh, setStatus} = useContext(RefDataContext);

  return <>
    <div className="upload-file-bar">
      {/* <ExportManager name={name} cols={cols}/> */}
      <UploadManager title={`上传${desc}Excel文件`} {...{name, data, refresh, setStatus}} />
    </div>
    <TreeList {...{data, status, colSpecs:TreeCols}} />
  </>
}

export default ({name, referredTableName, desc}) => {

  const props = {
    dataName: referredTableName,
    refsName: name,
    pathColumn: 'ccode_name',
    evalColumnDict,
  }
  
  return <div style={{margin:'0px 10px', height:'100%'}}>
    <RefData {...props}>
      <TableContent {...{name, desc}} />
    </RefData>
  </div>
}