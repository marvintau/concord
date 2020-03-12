import React, {useContext} from 'react';
import {DepRouterContext} from '../DepRouter';

import './page.css';

import List from '../List';

export default ({}) => {
  const {currPage} = useContext(DepRouterContext);
  
  const {type, children, ...props} = currPage;

  if (type === undefined && children && children.length > 0){
    return <div className="text">
      <div className="title">未命名</div>
      <div className="content">此目录页没有描述，您可以选择左侧菜单进入下级目录一探究竟</div>
    </div>
  }

  if (type === 'TEXT') {
    const {name, title, content} = currPage;

    const actualTitle = title.key !== undefined
      ? currPage[title.key]
      : title;

    const actualText = typeof content === 'string'
      ? content 
      : Array.isArray(content)
      ? <div>{content.map((e, i) => <p key={i}>{e}</p>)}</div>
      : content.toString();

    return <div className="text">
      <div className="title">{actualTitle}</div>
      <div className="content">{actualText}</div>
    </div>
  }

  if (['REFT', 'DATA'].includes(type)){
    return <div className="table-container">
      <List type={type} {...props} />
    </div>
  }

  return <>
  </>
}