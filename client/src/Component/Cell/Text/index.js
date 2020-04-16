import React, {useState, useContext} from 'react';
import Check from './check.svg';

import './text.css'

const level = (header) => {
  return header.split('#').length - 1;
}

const rem = (header) => {
  return header.replace(/#/g, '');
}

export default ({children}) => {

  return (typeof children ==='string' && children.startsWith('#'))
  ? <div className={`text-cell text-header-${level(children)}`}>{rem(children)}</div>
  : <div className="text-cell text-plain">{children}</div>;
}