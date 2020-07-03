import React, {useContext, useState} from 'react';
import { Exchange } from '../../Exchange';

import {flat, fetch, store as condAssign} from '@marvintau/chua';
// import trav from '@marvintau/chua/src/trav';
// import condAssign from '@marvintau/chua/src/store';

const getSignificantDest = (dest, sortBy) => {
  const {__children:ch} = dest;
  if (ch.length === 0) {
    const {dest_ccode_name} = ch[0];
    return dest_ccode_name;
  } else {
    const copy = ch.slice();
    copy.sort(({[sortBy]:accA}, {[sortBy]:accB}) => accA - accB);
    const {dest_ccode_name} = ch[0];
    return dest_ccode_name;
  }
}

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


    const balanceTBMap = Object.fromEntries(Sheets['BALANCE'].data.map(({ccode_name, __categorized_to_tb:cate={cases:[]}})=> {

      const {path='undef'} = cate && cate.cases.length > 0 ? cate.cases[0] : {};
      const [_, tbEntry] = path.split(':');
      return [ccode_name, tbEntry];
    }));
    // console.log(balanceTBMap);

    // console.log(detailed, 'detailed levels');
      for (let mone of detailed) {
        const {ccode, ccode_name, dest_ccode, dest_ccode_name, mc:mone_mc, md:mone_md} = mone;
        if (!dest_ccode_name) {
          console.log(ccode, ccode_name, 'undefined dest');
        }
        else if (dest_ccode_name.includes(':')) {
          const [dest_upmost_ccode, detailed_name] = dest_ccode_name.split(':');
          const dest_upmost_name = upmostLevelDict[dest_upmost_ccode];
          const tb_entry_of_upmost_name = balanceTBMap[dest_upmost_name];

          if (['应收帐款', '应付账款', '预收账款', '预付账款', '其他应收款', '其他应付款'].includes(tb_entry_of_upmost_name)) {

            if (detailedDestDict[dest_upmost_name] === undefined) {
              const {record:{__children:ch}} = fetch(`BALANCE:${dest_upmost_name}`, Sheets);
              const detailed = flat(ch).filter(({__detailed_level}) => __detailed_level).map(rec => [rec.ccode_name, rec]);
              detailedDestDict[dest_upmost_name] = Object.fromEntries(detailed);
            }
            const dest = detailedDestDict[dest_upmost_name][detailed_name];

            if (dest[mone_mc > 0 ? 'mc' : 'md'] === 0){
              console.log('二次判断', ccode, ccode_name, upmostLevelDict[dest_upmost_ccode], detailed_name, '货币资金对方科目的发生额为空', mone, dest);
            } else {
              console.log('二次判断', ccode, ccode_name, upmostLevelDict[dest_upmost_ccode], detailed_name, '货币资金对方科目的发生额最大的对方科目', getSignificantDest(dest, mone_mc ? 'md' : 'mc'), mone, dest);
            }

          } else {
            // 遇到了其他非往来科目，但又具有明细科目的情况。那么在这里还是要按照一次判断的方法进行。
            console.log('一次判断', ccode, ccode_name, tb_entry_of_upmost_name, mone);
          }
        } else {
          if (dest_ccode === null) {
            console.log('一次判断', ccode, ccode_name, dest_ccode_name, '无法识别的对方科目')
          } else {
            const dest_upmost_name = upmostLevelDict[dest_ccode.slice(0, 4)];
            // const {record} = fetch(`BALANCE:${dest_upmost_name}`, Sheets);
            const tb_entry_of_upmost_name = balanceTBMap[dest_upmost_name];
            console.log('一次判断', ccode, ccode_name, tb_entry_of_upmost_name);
          }
        }
      }

  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>现流表第一方法</button>
  </div>
}
