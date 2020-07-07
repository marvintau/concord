import React, {useContext, useState} from 'react';
import { Exchange } from '../../Exchange';

import {trav, store as condAssign} from '@marvintau/chua';
// import trav from '@marvintau/chua/src/trav';
// import condAssign from '@marvintau/chua/src/store';

export default function({name}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    evalSheet(name);

    const sourceSheet = Sheets[name].data;

    trav(sourceSheet, (rec) => {
      if (rec.__categorized_to_tb && rec.__categorized_to_tb.cases.length > 0){
        console.log(rec.ccode_name, rec.__categorized_to_tb.cases, 'cases');
        condAssign(rec.__categorized_to_tb.cases, rec, Sheets)
      }
    }, 'PRE')

    evalSheet(name);
  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>批量分类</button>
  </div>
}
