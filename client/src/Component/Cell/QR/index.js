import React, {useContext, useState} from 'react';
import './qr.css';

export default ({data, children, disabled}) => {

  const [isShowing, setShowing] = useState(false);

  const toggle = () => {
    setShowing(!isShowing);
  }

  const qrImage = <img className="qr-image" src={children} />;

  return (disabled || (children===undefined)) ? <></> : <div>
    {isShowing 
      ? <div onClick={() => toggle()}>{qrImage}</div> 
      : <div className="qr" onClick={() => toggle()} />}
  </div>
}