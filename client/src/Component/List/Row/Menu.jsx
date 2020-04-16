import React, {useContext} from "react";
import {GrandExchangeContext} from '../../GrandExchange';

import './menu.css'

const Menu = ({ sheetName, data, bindMenu, bindMenuItem, hideMenu, rowEdit}) => {

  const {removeEnabled, insertEnabled, isSync} = rowEdit;

  const {push, pull, addChildRec, remRec, addSiblyRec, evalSheet} = useContext(GrandExchangeContext);

  const {__path:path, __children, ...rec} = data;

  const addSibly = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSync === false){
      addChildRec(sheetName, path);
      evalSheet(sheetName);
    } else {
      push(sheetName, {type: 'ADD_REC', rec})
      pull([sheetName], {}, true);  
    }
    hideMenu();
  }

  const addChild = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSync === false){
      addSiblyRec(sheetName, path);
      evalSheet(sheetName);
    } else {
      // addChild is not supported by sync operation. Sync operation is used for
      // adding single document (record), rather than deep (structured) document.
    }
    hideMenu();
  }

  const remove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSync === false){
      remRec(sheetName, path);
      evalSheet(sheetName);
    } else {
      push(sheetName, {type: 'REM_REC', rec});
      pull([sheetName], {}, true);  
    }
    hideMenu();
  }

  const elems = [];
  if (removeEnabled){
    elems.push(<div {...bindMenuItem} key="remove" className="item" onClick={remove}>
      <div className="remove margin"/> 删除条目
    </div>)
  }
  if (insertEnabled) {
    elems.push(...[
      <div {...bindMenuItem} key="insert-sibly" className="item" onClick={addChild}><div className="insert-sibly margin" /> 插入同级条目</div>,
      <div {...bindMenuItem} key="insert-child" className="item" onClick={addSibly}><div className="insert-child margin" /> 向子级插入条目</div>
    ]);
  }

  const syncNote = isSync
  ? <p><b>后台操作</b><br/>直接作用于服务器，不可撤销</p>
  : <p><b>前台操作</b><br/>您需要手动保存您的编辑和改动</p>
  
  return (
    <div {...bindMenu} className="menu">
      {elems}
      <hr />
      {syncNote}
    </div>
  );
};

export default Menu;
