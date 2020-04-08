import React, {useContext, useState} from 'react';
import QRCode from 'qrcode.react';
import {BrowserView, MobileOnlyView} from 'react-device-detect';

import {DepRouterContext} from '../DepRouter';
import {GrandExchangeContext} from '../GrandExchange';
import ReactMarkdown from 'react-markdown/with-html';
import List from '../List';
import Doc from '../Doc';

import './page.css';
import './docu.css';

import QRScanner from '../QRScanner';


const qrLinkContent = (name, dict) => {

  const {protocol, host} = window.location;
  const linkString = Object.entries(dict).map(([k, v]) => `${k}=${v}`).join('&');
  const encoded = encodeURI(`${protocol}//${host}/${name}?${linkString}`);
  console.log(encoded, 'qrContent');
  return encoded;
}

const BrowserPage = () => {
  const {currPage, currArgs} = useContext(DepRouterContext);
  const {Sheets, status} = useContext(GrandExchangeContext);

  const {type, name, children, qrLink, manual} = currPage;

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
      {manualPage}
      {qrLink && <div className="qr-block">
        <h3>手机扫码处</h3>
        <QRCode value={qrLinkContent(name, currArgs)} />
      </div>}
    </div>
  }

  if (type === 'DATA'){

    const {sheetName, name, desc, colSpecs} = currPage;
    
    return <div className="table-container">
      <List sheet={Sheets[sheetName]} {...{name: sheetName, desc, status, colSpecs}} />
      <div className="page-right-side">
        {qrLink && <div className="qr-block">
          <h3>手机扫码处</h3>
          <QRCode value={qrLinkContent(name, currArgs)} />
        </div>}
        {manualPage}
      </div>
    </div>
  }

  return <>
  </>
}

const MobilePage = () => {

  const {fetchURL} = useContext(GrandExchangeContext);
  const {currPage} = useContext(DepRouterContext);
  const {sheetName, desc, colSpecs} = currPage;

  const [stage, setStage] = useState('RETRIEVING_DOC');
  const [doc, setDoc] = useState({});
  const fetchRecord = (text) => {
    (async () => {
      try{
        console.log('fetchURL, called')
        const data = await fetchURL(text);
        setDoc(data);
        setStage('MANAGE_DOC');
      } catch (e) {
        console.error(e);
      }
    })();
  };

  let content = <></>;
  if (stage === 'RETRIEVING_DOC') {
    content = <div className='mobile-container'>
      <div className="title">{desc}</div>
      <div className='content'>手机端管理工具</div>
      <QRScanner buttonName='扫描记录对应的二维码' success={({text}) => fetchRecord(text)}/>
    </div>
  }

  if (stage === 'MANAGE_DOC') {
    content = <div className='mobile-container'>
      <div className="title">{desc}</div>
      <Doc data={doc} {...{sheetName, colSpecs}} />
    </div>
  }

  return content;
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