import React, {useContext} from 'react';
import TreeList from '../Component/TreeList';
import FlatList from '../Component/FlatList';
import {RefCell, RefListContext, RefListProvider} from '../Component/RefCell';
import FileManager from '../Component/FileManager';

const TreeCols = {
  desc: {desc: '描述', width: 4, isSortable: true, isFilterable: true, },
  mb:   {desc: '期初', width: 2, isSortable: true, isFilterable: false,},
  mc:   {desc: '贷方', width: 2, isSortable: true, isFilterable: false,},
  md:   {desc: '借方', width: 2, isSortable: true, isFilterable: false,},
  me:   {desc: '期末', width: 2, isSortable: true, isFilterable: false,},
}

const RefCol = ({children: {index}}) => <RefCell index={index} />

const refCols = {
  ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true}
}

const evalDict = {
  借方: 'md',
  贷方: 'mc',
  期初: 'mb',
  期末: 'me'
}

const RefList = ({colSpecs}) => {
  const {table} = useContext(RefListContext);
  const wrappedTable = table.map((_e, i) => ({ref: {index:i}}));

  for (let key in colSpecs){
    colSpecs[key].ColRenderer = RefCol;
  }

  return <FlatList data={wrappedTable} colSpecs={colSpecs} />
}

export default ({table, referredTable}) => {

  return <div style={{height:'100%'}}>
    <div className="bar">
      <FileManager title="上传现金流表模版" uploadURL='/upload/ref-list/cashflow-statement' />
    </div>
    <div className="sideby">
      <RefListProvider {...{table, referredTable, pathColumn:'desc', evalColumnDict: evalDict}} >
        <RefList colSpecs={refCols}/>
      </RefListProvider>
      <TreeList data={referredTable} colSpecs={TreeCols}/>
    </div>
  </div>
}