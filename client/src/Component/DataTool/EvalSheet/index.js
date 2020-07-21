import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

export default function({title="刷新数据表", hidden, sheetName}){

  const {evalSheet} = useContext(Exchange);

  const onClick = () => {
    console.log('eval sheet from outside');
    evalSheet(sheetName);
  }

  const elem = hidden
  ? <div key="evalSheet"></div>
  : <div key="evalSheet" className="upload-wrapper" key='eval-button'>
      <button className="button upload" onClick={onClick}>{title}</button>
    </div>
  return [elem]
}
