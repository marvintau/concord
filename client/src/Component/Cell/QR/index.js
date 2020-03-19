import React, {useContext, useState} from 'react';

import ScanIcon from './scan.svg';
import './qr.css';

export default ({data, children, disabled}) => {

  const [isShowing, setShowing] = useState(false);

  const toggle = () => {
    setShowing(!isShowing);
  }

  const qrImage = <img src={children} />;

  return <div className="link">
    {(disabled || (children===undefined)) ? <></> : <div>
      {isShowing 
        ? <div onClick={() => toggle()}>{qrImage}</div> 
        : <img  className="qr" style={{height:'1.5rem'}} src={ScanIcon} onClick={() => toggle()} />}
    </div>}
  </div>
  
}