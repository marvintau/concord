import React, {useContext, useState} from 'react';
import { Exchange } from '../../Exchange';

import {get, flat, fetch, trav} from '@marvintau/jpl';

import {onePassRulesMD, onePassRulesMC, onePassOmit} from './one-pass-check';

const getSignificantDest = (dest, sortBy) => {
  const {__children:ch} = dest;
  if (ch.length === 0) {
    const {dest_ccode} = ch[0];
    return dest_ccode;
  } else {
    const copy = ch.slice();
    copy.sort(({[sortBy]:accA}, {[sortBy]:accB}) => accA - accB);
    const {dest_ccode} = copy[0];
    return dest_ccode;
  }
}

function num(n) {
  return n.toFixed(2).padStart(14);
}

export default function({name}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    evalSheet('CASHFLOW');
    const leafPathMapEntries = flat(Sheets['CASHFLOW'].data).map(({ccode_name, __path:path}) => {
      const {list} = get(Sheets['CASHFLOW'].data, {path, withList: true});
      return [ccode_name, `CASHFLOW:${list.map(({ccode_name}) => ccode_name).join('/')}`]
    })
    const leafPathMap = Object.fromEntries(leafPathMapEntries);
    // console.log(leafPathMap);

    evalSheet(name);

    const {record} = fetch('TRIAL_BALANCE:货币资金', Sheets);
    const mones = flat(record.__children);

    for (let mone of mones) {
      if (mone.categorized === undefined) {
        mone.categorized = {
          type:'ref-cond-store',
          cases:[],
          applySpec:''
        }
      }
    }

    const detailed = mones
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

    const balanceTBMap = Object.fromEntries(Sheets['BALANCE'].data.map(({ccode_name, categorized_to_tb:cate={cases:[]}})=> {

      const {path='undef'} = cate && cate.cases.length > 0 ? cate.cases[0] : {};
      const [_, tbEntry] = path.split(':');
      return [ccode_name, tbEntry];
    }));
    // console.log(balanceTBMap);

    // 对于每一个货币资金对应的对方科目
    for (let moneRec of detailed) {

      // 1. 分辨是借货币资金还是贷货币资金。借货币资金意味着钱进入到货币资金账户，贷则意味着支出。借方和贷方发生
      //    将分别使用不同的规则。
      const {ccode, ccode_name, dest_ccode, dest_ccode_name, mc:mone_mc, md:mone_md} = moneRec;
      const onePassRules = mone_mc
      ? onePassRulesMC
      : onePassRulesMD;

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

            const tb_dest_entry = {
              预付账款:{
                md: '购买商品、接受劳务支付的现金',
                mc: '购买商品、接受劳务支付的现金',
              },
              应付账款:{
                md: '收到其他与筹资活动有关的现金',
                mc: '购买商品、接受劳务支付的现金',
              },
              其他应收款: {
                md: '收到其他与筹资活动有关的现金',
                mc: '支付其他与投资活动有关的现金',
              },
              其他应付款: {
                md: '收到其他与筹资活动有关的现金',
                mc: '支付其他与投资活动有关的现金',
              }
            }

            console.log(`二次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${upmostLevelDict[dest_upmost_ccode]} 明细: ${detailed_name}`
            }\n\n对方科目发生额汇总:\n${
              `借方:${num(dest.md)} 贷方${num(dest.mc)} ${mone_mc ? '贷' : '借'}方发生额为空`
            }\n\n${
              `故分配至现流表 ${tb_dest_entry[tb_entry_of_upmost_name][mone_mc ? 'mc' : 'md']}`
            }\n`);

            const cashflow_dest_entry = tb_dest_entry[tb_entry_of_upmost_name][mone_mc ? 'mc' : 'md'];
            const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
            moneRec.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};
            // console.log(RefSheets);
            // const result = condAssign([{path:`CASHFLOW:${cashflow_dest_entry}`}], moneRec, RefSheets);
            // console.log(result, '二次判断 result');

          } else {
            const destAccrual = dest[mone_mc ? 'md' : 'mc'];
            const significantDest = getSignificantDest(dest, mone_mc ? 'md' : 'mc');
            const upmostLevelOfSigniDest = upmostLevelDict[significantDest ? significantDest.slice(0, 4) : 'null'];
            const tb_entry_of_upmost_name = balanceTBMap[upmostLevelOfSigniDest];
            const tb_dest_entry = onePassRules[tb_entry_of_upmost_name];

            console.log(`二次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${upmostLevelDict[dest_upmost_ccode]} 明细: ${detailed_name}`
            }\n\n对方科目发生额汇总:\n${
              `借方:${num(dest.md)} 贷方${num(dest.mc)} ${mone_mc ? '贷' : '借'}方发生额为 ${num(destAccrual)} （不为空）`
            }\n\n其对方科目发生额分别为:\n${
              dest.__children.map(({md, mc, dest_ccode, dest_ccode_name}) => {
                return `借方:${num(md)} 贷方${num(mc)} ${dest_ccode ? upmostLevelDict[dest_ccode ? dest_ccode.slice(0, 4): 'null'] : dest_ccode_name}`
              }).join(`\n`)
            }\n\n${
              `最大${mone_mc ? '贷' : '借'}方发生额的科目为 ${upmostLevelDict[significantDest && significantDest.slice(0, 4)]}`
            }\n${
              `故分配至现流表 ${tb_dest_entry}`
            }\n`)

            const cashflow_dest_entry = onePassRules[tb_entry_of_upmost_name];
            const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
            moneRec.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};

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
          }\n
          明细科目的一次判断`);
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
        } else {
          // 对于可以识别的对方科目，则获取对方科目所在的一级科目所在的TB条目
          const dest_upmost_name = upmostLevelDict[dest_ccode.slice(0, 4)];

          if (onePassOmit.includes(dest_upmost_name)) {
            console.log(`一次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${dest_ccode_name} 属于${dest_upmost_name}`
            }\n${
              `按规则忽略`
            }\n`);
  
          } else {

            const tb_entry_of_upmost_name = balanceTBMap[dest_upmost_name];
            const tb_dest_entry = onePassRules[tb_entry_of_upmost_name];

            console.log(`一次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${dest_ccode_name} 属于${dest_upmost_name}`
            }\n${
              `故分配至现流表 ${tb_dest_entry}`
            }\n`);

            const cashflow_dest_entry = onePassRules[tb_entry_of_upmost_name];
            const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
            moneRec.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};
          }
        }
      }
    }

  }

  return [<div className="upload-wrapper" key='cashflow-assign-button'>
      <button className="button upload" onClick={onClick}>自动生成现流表分配路径</button>
  </div>]
}
