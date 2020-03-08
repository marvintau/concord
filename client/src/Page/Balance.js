import React from 'react';
import TreeList from '../Component/List/TreeList';
import ExportManager from '../Component/ExportManager';
import UploadManager from '../Component/UploadManager';
import {DataFetch} from '../Component/DataFetch';

const colSpecs = {
  ccode_name: {desc: '描述', width: 4, isSortable: true, isFilterable: true, },
  mb:   {desc: '期初', width: 2, isSortable: true, isFilterable: false,},
  mc:   {desc: '贷方', width: 2, isSortable: true, isFilterable: false,},
  md:   {desc: '借方', width: 2, isSortable: true, isFilterable: false,},
  me:   {desc: '期末', width: 2, isSortable: true, isFilterable: false,},
}

export default ({name, desc}) => {

  const cols = Object.fromEntries(Object.entries(colSpecs)
  .map(([k, {desc}]) => [k, desc]))

  return <div style={{margin: '0px 10px', height:'100%'}}>
    <DataFetch name={name} >
      <div className="upload-file-bar">
        <ExportManager name={name} cols={cols}/>
        <UploadManager title={`上传${desc}Excel文件`} name={name} />
      </div>
      <TreeList desc={desc} name={name} colSpecs={colSpecs} />
    </DataFetch>
  </div>
}