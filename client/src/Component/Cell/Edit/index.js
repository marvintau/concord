import React, {useContext} from 'react';

import { GrandExchangeContext } from '../../GrandExchange';
import { DepRouterContext } from '../../DepRouter';

import './edit.css';

export default ({sheetName, data, attr, disabled}) => {

  const {push, pull, addChildRec, remRec, addSiblyRec, evalSheet} = useContext(GrandExchangeContext);
  const {fore} = useContext(DepRouterContext);
  
  const {__path:path, __children, ...rec} = data;

  const {isSync=false, removeEnabled, insertEnabled, navigateEnabled} = attr;

  const addSibly = () => {
    if (isSync === false){
      addSiblyRec(sheetName, path);
      evalSheet(sheetName);
    } else {
      push(sheetName, {type: 'ADD_REC', rec})
      pull([sheetName], {}, true);  
    }
  }

  const addChild = () => {
    if (isSync === false){
      addChildRec(sheetName, path);
      evalSheet(sheetName);
    } else {
      // addChild is not supported by sync operation. Sync operation is used for
      // adding single document (record), rather than deep (structured) document.
    }
  }

  const rem = () => {
    if (isSync === false){
      remRec(sheetName, path);
      evalSheet(sheetName);
    } else {
      push(sheetName, {type: 'REM_REC', rec});
      pull([sheetName], {}, true);  
    }
  }

  return disabled ? <></> : <div className="edit">
    {removeEnabled && <div className="remove edit-hover" onClick={() => rem()} />}
    {insertEnabled && <div className="insert-sibly edit-hover" onClick={() => addSibly()} />}
    {insertEnabled && <div className="insert-child edit-hover" onClick={() => addChild()} />}
    {navigateEnabled && <div className="link edit-hover" onClick={() => fore(data.link, data)} />}
  </div>
  
}