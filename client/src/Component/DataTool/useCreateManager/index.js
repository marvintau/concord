import React, {useRef, useContext, useState} from 'react';

import {Exchange} from '../../Exchange';
import {DepRouterContext} from '../../DepRouter';

import './create-manager.css'

export default (sheetName, colSpecs) => {

  const [isCreating, setCreating] = useState(false);

  const {push, pull} = useContext(Exchange);
  const {currPage} = useContext(DepRouterContext);

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
      // pull([sheetName], currPage, true);
      setCreating(false);
    } else {
      formElem.current.classList.add('was-validated');
    }
  }

  elems.push(<button className="button" key="submit!" onClick={submit}>创建</button>)

  const createManager = isCreating ? <form className='create-form' ref={formElem}>{elems}</form> : <></>;

  const toggleCreate = () => {
    setCreating(!isCreating);
  }

  return {toggleCreate, isCreating, createManager};
}