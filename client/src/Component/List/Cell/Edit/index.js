import React, {useContext} from 'react';

import { GrandExchangeContext } from '../../../GrandExchange';

import './edit.css';

export default ({sheetName, data, children, disabled}) => {

  const {addRec, remRec, addChild, evalSheet} = useContext(GrandExchangeContext);
  
  const {__path:path, __children} = data;

  const add = (sheetName, path) => {
    if (__children !== undefined){
      addRec(sheetName, path);
    } else {
      addChild(sheetName, path);
    }
    evalSheet(sheetName);
  }

  console.log(disabled, 'edit')

  return <div className="link">
    {disabled ? <></> : <div className="edit">
      <div className="remove" onClick={() => remRec(sheetName, path)} />
      <div className="insert" onClick={() => add(sheetName, path)} />
    </div>}
  </div>
  
}