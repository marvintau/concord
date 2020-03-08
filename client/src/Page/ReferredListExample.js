import React, {useContext, useState} from 'react';

import {RefDataContext, RefData} from '../Component/RefData';
import UploadManager from '../Component/UploadManager';
import TreeList from '../Component/TreeList';
import FlatList from '../Component/FlatList';

const TableContent = ({name, desc, colSpecs}) => {
  const {data, refs, flat, status, refresh, setStatus} = useContext(RefDataContext);

  const [folded, setFold] = useState(true);

  const foldedTable = <TreeList {...{data:refs, status, colSpecs}} />;
  const spreadTable = <FlatList {...{data:flat, status, colSpecs}} />;

  return <>
    <div className="upload-file-bar">
      {/* <ExportManager name={name} cols={cols}/> */}
      <UploadManager title={`上传${desc}Excel文件`} {...{name, data, refresh, setStatus}} />
      <button className='button' onClick={() => setFold(!folded)}>{folded ? '展开' : '收拢'}</button>
    </div>
    {folded ? foldedTable : spreadTable}
  </>
}

export default ({tableName, referredName, desc, colSpecs}) => {

  const props = {
    dataName: referredName,
    refsName: tableName,
    pathColumn: 'ccode_name',
  }
  
  return <div style={{margin:'0px 10px', height:'100%'}}>
    <RefData {...props}>
      <TableContent {...{name:tableName, desc, colSpecs}} />
    </RefData>
  </div>
}