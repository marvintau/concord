import React, {useContext} from 'react';
import {DepRouterContext} from '../../../DepRouter';

import ArrowIcon from './right-arrow.svg';
import './link.css';

export default ({data, children, hidden}) => {

  const {forward} = useContext(DepRouterContext);

  return <div className="link">
    {hidden || (children===undefined) ? <></> : <div className="link" onClick={() => forward(children, data)}>
      <img style={{height:'1.5rem'}} src={ArrowIcon} />
    </div>}
  </div>
  
}