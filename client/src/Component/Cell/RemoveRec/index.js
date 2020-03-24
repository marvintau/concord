import React, {useContext} from 'react';

import { GrandExchangeContext } from '../../GrandExchange';

import './remove.css';

export default ({sheetName, data, children, disabled}) => {

  const {push, pull, currPage} = useContext(GrandExchangeContext);
  
  const {__path:path, __children, ...recData} = data;

  const remove = () => {
    console.log('remove rec', recData);
    push(sheetName, {type: 'REM_REC', rec: recData})
    pull([sheetName], {}, true);
  }

  return <div className="link">
    {disabled ? <></> : <div className="edit">
      <div className="remove" onClick={() => remove()} />
    </div>}
  </div>
  
}