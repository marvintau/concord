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
    const detailed = flat(record.__children)
      .filter(({__detailed_level}) => __detailed_level)
      .map(({__children}) => __children)
      .flat();
    
    const detailedDestDict = {};

    const upmostLevelDict = Object.fromEntries(Sheets['BALANCE'].data.map(({ccode, ccode_name}) => [ccode, ccode_name]));

    console.log(detailed, 'detailed levels');
      for (let {ccode, ccode_name, dest_ccode, dest_ccode_name} of detailed) {
        if (!dest_ccode_name) {
          console.log(ccode, ccode_name, 'undefined dest');
        }
        else if (dest_ccode_name.includes(':')) {
          const [dest_upmost_ccode, detailed_name] = dest_ccode_name.split(':');
          const upmostName = upmostLevelDict[dest_upmost_ccode];
          if (detailedDestDict[upmostName] === undefined) {
            const {record:{__children:ch}} = fetch(`BALANCE:${upmostName}`, Sheets);
            const detailed = flat(ch).filter(({__detailed_level}) => __detailed_level).map(rec => [rec.ccode_name, rec]);
            detailedDestDict[upmostName] = Object.fromEntries(detailed);
          }
          const dest = detailedDestDict[upmostName][detailed_name];
          console.log('DETAILED', ccode, ccode_name, upmostLevelDict[dest_upmost_ccode], detailed_name, dest);
        } else {
          console.log('NORMAL', ccode, ccode_name, dest_ccode, dest_ccode_name)
        }
      }

  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>现流表第一方法</button>
  </div>
}
