import React, {useContext} from 'react';
import {DepRouterContext} from '../../../DepRouter';

import './link.css';

export default ({children, hidden}) => {

  const {forward} = useContext(DepRouterContext);

  return <div className="link">
    {hidden ? <></> : <button className="button" onClick={() => forward(children)}>进入</button>}
  </div>
  
}