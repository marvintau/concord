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

  if (typeof children === "object" && children.label){

    const res = {
      succ: '正常',
      info: '注意',
      warn: '未通过'
    }[children.label]

    return <div className={`text-badge ${children.label}`}>{res}</div>
  }

  return <div className="text-cell text-plain">{children}</div>
}