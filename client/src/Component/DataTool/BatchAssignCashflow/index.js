import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

import {trav, fetch, store as condAssign} from '@marvintau/jpl';

const updateResult = (col) => {

  const {ancestors, descendants, destMap, code, applySpec, cases} = col;
  // console.log(destMap);
  if (destMap && destMap.size > 0) {
    // 说明是执行evalSheet前刚刚被分配的那个记录
    Object.assign(col, {
      result: '已分配',
      code:'SUCC'
    })
  } else if (descendants && descendants.length > 0) {           

    Object.assign(col, {
      result: '⬇已分配',
      code: 'INFO',
      disabled: !applySpec
    })

  } else if (ancestors && ancestors.length > 0) {
    Object.assign(col, {
      result: '⬆已分配',
      code: 'INFO',
      disabled: true
    })
  } else if (destMap === undefined || destMap.size === 0) {

    if (cases.length > 0) {
      Object.assign(col, {
        result: '未分配',
        code,
        disabled: false
      })
    } else {
      // console.log(rec.ccode_name, col.code);
      Object.assign(col, {
        result: '无规则',
        code: 'NONE',
        disabled: false
      })
    }
  }
}
export default function({sheetName}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    evalSheet(sheetName);

    const {record:{__children:sourceSheet}} = fetch('TRIAL_BALANCE:货币资金', Sheets);

    trav(sourceSheet, (rec) => {
      if (rec.categorized && rec.categorized.cases.length > 0){
        const code = condAssign(rec, 'categorized', Sheets);
        rec.categorized.code = code;
      }
    }, 'PRE')

    trav(sourceSheet, (rec) => {
      if (rec.categorized){
        updateResult(rec.categorized);
      }
    })

    evalSheet(sheetName);
  }

  return [<div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>分配至现流表</button>
  </div>]
}
