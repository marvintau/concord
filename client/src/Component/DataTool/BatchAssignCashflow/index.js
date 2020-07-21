import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

// import {trav, fetch, store as condAssign} from '@marvintau/jpl';
import trav from '@marvintau/jpl/src/trav';
import fetch from '@marvintau/jpl/src/fetch';
import condAssign from '@marvintau/jpl/src/store';

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
export default function({hidden, sheetName}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    evalSheet(sheetName);

    const sourceSheet = Sheets['CASHFLOW_WORKSHEET_MONETARY'].data;
    console.log(sourceSheet);

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

  const elem = hidden
  ? <div key="batch-assign-cashflow"></div>
  : <div key="batch-assign-cashflow" className="upload-wrapper">
      <button className="button upload" onClick={onClick}>分配至现流表</button>
    </div>

  return [elem]
}
