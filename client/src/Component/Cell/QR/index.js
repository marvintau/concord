import React, {useState} from 'react';
import './qr.css';

export default ({children, disabled}) => {

  const [isShowing, setShowing] = useState(false);

  const toggle = () => {
    setShowing(!isShowing);
  }

  const qrImage = <img alt="qr-entrance" className="qr-image" src={children} />;

  return (disabled || (children===undefined)) ? <></> : <div>
    {isShowing 
      ? <div onClick={() => toggle()}>{qrImage}</div> 
      : <div className="qr" onClick={() => toggle()} />}
  </div>
}