import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

import {get, flat, fetch} from '@marvintau/jpl';

export default function({hidden, sheetName}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    // 首先处理已经上传过的CASHFLOW表。这个表的数据结构已经成为了级联结构，所以我们
    // 要找到级联结构中所有的叶子结点，并形成一个object，方便后续判断中将TB条目加入
    // 到CASHFLOW中的末级条目。

    evalSheet('CASHFLOW');
    const {record: monetaryDest} = fetch('CASHFLOW:加：期初现金及现金等价物余额', Sheets);
    const {record: {__children: monetaryFrom}} = fetch(`${sheetName}:货币资金`, Sheets);
    console.log(monetaryDest, 'monetaryDest');
    console.log(monetaryFrom, 'monetaryFrom');
  }

  const elem = hidden
  ? <div key="tb-entry-assign"></div>
  : <div key="tb-entry-assign" className="upload-wrapper" key='cashflow-assign-button'>
        <button className="button upload" onClick={onClick}>自动生成TB分配路径</button>
    </div>

  return [elem]
}
