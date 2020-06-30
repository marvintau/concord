import React from 'react';

import './text.css'

const level = (header) => {
  return header.split('#').length - 1;
}

const rem = (header) => {
  return header.replace(/#/g, '');
}

export default ({children, select=() => {}}) => {

  if (typeof children === 'string'){
    if (children.startsWith('#')){
      return <div className={`text-cell text-header-${level(children)}`}>{rem(children)}</div>
    } else {
      return <div className="text-cell text-plain">{children}</div>
    }
  }

  if (typeof children === "object"){

    const {label, path, desc} = children;

    if (label !== undefined){
      console.log(desc);
      return <div className={`text-badge ${label}`}>{desc}</div>
    } 

    if (desc !== undefined) {

      const className = label !== undefined 
      ? `text-badge ${label}` 
      : path !== undefined
      ? 'text-path'
      : '';

      const onClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        (path !== undefined) && select(path);
      }

      return <div {...{className, onClick}}>{desc}</div>
    }
  }

  return <div className="text-cell text-plain">{children ? children.toString() : ''}</div>
}