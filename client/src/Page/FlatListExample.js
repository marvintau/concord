import React from 'react';
import List, {ColRenderer, HeaderColRenderer} from '../Component/FlatList';

const colSpecs = {
  name: {desc: '名称', width: 2, isSortable: false, isFilterable: false, ColRenderer, HeaderColRenderer},
  desc: {desc: '描述', width: 7, isSortable:  true, isFilterable:  true, ColRenderer, HeaderColRenderer},
  key:  {desc: '编号', width: 3, isSortable:  true, isFilterable:  true, ColRenderer, HeaderColRenderer}
}

export default ({data}) => <div style={{margin: '0px 10px', height:'100%'}}>
  <List data={data} colSpecs={colSpecs}/>
</div>
