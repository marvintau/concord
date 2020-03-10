import React from 'react';

import './default.css'

export default ({children}) => {
  return typeof children === 'number'
  ? <div className="number">
      {parseFloat(children.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2, maximumFractionDigits:2})}
    </div>
  : <div className="text">{children}</div>;
}
