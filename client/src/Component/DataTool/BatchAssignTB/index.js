import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

import {flat, trav, store as condAssign, fetch} from '@marvintau/jpl';

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
export default function({hidden}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    evalSheet('BALANCE');

    const sourceSheet = Sheets['BALANCE'].data;

    trav(sourceSheet, (rec) => {
      if(rec.categorized_to_tb === undefined) {
        rec.categorized_to_tb = {
          type:'ref-cond-store',
          cases:[],
          applySpec:''
        }
      }
    })

    trav(sourceSheet, (rec) => {
      if (rec.__children) {
        for (let child of rec.__children) {
          child.__parent = rec;
        }
      }
    }, 'POST')

    trav(sourceSheet, (rec) => {
      if (rec.categorized_to_tb.cases.length > 0){
        const code = condAssign(rec, 'categorized_to_tb', Sheets);
        rec.categorized_to_tb.code = code;
      }
    }, 'PRE')

    trav(sourceSheet, (rec) => {
      updateResult(rec.categorized_to_tb);
    })

    evalSheet('BALANCE');

    const {record:{__children:monetary}} = fetch('TRIAL_BALANCE:货币资金', Sheets);
    Sheets['CASHFLOW_WORKSHEET_MONETARY'] = {
      data: flat(monetary).filter(({analyzed}) => analyzed !== undefined)
    };

    evalSheet('CASHFLOW_WORKSHEET_MONETARY');

  }

  const elem = hidden
  ? <div key="batch-assign-tb"></div>
  : <div key="batch-assign-tb" className="upload-wrapper">
      <button className="button upload" onClick={onClick}>批量分类</button>
    </div>

  return [elem]
}
