import React, {useContext, useState} from 'react';
import UploadManager from '../UploadManager';
import ExportManager from '../ExportManager';
import FlatList from '../FlatList';

import {DataFetchContext} from '../DataFetch';

import './manage-list.css';

// const CreateRecordForm = ({colSpecs}) => {

//   const {insert} = useContext(DataFetchContext);

//   const elems = [];
//   for (let key in colSpecs) {
//     elems.push(<div key={key} className="form-group" style={{marginBottom: '5px', width:'50%'}}>

//       {/* to place validate */}

//       <input name={key} className="form-control form-control-sm" placeholder={colSpecs[key].desc} required/>
//     </div>);
//   }

//   const submit = (ev) => {
//     ev.preventDefault();
//     const formData = new FormData(ev.target);
//     console.log(formData.get('name'))
//     console.log(Object.fromEntries(formData.entries()));
//     insert(0, Object.fromEntries(formData.entries()));
//   }

//   return <form style={{margin:'10px 0px'}} onSubmit={submit}>
//     {elems}
//     <button className="button" >添加</button>
//   </form>
// }

const ToolsRenderer = ({index}) => {

  const {remove} = useContext(DataFetchContext);

  return <div className="manage-tools">
    <button
      className="button hidden"
      style={{width:'100%'}}
      onClick = {() => remove(index)}
    >删除</button>
  </div>
}

export default ({name, desc, colSpecs}) => {

  const {data} = useContext(DataFetchContext);
  const [isCreating, setCreating] = useState(false);

  const toggleCreating = () => {
    setCreating(!isCreating);
  }

  const fixedColSpecs = {...colSpecs,
    remove: {desc: '删除', width: 2, ColRenderer: ToolsRenderer, noBackground: true}
  }

  const cols = Object.fromEntries(Object.entries(colSpecs)
    .map(([k, {desc}]) => [k, desc]))

  return <div style={{height: '100%'}}>
    <div className="upload-file-bar">
      <ExportManager name={name} cols={cols}/>
      <UploadManager title={`上传${desc}Excel文件`} name={name} />
      <button className="button">下载Excel模版</button>
    </div>
    <FlatList data={data} colSpecs={fixedColSpecs} />
  </div>
}