import React, {useRef, useState, useContext} from 'react';
import { Exchange } from '../../Exchange';

export default function({title="刷新数据表", name}){

  const {evalSheet} = useContext(Exchange);

  const onClick = () => {
    console.log('eval sheet from outside');
    evalSheet(name);
  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>{title}</button>
  </div>
}
