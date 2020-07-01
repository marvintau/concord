import React, {useContext, useState} from 'react';
import { Exchange } from '../../Exchange';

import {flat, fetch, store as condAssign} from '@marvintau/chua';
// import trav from '@marvintau/chua/src/trav';
// import condAssign from '@marvintau/chua/src/store';

export default function({name}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    evalSheet(name);

    const {record} = fetch('TRIAL_BALANCE:货币资金', Sheets);
    const detailedLevels = flat(record.__children).filter(({__detailed_level}) => __detailed_level);
    
    console.log(detailedLevels);
    for (let {ccode, ccode_name, dest_ccode, dest_ccode_name} of detailedLevels) {
      console.log(ccode.slice(0, 4), ccode_name, dest_ccode.slice(0, 4), dest_ccode_name);
    }

  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>现流表第一方法</button>
  </div>
}
