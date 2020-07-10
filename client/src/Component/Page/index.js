import React, {useContext, useState, useEffect} from 'react';
import {BrowserView, MobileOnlyView} from 'react-device-detect';

import QRCode from 'qrcode.react';

import {DepRouterContext} from '../DepRouter';
import {Exchange} from '../Exchange';
import ReactMarkdown from 'react-markdown/with-html';
import List from '../List';
// import Doc from '../Doc';

import './page.css';
import './docu.css';
import 'bootstrap/dist/css/bootstrap.min.css'

// import QRScanner from '../QRScanner';


const qrLinkContent = (name, dict) => {

  const {protocol, host} = window.location;
  const linkString = Object.entries(dict).map(([k, v]) => `${k}=${v}`).join('&');
  const encoded = encodeURI(`${protocol}//${host}/${name}?${linkString}`);
  console.log(encoded, 'qrContent');
  return encoded;
}

const BrowserPage = () => {
  const {currPage, currArgs} = useContext(DepRouterContext);
  const {Sheets, status} = useContext(Exchange);
  
  const {type, name, children, qrLink, manual, isHidingManual} = currPage;

  const manualPage = <ReactMarkdown
    source={manual}
    renderers={{
      p: ({children, ...props}) => {
        console.log(props);
        return children
      },
    }}
  />


  if (type === undefined && children && children.length > 0){
    return <div className="page-text">
      <div className="docu-header">未命名</div>
      <div className="content">此页无描述</div>
      {qrLink && <div className="qr-block">
        <h3>手机扫码处</h3>
        <QRCode value={qrLinkContent(name, currArgs)} />
      </div>}
    </div>
  }

  if (type === 'TEXT') {
    return <div className="page-text">
      {!isHidingManual && manualPage}
      {qrLink && <div className="qr-block">
        <h3>手机扫码处</h3>
        <QRCode value={qrLinkContent(name, currArgs)} />
      </div>}
    </div>
  }

  if (type === 'DATA'){

    const {name: pageName, desc, data} = currPage;
    const {name: sheetName, ...restListProps} = data[0]

    console.log(`Navigated to page: [${pageName}]`);

    return <div className="content-container">
      <List {...{sheet: Sheets[sheetName], sheetName, desc, status, ...restListProps}} />
      {!isHidingManual && <div className="page-right-side">
        {manualPage}
      </div>}
    </div>
  }

  return <>
  </>
}

export default () => {
  return <BrowserPage />
}