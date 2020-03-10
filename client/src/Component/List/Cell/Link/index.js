import React, {useContext} from 'react';
import {DepRouterContext} from '../../../DepRouter';

import './link.css';

export default ({data, children, hidden}) => {

  const {forward} = useContext(DepRouterContext);

  return <div className="link">
    {hidden || (children===undefined) ? <></> : <button className="button" onClick={() => forward(children, data)}>进入</button>}
  </div>
  
}