import React, {useContext} from 'react';
import TreeList, {ColRenderer as TreeCol, HistColRenderer as TreeHistCol, HeaderColRenderer as TreeHeaderCol} from '../Component/TreeList';
import FlatList, {HeaderColRenderer as FlatHeaderCol} from '../Component/FlatList';
import {RefCell, RefListContext, RefListProvider} from '../Component/RefCell';
import FileManager from '../Component/FileManager';

const TreeCols = {
  desc: {desc: '描述', width: 4, isSortable: true, isFilterable: true, },
  mb:   {desc: '期初', width: 2, isSortable: true, isFilterable: false,},
  mc:   {desc: '贷方', width: 2, isSortable: true, isFilterable: false,},
  md:   {desc: '借方', width: 2, isSortable: true, isFilterable: false,},
  me:   {desc: '期末', width: 2, isSortable: true, isFilterable: false,},
}
for (let key in TreeCols){
  Object.assign(TreeCols[key], {ColRenderer: TreeCol, HistColRenderer:TreeHistCol, HeaderColRenderer:TreeHeaderCol});
}

const RefCol = ({children: {index}}) => <RefCell index={index} />

const RefCols = {
  ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true, ColRenderer:RefCol, HeaderColRenderer:FlatHeaderCol}
}

const evalDict = {
  借方: 'md',
  贷方: 'mc',
  期初: 'mb',
  期末: 'me'
}

const RefList = () => {
  const {table} = useContext(RefListContext);
  const wrappedTable = table.map((_e, i) => ({ref: {index:i}}));
  return <FlatList data={wrappedTable} colSpecs={RefCols} />
}

export default ({table, referredTable}) => {
  
  const style={
    display:'flex',
    justifyContent: 'space-between',
    height:'100%',
    width:'100%',
    padding:'5px',
  }

  return <div style={{height:'100%'}}>
    <FileManager title='一个又一个的' upload={() => {}} data={{}} />
    <div style={style}>
      <RefListProvider {...{table, referredTable, pathColumn:'desc', evalColumnDict: evalDict}} >
        <RefList />
      </RefListProvider>
      <TreeList data={referredTable} colSpecs={TreeCols}/>
    </div>
  </div>
}