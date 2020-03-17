import React, {useContext} from 'react';
import {DepRouterContext} from '../DepRouter';
import {GrandExchangeContext} from '../GrandExchange';
import List from '../List';

import './page.css';

export default ({}) => {
  const {currPage} = useContext(DepRouterContext);
  const {Sheets, status} = useContext(GrandExchangeContext);

  const {type, children} = currPage;

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

  if (type === 'DATA'){

    const {sheetName, desc, colSpecs} = currPage;

    return <div className="table-container">
      <List sheet={Sheets[sheetName]} {...{name: sheetName, desc, status, colSpecs}} />
    </div>
  }

  return <>
  </>
}