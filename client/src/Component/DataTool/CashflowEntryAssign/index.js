import React, {useContext, useState} from 'react';
import { Exchange } from '../../Exchange';

import {flat, fetch, store as condAssign} from '@marvintau/chua';
// import trav from '@marvintau/chua/src/trav';
// import condAssign from '@marvintau/chua/src/store';

import {onePassRulesIncome, onePassRulesOutgoing} from './one-pass-check';
import {twoPassRules} from './two-pass-check';

const getSignificantDest = (dest, sortBy) => {
  const {__children:ch} = dest;
  if (ch.length === 0) {
    const {dest_ccode} = ch[0];
    return dest_ccode;
  } else {
    const copy = ch.slice();
    copy.sort(({[sortBy]:accA}, {[sortBy]:accB}) => accA - accB);
    const {dest_ccode} = ch[0];
    return dest_ccode;
  }
}

function num(n) {
  return n.toFixed(2).padStart(14);
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

    const upmostLevelEntries = Sheets['BALANCE'].data.map(({ccode, ccode_name, __children:ch=[]}) => {
      const allSubLevels = flat(ch).filter(({cclass}) => cclass).map(({ccode}) => ccode);
      return [...allSubLevels, ccode].map(ccode => [ccode, ccode_name]);
    }).flat();
    const upmostLevelDict = Object.fromEntries(upmostLevelEntries);
    console.log(upmostLevelDict, 'upmost');

    const balanceTBMap = Object.fromEntries(Sheets['BALANCE'].data.map(({ccode_name, __categorized_to_tb:cate={cases:[]}})=> {

      const {path='undef'} = cate && cate.cases.length > 0 ? cate.cases[0] : {};
      const [_, tbEntry] = path.split(':');
      return [ccode_name, tbEntry];
    }));
    // console.log(balanceTBMap);

    // 对于每一个货币资金对应的对方科目
    for (let mone of detailed) {

      // 1. 分辨是借货币资金还是贷货币资金。借货币资金意味着钱进入到货币资金账户，贷则意味着支出。借方和贷方发生
      //    将分别使用不同的规则。
      const {ccode, ccode_name, dest_ccode, dest_ccode_name, mc:mone_mc, md:mone_md} = mone;
      const onePassRules = mone_mc > 0 && mone_md === 0
      ? onePassRulesIncome
      : onePassRulesOutgoing;

      if (!dest_ccode_name) {
        console.log(ccode, ccode_name, 'undefined dest');
      }

      // 2. 判断货币资金借方/贷方发生的对方科目。首先判断对方科目是否是一个明细科目。明细科目的格式是
      //    <上级科目编码>:<明细科目名称>
      //    
      else if (dest_ccode_name.includes(':')) {
        const [dest_upmost_ccode, detailed_name] = dest_ccode_name.split(':');
        const dest_upmost_name = upmostLevelDict[dest_upmost_ccode];
        const tb_entry_of_upmost_name = balanceTBMap[dest_upmost_name];

        // 如果上级科目属于以下科目，则进行二次判断。
        if (['应付账款','预付账款', '其他应收款', '其他应付款'].includes(tb_entry_of_upmost_name)) {

          // 这里我们将明细科目建立一个dict查找表。查找表分为两级，一级是总账科目余额表的
          // 末级科目，二级是末级科目下通过其他方式引入的明细科目。这个查找表的目的是缩短
          // 潜在的重复查找的时间。然而这种情况并不经常发生。

          if (detailedDestDict[dest_upmost_name] === undefined) {
            const {record:{__children:ch}} = fetch(`BALANCE:${dest_upmost_name}`, Sheets);
            const detailed = flat(ch).filter(({__detailed_level}) => __detailed_level).map(rec => [rec.ccode_name, rec]);
            detailedDestDict[dest_upmost_name] = Object.fromEntries(detailed);
          }

          // 根据货币资金发生额汇总后的对方科目，找到它所在的条目。
          const dest = detailedDestDict[dest_upmost_name][detailed_name];

          // 判断此科目的发生额（如果借货币资金，则看此科目的贷方发生，vice versa）
          if (dest[mone_mc ? 'mc' : 'md'] === 0){
            // console.log('二次判断', ccode, ccode_name, upmostLevelDict[dest_upmost_ccode], detailed_name, '货币资金对方科目的发生额为空', mone, dest);
            console.log(`二次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${upmostLevelDict[dest_upmost_ccode]} 明细: ${detailed_name}`
            }\n\n对方科目发生额汇总:\n${
              `借方:${num(dest.md)} 贷方${num(dest.mc)} ${mone_mc !== 0 ? '贷' : '借'}方发生额为空`
            }\n\n${
              `故分配至现流表 ...`
            }\n`);
  
          } else {
            const destAccrual = dest[mone_mc !== 0 ? 'mc' : 'md'];
            const significantDest = getSignificantDest(dest, mone_mc ? 'md' : 'mc');
            const upmostLevelOfSigniDest = upmostLevelDict[significantDest];
            const tb_dest_entry = twoPassRules[upmostLevelOfSigniDest];

            // console.log('二次判断', ccode, ccode_name, upmostLevelDict[dest_upmost_ccode], detailed_name, '货币资金对方科目的发生额最大的对方科目', significantDest, tb_dest_entry, mone, dest);
            console.log(`二次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${upmostLevelDict[dest_upmost_ccode]} 明细: ${detailed_name}`
            }\n\n对方科目发生额汇总:\n${
              `借方:${num(dest.md)} 贷方${num(dest.mc)} ${mone_mc !== 0 ? '贷' : '借'}方发生额为 ${num(destAccrual)} （不为空）`
            }\n\n其对方科目发生额分别为:\n${
              dest.__children.map(({md, mc, dest_ccode, dest_ccode_name}) => {
                return `借方:${num(md)} 贷方${num(mc)} ${dest_ccode ? upmostLevelDict[dest_ccode.slice(0, 4)] : dest_ccode_name}`
              }).join(`\n`)
            }\n\n${
              `最大${mone_mc ? '借' : '贷'}方发生额的科目为 ${significantDest}`
            }\n${
              `故分配至现流表 ${tb_dest_entry}`
            }\n`)
          }

        // 否则则进行一次判断。注意，当我们进行明细科目划分时，会遇到这样的情况，就是
        // 在处理序时帐的时候并没有找到在科目余额表中对应的明细科目，这种情况下隶属于
        // 同一上级科目的分录会被记作“其他明细科目”。因此，即使在不需要判断明细科目的
        // 情况下判断了明细科目，因为明细科目发生额的总和与其上级科目相等，所以也没关
        // 系，不会出现漏划分的情况。
        } else {
          console.log(`一次判断\n${
            `${ccode}:${ccode_name}`
          }\n${
            `借方:${num(mone_md)} 贷方${num(mone_mc)}`
          }\n`);
        }

      // 3. 如果不是明细科目，那么我们首先判断对方科目是否识别。在首先针对序时帐进行发
      //    生额分析的时候，可能因为多借多贷或其他不规范记账的原因，使得对方科目无法识
      //    别出来。目前已知的问题包括：
      //    a) 月末结转
      //    b) 利息结转
      //    在这种情况下，对方科目会按照序时帐中所标注的，是用分号所分割的多个可能的对
      //    方科目的名字。
      } else {

        if (dest_ccode === null) {
          // 对于无法识别的对方科目，应当单独列示并提示由操作人员进行标注
          console.log(`一次判断\n${
            `${ccode}:${ccode_name}`
          }\n${
            `借方:${num(mone_md)} 贷方${num(mone_mc)} 无法识别的对方科目 ${dest_ccode_name} 手工分配`
          }\n`);
          // console.log('一次判断', ccode, ccode_name, dest_ccode_name, '无法识别的对方科目')
        } else {
          // 对于可以识别的对方科目，则获取对方科目所在的一级科目所在的TB条目
          const dest_upmost_name = upmostLevelDict[dest_ccode.slice(0, 4)];
          // const {record} = fetch(`BALANCE:${dest_upmost_name}`, Sheets);
          const tb_entry_of_upmost_name = balanceTBMap[dest_upmost_name];
          const tb_dest_entry = onePassRules[tb_entry_of_upmost_name];
          // console.log('一次判断', ccode, ccode_name, tb_entry_of_upmost_name, tb_dest_entry);
          console.log(`一次判断\n${
            `${ccode}:${ccode_name}`
          }\n${
            `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${dest_ccode_name}:${dest_ccode_name}`
          }\n${
            `故分配至现流表 ${tb_dest_entry}`
          }\n`);

        }
      }
    }

  }

  return <div className="upload-wrapper">
      <button className="button upload" onClick={onClick}>现流表第一方法</button>
  </div>
}
