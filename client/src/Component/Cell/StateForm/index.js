import React, { useState, useContext, useEffect} from 'react';
import {Input} from 'reactstrap';
import QRScanner from '../../QRScanner';

import { Exchange } from '../../Exchange';
import './conf-status.css';

export default ({sheetName, colName, data:{__path:path, __children, ...restRec}, children={}, isMobile=false}) => {

  const {push, pull} = useContext(Exchange);

  const {status: initStatus='BEFORE_SEND'} = children;

  const [data, setData] = useState(children);
  const {send_package_id, recv_package_id} = data;
  const [status, setStatus] = useState(initStatus);
  const [sendID, setSendID] = useState(send_package_id);
  const [recvID, setRecvID] = useState(recv_package_id);

  useEffect(() => {

  }, [status])

  const confirmStatus = (status, updatedData) => {

    let newData;
    switch (status){
      case 'BEFORE_RECEIVE':
        newData = {...data, status, ...updatedData};
        break;
      case 'AFTER_RECEIVE':
        newData = {...data, status, ...updatedData};
        break;
      default:

        const res = {
          'INCONSIST': '数额不一致',
          'CONSIST': '数额一致',
          'ALTERNATIVE': '进入替代程序'
        }

        newData = {...data, status, confirmed:res[status]};
        break;
    }
    // console.log(currArgs, 'currArgs')
    push(sheetName, {type:'UPDATE', rec: restRec, key: colName, val: newData})
    
    const {project_id} = restRec;
    pull([sheetName], {project_id}, true);
    setStatus(status);
  }

  if (["BEFORE_SEND", 'RESEND'].includes(status)){
    return isMobile
      ? <QRScanner buttonName='扫描发函快递条码' success={({text}) => {
          setSendID(text);
          confirmStatus('BEFORE_RECEIVE', {send_package_id: text});
        }}/>
      : <div className="conf-status-group">
          <Input placeholder="发函快递单号" bsSize="sm" value={sendID || ''} onChange={(e) => setSendID(e.target.value)} />
          <button className="button" onClick={() => confirmStatus('BEFORE_RECEIVE', {send_package_id: sendID})}>确认发函</button>
        </div>
  } else if (status === 'BEFORE_RECEIVE'){
    return isMobile
      ? <div>
          <div className="indicator"> 发函单号： {sendID} </div>
          <QRScanner buttonName='扫描回函快递条码' success={({text}) => {
            setRecvID(text);
            confirmStatus('AFTER_RECEIVE', {recv_package_id: text})
          }}/>
        </div>
      : <div className="conf-status-lines">
          <div className="conf-status-group">
            <div className="indicator"> 发函单号： {sendID} </div>
          </div>
          <div className="conf-status-group">
            <Input placeholder="回函快递单号" bsSize="sm" value={recvID || ''} onChange={(e) => setRecvID(e.target.value)} />
          </div>
          <div className="conf-status-group">
            <button className="button" onClick={() => confirmStatus('AFTER_RECEIVE', {recv_package_id: recvID})}>确认回函</button>
            <button className="button" onClick={() => confirmStatus('RESEND')}>重新发函</button>
            <button className="button" onClick={() => confirmStatus('ALTERNATIVE')}>替代程序</button>
          </div>
        </div>
  } else if (status === 'AFTER_RECEIVE'){
    return <div className="conf-status-lines">
      <div className="conf-status-group">
        <div className="indicator"> 发函单号： {sendID} </div>
      </div>
      <div className="conf-status-group">
        <div className="indicator"> 回函单号： {recvID} </div>
      </div>
      <div className="conf-status-group">
        <button className="button" onClick={() => confirmStatus('CONSIST')}>金额相符</button>
        <button className="button" onClick={() => confirmStatus('INCONSIST')}>金额不符</button>
      </div>
    </div>
  } else if (['CONSIST', 'INCONSIST', 'ALTERNATIVE'].includes(status)){
    const {send_package_id, recv_package_id, confirmed} = data;

    return <div className="conf-status-lines">
      <div className="indicator"> 发函单号： {send_package_id} </div>
      <div className="indicator"> 回函单号： {recv_package_id} </div>
      <div className="indicator"> 确认情况： {confirmed} </div>
    </div>
  }
}