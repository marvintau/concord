import React, {createContext, useContext, useState, useEffect} from 'react';
import FileManager from '../FileManager';
import FlatList, {HeaderColRenderer} from '../FlatList';

import './manage-list.css';

const ManageListContext = createContext({
  data: [],
  insert: () => {},
  remove: () => {}
})

const CreateRecordForm = ({colSpecs}) => {

  const {insert} = useContext(ManageListContext);

  const elems = [];
  for (let key in colSpecs) {
    elems.push(<div key={key} className="form-group" style={{marginBottom: '5px', width:'50%'}}>

      {/* to place validate */}

      <input name={key} className="form-control form-control-sm" placeholder={colSpecs[key].desc} required/>
    </div>);
  }

  const submit = (ev) => {
    ev.preventDefault();
    const formData = new FormData(ev.target);
    console.log(formData.get('name'))
    console.log(Object.fromEntries(formData.entries()));
    insert(0, Object.fromEntries(formData.entries()));
  }

  return <form style={{margin:'10px 0px'}} onSubmit={submit}>
    {elems}
    <button className="button" >添加</button>
  </form>
}

const ManageListProvider = ({initData, children}) => {

  const [data, setData] = useState(initData);

  const insert = (index, record) => {
    console.log('insert')
    data.splice(index, 0, record)
    setData([...data]);
  }

  const remove = (index) => {
    data.splice(index, 1)
    setData([...data]);
  }

  return <ManageListContext.Provider value={{data, insert, remove}}>
    {children}
  </ManageListContext.Provider>
}

const RemoveRenderer = ({index}) => {

  const {remove} = useContext(ManageListContext);

  return <div><button
    className="button hidden"
    style={{width:'100%'}}
    onClick = {() => remove(index)}
  >删除</button></div>
}

const ListRender = ({name, colSpecs}) => {

  const {data} = useContext(ManageListContext);
  const [isCreating, setCreating] = useState(false);

  const toggleCreating = () => {
    setCreating(!isCreating);
  }

  const fixedColSpecs = {...colSpecs,
    remove: {desc: '删除', width: 2, ColRenderer: RemoveRenderer}
  }

  return <div style={{height: '100%'}}>
    <div className="upload-file-bar">
      <button className="button" onClick={() => toggleCreating()}>新建{name}记录</button>
      <FileManager title={`批量上传${name}记录`} uploadURL={`/manage-list/${name}`} />
      <button className="button">下载Excel模版</button>
    </div>
    {isCreating && <CreateRecordForm colSpecs={colSpecs} />}
    <FlatList data={data} colSpecs={fixedColSpecs} />
  </div>
}

export default ({data, name, colSpecs}) => {
  return <ManageListProvider initData={data} >
    <ListRender {...{name, colSpecs}} />
  </ManageListProvider>
}