
// 坏账准备--应收帐款=应收账款
// 坏账准备--其他应收款=其他应收款

const categoryMap = {

  '现金': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:货币资金'}]
  },
  '银行存款': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:货币资金'}]
  },
  '库存现金': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:货币资金'}]
  },
  '其他货币资金': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:货币资金'}]
  },
  '短期投资': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:短期投资'}]
  },
  '短期投资跌价准备': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:短期投资'}]
  },
  '应收账款': {
    type:'ref-cond-store',
    cases:[
      {cond:'me >= 0', path: 'TRIAL_BALANCE:应收账款'},
      {cond:'me <  0', path: 'TRIAL_BALANCE:预收账款'},
    ],
    __applyToSub: true,
  },
  '应付账款': {
    type:'ref-cond-store',
    cases:[
      {cond:'me >= 0', path: 'TRIAL_BALANCE:应付账款'},
      {cond:'me <  0', path: 'TRIAL_BALANCE:预付账款'},
    ],
    __applyToSub: true,
  },
  '预收账款': {
    type:'ref-cond-store',
    cases:[
      {cond:'me >= 0', path: 'TRIAL_BALANCE:预收账款'},
      {cond:'me <  0', path: 'TRIAL_BALANCE:应收账款'},
    ],
    __applyToSub: true,
  },
  '预付账款': {
    type:'ref-cond-store',
    cases:[
      {cond:'me >= 0', path: 'TRIAL_BALANCE:预付账款'},
      {cond:'me <  0', path: 'TRIAL_BALANCE:应付账款'},
    ],
    __applyToSub: true,
  },
  '其他应收款': {
    type:'ref-cond-store',
    cases:[
      {cond:'me >= 0', path: 'TRIAL_BALANCE:其他应收款'},
      {cond:'me <  0', path: 'TRIAL_BALANCE:其他应付款'},
    ],
    __applyToSub: true,
  },
  '其他应付款': {
    type:'ref-cond-store',
    cases:[
      {cond:'me >= 0', path: 'TRIAL_BALANCE:其他应付款'},
      {cond:'me <  0', path: 'TRIAL_BALANCE:其他应收款'},
    ],
    __applyToSub: true,
  },
  '材料': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
  '低值易耗品': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
  '库存商品': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
  '委托加工物资': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
  '委托代销商品': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
  '生产成本': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
  '存货跌价准备': {
    type:'ref-cond-store',
    cases:[{path: 'TRIAL_BALANCE:存货'}]
  },
}

function assign(record, key) {
  const {ccode_name} = record;
  // console.log(ccode_name, 'categorize')
  if (ccode_name !== undefined) {

    const categorySpec = categoryMap[ccode_name];
    if (categorySpec === undefined) {
      // Object.assign(record, {[key]: {
      //   type:'ref-cond-store',
      //   cases:[{path: `TRIAL_BALANCE:${ccode_name}`}]
      // }})
    } else {
      const {__applyToSub, ...rest} = categorySpec;
      Object.assign(record, {[key]: rest, __applyToSub});
    }
  }
}

module.exports = assign;