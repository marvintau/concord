import React, {useRef, useContext, useState} from 'react';

import {Exchange} from '../../Exchange';

import './create-manager.css'

export default ({hidden, sheetName, colSpecs}) => {

  const [isCreating, setCreating] = useState(false);

  const {push} = useContext(Exchange);

  const formElem = useRef(null);

  const elems = [];

  for (let key in colSpecs) {
    const {cellType, desc} = colSpecs[key];
    if (!(cellType && cellType !== 'Text' && cellType !== 'Number')){
      elems.push(<div key={key}>
        <input className="form-control form-control-sm" name={key} placeholder={`输入${desc}`} required/>
        <div className="invalid-feedback">
          {`${desc}是必填的`}
        </div>
      </div>)
    }
  }

  const submit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (formElem.current.checkValidity()){
      const formData = new FormData(formElem.current)
      const rec = Object.fromEntries(formData.entries());
  
      console.log('creating record to', sheetName);

      push(sheetName, {type: 'ADD_REC', rec: {...rec, table: sheetName}});
      setCreating(false);

    } else {
      formElem.current.classList.add('was-validated');
    }
  }

  elems.push(<button className="button" key="submit!" onClick={submit}>创建</button>)

  const createManager = isCreating
  ? <form key='create-form' className='create-form' ref={formElem}>{elems}</form>
  : <div key='create-form'></div>;

  const toggleCreate = () => {
    setCreating(!isCreating);
  }

  const createManagerButton = hidden
  ? <div></div>
  : <button className='button' key='create-button' onClick={() => toggleCreate()}>
      {`${isCreating ? '取消' : ''}创建条目`}
    </button>

  return [createManagerButton, createManager];
}