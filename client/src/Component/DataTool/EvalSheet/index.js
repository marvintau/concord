import React, {useRef, useState, useContext} from 'react';
import { Exchange } from '../../Exchange';

export default function({title="刷新数据表", sheetName}){

  const {evalSheet} = useContext(Exchange);

  const onClick = () => {
    console.log('eval sheet from outside');
    evalSheet(sheetName);
  }

  return [<div className="upload-wrapper" key='eval-button'>
      <button className="button upload" onClick={onClick}>{title}</button>
  </div>]
}
