import React from 'react';

import './text.css'

const level = (header) => {
  return header.split('#').length - 1;
}

const rem = (header) => {
  return header.replace(/#/g, '');
}

export default ({children}) => {

  return (typeof children ==='string' && children.startsWith('#'))
  ? <div className={`text-header-${level(children)}`}>{rem(children)}</div>
  : <div className="text">{children}</div>;
}