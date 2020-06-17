import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

import {trav, store as condAssign} from '@marvintau/chua';

export default function({title="批量分类", name}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {
    console.log('eval sheet from outside');
    evalSheet(name);

    const sourceSheet = Sheets[name].data;

    trav(sourceSheet, (rec) => {
      if (rec.__categorized_to_tb && rec.__categorized_to_tb.cases){
        condAssign(rec.__categorized_to_tb.cases, rec, sourceSheet, Sheets)
      }
    }, 'PRE')

    evalSheet(name);
  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>{title}</button>
  </div>
}
