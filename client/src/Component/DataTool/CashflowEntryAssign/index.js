import React, {useContext} from 'react';
import { Exchange } from '../../Exchange';

import {get, flat, fetch} from '@marvintau/jpl';

import {onePassRules, onePassOmit} from './one-pass-rules';
import {twoPassRules, categoryTypes} from './two-pass-rules';

const getSignificantDest = (dest, sortBy) => {
  const {__children:ch} = dest;
  if (ch.length === 0) {
    const {dest_ccode} = ch[0];
    return dest_ccode && dest_ccode.toString();
  } else {
    const copy = ch.slice();
    copy.sort(({[sortBy]:accA}, {[sortBy]:accB}) => accA - accB);
    const {dest_ccode} = copy[0];
    return dest_ccode && dest_ccode.toString();
  }
}

function num(n) {
  return n.toFixed(2).padStart(14);
}

export default function({hidden, sheetName}){

  const {Sheets, evalSheet} = useContext(Exchange);

  const onClick = () => {

    // 首先处理已经上传过的CASHFLOW表。这个表的数据结构已经成为了级联结构，所以我们
    // 要找到级联结构中所有的叶子结点，并形成一个object，方便后续判断中将TB条目加入
    // 到CASHFLOW中的末级条目。

    evalSheet('CASHFLOW');
    const leafPathMapEntries = flat(Sheets['CASHFLOW'].data).map(({ccode_name, __path:path}) => {
      const {list} = get(Sheets['CASHFLOW'].data, {path, withList: true});
      return [ccode_name, `CASHFLOW:${list.map(({ccode_name}) => ccode_name).join('/')}`]
    })
    const leafPathMap = Object.fromEntries(leafPathMapEntries);
    
    // 接下来获取所有的货币资金的分录。我们必须通过货币资金的分录来逐条进行判断，因为
    // 需要依据其借贷。如果是借贷加和的话，有可能出现同一个对方科目同时存在借贷发生额，
    // 这种情况就很难判断了。

    evalSheet(sheetName);
    const monetaryJournals = Sheets['CASHFLOW_WORKSHEET_MONETARY'].data;
    console.log('MONETARY JOURNAL TEST: ', monetaryJournals.every(({dest_ccode_name}) => {
      return dest_ccode_name.desc ? dest_ccode_name.desc.toString().includes(':') : (typeof dest_ccode_name === 'string')
    }));

    // 接下来获取所有科目所对应的一级科目名称。我们需要通过这个名称映射到TB的条目，因为
    // 现流表判断规则是依据TB条目名称计算的。需要注意的是，在真正需要用到这个映射的场合
    // 是在分析对方科目时，由于对方科目已经包含了一级科目的代码，我们在此处只需要得到一
    // 级科目代码与名称的对应即可。

    const upmostLevelEntries = Sheets['BALANCE'].data.map(({ccode, ccode_name, __children:ch=[]}) => {
      const allSubLevels = flat(ch).filter(({cclass}) => cclass).map(({ccode}) => ccode);
      return [...allSubLevels, ccode].map(ccode => [ccode, ccode_name]);
    }).flat();
    const upmostLevelMap = Object.fromEntries(upmostLevelEntries);
    console.log(upmostLevelMap, 'upmost');

    // 然后获得从余额表到TB的映射表。由于我们已经上传了余额表到TB的规则，那么可以直接从
    // 规则中提取这个信息。此处需要注意，往来科目的重分类并不影响此处的计算，所以我们直
    // 接得到往来科目默认的分配方式即可。

    const balanceTBMap = Object.fromEntries(Sheets['BALANCE'].data.map(({ccode_name, categorized_to_tb:cate={cases:[]}})=> {
      const {path='undef'} = cate && cate.cases.length > 0 ? cate.cases[0] : {};
      const [_, tbEntry] = path.split(':');
      return [ccode_name, tbEntry];
    }));

    const destMap = {};

    // 接下来逐条分析每一个货币资金的分录。对于每一个货币资金对应的对方科目
    for (let monetaryRecord of monetaryJournals) {

      // 1. 分辨是借货币资金还是贷货币资金。借货币资金意味着钱进入到货币资金账户，贷则意
      //    味着支出。借方和贷方发生将分别使用不同的规则。
      const {
        ccode,
        ccode_name,
        dest_ccode,
        dest_ccode_name,
        digest,
        mc:mone_mc,
        md:mone_md
      } = monetaryRecord;

      // 如果货币资金只有借方发生，那么应用适用货币资金借方的规则，否则应用贷方规则。
      const accrualType = mone_mc === 0 ? 'md' : 'mc'
      const onePass = onePassRules[accrualType];
      const twoPass = twoPassRules[accrualType];

      if (!dest_ccode_name) {
        console.log('无法确认对方科目', ccode, ccode_name, digest);
      }

      // 2. 判断货币资金借方/贷方发生的对方科目。对方科目的格式是
      //    <一级科目编码>:<明细科目名称>
      //    此处需要注意，并不是所有分录都拥有这个格式，因为这个格式仅限于借贷拆分完毕后
      //    的分录。对于无法拆分借贷的分录，对方科目将应用原始分录中的数据，也就是一个字
      //    符串。这种情况下需要按照手工分配处理。

      else if (dest_ccode_name.desc && dest_ccode_name.desc.toString().includes(':')) {
        const [dest_upmost_ccode, detailed_name] = dest_ccode_name.desc.toString().split(':');
        const dest_upmost_name = upmostLevelMap[dest_upmost_ccode];
        const upmostNameTB = balanceTBMap[dest_upmost_name];

        // 如果一级科目属于以下科目，则进行二次判断。
        if (['应付账款','预付账款', '其他应收款', '其他应付款'].includes(upmostNameTB)) {

          // 这里我们将明细科目建立一个dict查找表。查找表分为两级，一级是总账科目余额表的
          // 末级科目，二级是末级科目下通过其他方式引入的明细科目。这个查找表的目的是缩短
          // 潜在的重复查找的时间。然而这种情况并不经常发生。

          if (destMap[dest_upmost_name] === undefined) {
            const {record:{__children:ch}} = fetch(`BALANCE:${dest_upmost_name}`, Sheets);
            const detailed = flat(ch).filter(({__detailed_level}) => __detailed_level).map(rec => [rec.ccode_name, rec]);
            destMap[dest_upmost_name] = Object.fromEntries(detailed);
          } else {
            console.log('time saved');
          }

          // 找到货币资金分录中对方科目的发生额汇总条目。所谓对方科目发生额汇总，指的是它
          // 对应不同的对方科目的发生额的汇总。我们定义这个对方科目为dest。
          const dest = destMap[dest_upmost_name][detailed_name];

          // 如果是借货币资金贷dest，那么我们要分析dest的借方发生额
          // 如果是贷货币资金贷dest，那么我们要分析dest的贷方发生额
          // 也就是说所要分析的dest的借方还是贷方，是和货币资金的发生是一致的。我们定义这个
          // 借方或者贷方为accrualType。

          if (dest[accrualType] === 0){
            // 如果dest的accrualType方发生额为0，那么找到twoPassRule中的对应项
            console.log(twoPass, upmostNameTB);
            const ruleType = accrualType === 'mc'
            ? ['预付账款', '应付账款'].includes(upmostNameTB)
              ? upmostNameTB
              : 'other'
            : upmostNameTB === '预付账款'
              ? upmostNameTB
              : 'other';
            const cashflow_dest_entry = twoPass[ruleType]['empty']

            console.log(`二次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${upmostLevelMap[dest_upmost_ccode]} 明细: ${detailed_name}`
            }\n\n对方科目发生额汇总:\n${
              `借方:${num(dest.md)} 贷方${num(dest.mc)} ${{mc:'贷', md:'借'}[accrualType]}方发生额为空`
            }\n\n${
              `故分配至现流表 ${cashflow_dest_entry}`
            }\n`);

            const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
            monetaryRecord.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};

          } else {

            // 如果dest的accrualType方发生额不为0，那么还需要再去看dest的对方科目中发生额最大的
            // 那个科目。getSignificant是获得这个科目编号的函数，具体可以参考这个函数的实现
            // **为了避免看到此处时头脑混乱，特别强调：**
            // 
            // 1. 货币资金的对方科目，在最外层for循环开始时已经定义过了，此处不要重复定义，不要使用
            //    循环起始处定义的upmostNameTB
            // 2. 此处要分析的，是货币资金对方科目的对方科目，凡是说明是"DestOfDest"的都是指这个
            // 3. signiDestOfDest所得到的，是货币资金的对方科目（dest）的所有对方科目中，accrual-
            //    Type方发生额最大的那个，的科目编码
            const destAccrual = dest[accrualType];
            const signiDestOfDest = getSignificantDest(dest, accrualType);

            // 基于序时账得到的这个科目编号肯定是一个明细科目，因此我们需要知道这个科目所在的一级
            // 科目是什么
            const upmostLevelOfSigniDestOfDest = upmostLevelMap[signiDestOfDest ? signiDestOfDest.slice(0, 4) : 'null'];

            // 得到"DestOfDest"一级科目所在的TB科目
            const tbNameOfDestOfDest = balanceTBMap[upmostLevelOfSigniDestOfDest];

            // 再得到这个TB科目的类别（流动/非流动-资产/负债、费用、收入类科目）
            const categoryType = categoryTypes[tbNameOfDestOfDest];
            const ruleType = accrualType === 'mc'
            ? ['预付账款', '应付账款'].includes(upmostNameTB)
              ? upmostNameTB
              : 'other'
            : upmostNameTB === '预付账款'
              ? upmostNameTB
              : 'other';
            const cashflow_dest_entry = twoPass[ruleType][categoryType];

            console.log(`二次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${upmostLevelMap[dest_upmost_ccode]} 明细: ${detailed_name}`
            }\n\n对方科目发生额汇总:\n${
              `借方:${num(dest.md)} 贷方${num(dest.mc)} ${accrualType}方发生额为 ${num(destAccrual)} （不为空）`
            }\n\n其对方科目发生额分别为:\n${
              dest.__children.map(({md, mc, dest_ccode, dest_ccode_name}) => {
                return `借方:${num(md)} 贷方${num(mc)} ${dest_ccode ? upmostLevelMap[dest_ccode.slice(0, 4)] : 'NO-DEST-CODE'} ${dest_ccode_name}`
              }).join(`\n`)
            }\n\n${
              `最大${{mc:'借', md:'贷'}[accrualType]}方发生额的科目为 ${signiDestOfDest} ${upmostLevelMap[signiDestOfDest && signiDestOfDest.slice(0, 4)]}`
            }\n${
              `属于${categoryType}类科目 故分配至现流表 ${cashflow_dest_entry}`
            }\n`)

            const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
            monetaryRecord.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};
          }

        } else {

          // 如果一级科目不属于上述往来科目，则进行一次判断。
          // 首先获得对方科目所在一级科目所在的TB项目。onePassRules中规定了TB项目直接
          // 对应的现流表项目。
          const cashflow_dest_entry = onePass[upmostNameTB];

          console.log(`一次判断\n${
            `${ccode}:${ccode_name}`
          }\n${
            `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${dest_ccode} ${dest_ccode_name.desc}`
          }\n${
            `位于${upmostNameTB} 故分配至现流表${cashflow_dest_entry}`
          }`);

          const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
          monetaryRecord.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};

        }

      // 3. 如果不是明细科目，那么我们首先判断对方科目是否识别。在首先针对序时账进行发
      //    生额分析的时候，可能因为多借多贷或其他不规范记账的原因，使得对方科目无法识
      //    别出来。目前已知的问题包括：
      //    a) 月末结转
      //    b) 利息结转
      //    在这种情况下，对方科目会按照序时账中所标注的，是用分号所分割的多个可能的对
      //    方科目的名字。
      } else {

        if (dest_ccode === null || dest_ccode === undefined) {
          // 对于无法识别的对方科目，应当单独列示并提示由操作人员进行标注
          console.warn(`一次判断\n${
            `${ccode}:${ccode_name}`
          }\n${
            `借方:${num(mone_md)} 贷方${num(mone_mc)} 无法识别的对方科目 ${dest_ccode_name} 手工分配`
          }\n`);
        } else {
          // 对于可以识别的对方科目，则获取对方科目所在的一级科目所在的TB条目
          const dest_upmost_name = upmostLevelMap[dest_ccode.slice(0, 4)];

          if (onePassOmit.includes(dest_upmost_name)) {
            // 按规则，某些货币资金类的项目是不需要被计入的。
            console.warn(`一次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${dest_ccode_name.desc} 属于${dest_upmost_name}`
            }\n${
              `按规则忽略`
            }\n`);
  
          } else {

            // 否则，我们获取对方科目一级科目所对应的TB条目，然后直接获得现流表条目。
            const upmostNameTB = balanceTBMap[dest_upmost_name];
            const cashflow_dest_entry = onePass[upmostNameTB];

            console.log(`一次判断\n${
              `${ccode}:${ccode_name}`
            }\n${
              `借方:${num(mone_md)} 贷方${num(mone_mc)} 对方科目: ${dest_ccode_name.desc} 属于${dest_upmost_name}`
            }\n${
              `位于TB${upmostNameTB} 故分配至现流表 ${cashflow_dest_entry}`
            }\n`);

            const cashflow_dest_path = leafPathMap[cashflow_dest_entry];
            console.log(cashflow_dest_path, 'path');
            monetaryRecord.categorized = {type:'ref-cond-store', cases:[{path:cashflow_dest_path}]};
          }
        }
      }
    }

  }

  const elem = hidden
  ? <div key="cashflow-entry-assign"></div>
  : <div key="cashflow-entry-assign" className="upload-wrapper" key='cashflow-assign-button'>
        <button className="button upload" onClick={onClick}>自动生成现流表分配路径</button>
    </div>

  return [elem]
}
