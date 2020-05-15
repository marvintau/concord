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

  if (typeof children === 'string'){
    if (children.startsWith('#')){
      return <div className={`text-cell text-header-${level(children)}`}>{rem(children)}</div>
    } else {
      return <div className="text-cell text-plain">{children}</div>
    }
  }

  if (typeof children === "object"){

    const {label, path, desc} = children;
    if (label !== undefined && desc !== undefined){
      return <div className={`text-badge ${label}`}>{desc}</div>
    } 

    if (path !== undefined && desc !== undefined){
      return <div className={`text-path`}>{desc}</div>
    }
  }

  return <div className="text-cell text-plain">{children ? children.toString() : ''}</div>
}