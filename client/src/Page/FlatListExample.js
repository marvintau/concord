import React from 'react';
import FlatList from '../Component/FlatList';
// import ManageList from '../Component/ManageList';
import {DataFetch} from '../Component/DataFetch';

const colSpecs = {
  name: {desc: '名称', width: 2, isSortable: false, isFilterable: false},
  desc: {desc: '描述', width: 5, isSortable:  true, isFilterable:  true},
  key:  {desc: '编号', width: 3, isSortable:  true, isFilterable:  true}
}

export default ({data}) => <div style={{margin: '0px 10px', height:'100%'}}>
  <DataFetch initData={data}>
    <FlatList name="好哇" colSpecs={colSpecs} />
  </DataFetch>
</div>
