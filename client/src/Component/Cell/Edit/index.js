import React, {useContext} from 'react';

import { GrandExchangeContext } from '../../GrandExchange';
import { DepRouterContext } from '../../DepRouter';

import './edit.css';

export default ({sheetName, data, attr, disabled}) => {

  const {push, pull, addRec, remRec, addChild, evalSheet} = useContext(GrandExchangeContext);
  const {fore} = useContext(DepRouterContext);
  
  const {__path:path, __children, ...rec} = data;

  const {isSync=false, removeEnabled, insertEnabled, navigateEnabled} = attr;

  const add = () => {
    if (isSync === false){
      if (__children !== undefined){
        addRec(sheetName, path);
      } else {
        addChild(sheetName, path);
      }
      evalSheet(sheetName);
    } else {
      push(sheetName, {type: 'ADD_REC', rec})
      pull([sheetName], {}, true);  
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
    {insertEnabled && <div className="insert edit-hover" onClick={() => add()} />}
    {navigateEnabled && <div className="link edit-hover" onClick={() => fore(data.link, data)} />}
  </div>
  
}