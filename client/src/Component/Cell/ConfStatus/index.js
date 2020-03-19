import React, { useState, useContext, useEffect } from 'react';
import {Input} from 'reactstrap';

import { GrandExchangeContext } from '../../GrandExchange';
import './conf-status.css';

export default ({sheetName, colName, data:{__path:path}, children={}}) => {

  const {setField} = useContext(GrandExchangeContext);

  const {status: initStatus='BEFORE_SEND'} = children;

  const [data, setData] = useState(children);
  const [status, setStatus] = useState(initStatus);
  const [sendID, setSendID] = useState('');
  const [recvID, setRecvID] = useState('');

  const confirmStatus = (status) => {

    let newData;
    switch (status){
      case 'BEFORE_RECEIVE':
        newData = {...data, status, send_package_id:sendID};
        break;
      case 'AFTER_RECEIVE':
        newData = {...data, status, recv_package_id:recvID};
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

    setData(newData);
    setField(sheetName, path, colName, newData);
    setStatus(status);
  }

  if (["BEFORE_SEND", 'RESEND'].includes(status)){
    return <div className="conf-status-group">
      {status === 'RESEND' && <div>再次发函</div>}
      <Input placeholder="发函快递单号" bsSize="sm" value={sendID} onChange={(e) => setSendID(e.target.value)} />
      <button className="button" onClick={() => confirmStatus('BEFORE_RECEIVE')}>确认发函</button>
    </div>
  } else if (status === 'BEFORE_RECEIVE'){
    const {send_package_id} = data;
    return <div  className="conf-status-lines">
      <div className="conf-status-group">
        <div className="indicator"> 发函单号： {send_package_id} </div>
      </div>
      <div className="conf-status-group">
        <Input placeholder="回函快递单号" bsSize="sm" value={recvID} onChange={(e) => setRecvID(e.target.value)} />
      </div>
      <div className="conf-status-group">
        <button className="button" onClick={() => confirmStatus('AFTER_RECEIVE')}>确认回函</button>
        <button className="button" onClick={() => confirmStatus('RESEND')}>重新发函</button>
        <button className="button" onClick={() => confirmStatus('ALTERNATIVE')}>替代程序</button>
      </div>
  </div>
  } else if (status === 'AFTER_RECEIVE'){
    const {send_package_id, recv_package_id} = data;
    return <div className="conf-status-lines">
      <div className="conf-status-group">
        <div className="indicator"> 发函单号： {send_package_id} </div>
      </div>
      <div className="conf-status-group">
        <div className="indicator"> 回函单号： {recv_package_id} </div>
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