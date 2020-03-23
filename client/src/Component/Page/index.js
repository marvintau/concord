import React, {useContext} from 'react';
import QRCode from 'qrcode.react';
import {BrowserView, MobileOnlyView} from 'react-device-detect';

import {DepRouterContext} from '../DepRouter';
import {GrandExchangeContext} from '../GrandExchange';
import List from '../List';

import './page.css';

const qrLink = (name, dict) => {

  const {protocol, host} = window.location;
  const linkString = Object.entries(dict).map(([k, v]) => `${k}=${v}`).join('&');
  return `${protocol}//${host}/${name}?${linkString}`
}

const BrowserPage = ({}) => {
  const {currPage, currArgs} = useContext(DepRouterContext);
  const {Sheets, status} = useContext(GrandExchangeContext);

  const {type, name, children} = currPage;

  if (type === undefined && children && children.length > 0){
    return <div className="page-text">
      <div className="title">未命名</div>
      <div className="content">此目录页没有描述，您可以选择左侧菜单进入下级目录一探究竟</div>
      <QRCode value={qrLink(name, currArgs)} />
    </div>
  }

  if (type === 'TEXT') {
    const {name, title, content} = currPage;

    
    const actualTitle = title.key !== undefined
    ? currArgs[title.key]
    : title;
    
    console.log(currPage, actualTitle);
    const actualText = typeof content === 'string'
      ? content 
      : Array.isArray(content)
      ? <div>{content.map((e, i) => <p key={i}>{e}</p>)}</div>
      : content.toString();

    return <div className="page-text">
      <div className="title">{actualTitle}</div>
      <div className="content">{actualText}</div>
      <QRCode value={qrLink(name, currArgs)} />
    </div>
  }

  if (type === 'DATA'){

    const {sheetName, name, desc, colSpecs} = currPage;
    
    return <div className="table-container">
      <List sheet={Sheets[sheetName]} {...{name: sheetName, desc, status, colSpecs}} />
    </div>
  }

  return <>
  </>
}

const MobilePage = () => {
  return <div>
    yeah, mobile
  </div>
}

export default () => {
  return <>
    <BrowserView style={{height: '100%'}}>
      <BrowserPage />
    </BrowserView>
    <MobileOnlyView>
      <MobilePage />
    </MobileOnlyView>
  </>
}