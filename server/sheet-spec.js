const {init, remove, retrieve, create} = require('./database');

const sheetSpecs = [
  {
    name: 'PROJECT',
    tools: ['HeaderCreate'],
    colSpecs: {
      year: {desc: '年度', width: 2, isFilterable: true},
      companyName: {desc: '项目（企业）名称', width: 10, isFilterable: true},
    },
    rowEdit: {isSync: true, removeEnabled: true},
  },
  {
    name: 'CATEGORY_NAME_ALIASES',
    tools: ['Import', 'HeaderCreate', 'SaveRemote'],
    colSpecs: {
      alias: {desc: '科目别名', width: 12, cellType:'Labels'},
    }
  },
  {
    name: 'CONFIRMATION_MANAGEMENT',
    tools: ['Import', 'GenerateTemplate'],
    qrLink:true,
    colSpecs: {
      ID: {desc: '编号', width: 2, isFilterable: true},
      type: {desc:'类型', width: 1, isFilerable: true},
      contact: {desc:'通信地址', width: 3, isFilerable: true, cellType: 'Address'},
      confStatus: {desc:'函证状态', width: 4, isFilterable: true, cellType: 'ConfStatus'},
      qr: {desc:'QR', width: 2, cellType:'QR'},
    },
  },
  {
    name: 'BALANCE',
    isCascaded: true,
    tools: ['Import', 'EvalSheet', 'SaveRemote', 'BatchAssignTB'],
    colSpecs: {
      ccode: {desc: '编码', width: 1, isFilterable: true},
      ccode_name: {desc: '科目名称', width: 2, isFilterable: true},
      mb: {desc: '期初', width: 1, isSortable: true, cellType:'Number'},
      md: {desc: '借方', width: 1, isSortable: true, cellType:'Number'},
      mc: {desc: '贷方', width: 1, isSortable: true, cellType:'Number'},
      me: {desc: '期末', width: 1, isSortable: true, cellType:'Number'},
      dest_ccode_name: {desc: '对方科目', width: 0.5},
      digest: {desc: '摘要', width: 0.5},
      categorized_to_tb: {desc:'列入TB项目', width: 4, cellType:'Ref', attr: {defaultType:'ref-cond-store'}}
    }
  },
  {
    name: 'CONFIRMATION_TEMPLATE',
    tools: ['HeaderCreate'],
    colSpecs: {
      tempName: {desc: '模版名称', width: 4, isFilerable: true},
      tempType: {desc: '模版类型', width: 4, isFilerable: true},
      fileInput: {desc:'上传', width: 2, cellType: 'FileInput'},
    },
    rowEdit: {isSync: true, removeEnabled: true, insertEnabled: false}
  },
  {
    name: 'SOFP',
    isCascaded: true,
    tools: ['Import', 'EvalSheet'],
    colSpecs: {
      ccode_name: {desc: '条目', width: 3, isFilterable: true},
      mb: {desc: '期初', width: 2, isFilterable: true, cellType:'Ref'},
      mc: {desc: '借方发生', width: 2, isFilterable: true, cellType:'Ref'},
      md: {desc: '贷方发生', width: 2, isFilterable: true, cellType:'Ref'},
      me: {desc: '期末', width: 2, isFilterable: true, cellType:'Ref'},
    }
  },
  {
    name: 'TRIAL_BALANCE',
    isCascaded: true,
    tools: ['Import', 'EvalSheet', 'SaveRemote', 'CashflowEntryAssign', 'BatchAssignCashflow'],
    colSpecs: {
      ccode_name: {desc: '条目名称', width: 1.5, isFilterable: true},
      mb: {desc:'期初', width: 1, cellType:'Ref', isSortable: true},
      md: {desc:'借方', width: 1, cellType:'Ref', isSortable: true},
      mc: {desc:'贷方', width: 1, cellType:'Ref', isSortable: true},
      me: {desc:'期末', width: 1, cellType:'Ref', isSortable: true},
      dest_ccode_name: {desc: '对方科目', width: 2},
      categorized:{desc:'列入报表', width:4.5, cellType:'Ref'}
    },
  },
  {
    name: 'PAL',
    isCascaded: true,
    tools: [],
    colSpecs: {
      ccode_name: {desc: '条目名称', width: 4, isFilterable: true},
      value: {desc:'金额', width: 8, cellType:'Ref'},
      categorized: {desc:'列入报表项目', width: 4, cellType:'Ref'}
    },
  },
  {
    name: 'CASHFLOW',
    isCascaded: true,
    tools: ['EvalSheet'],
    colSpecs: {
      ccode_name: {desc: '条目名称', width: 4, isFilterable: true},
      md: {desc:'借方', width: 1.5, cellType:'Ref', isSortable: true},
      mc: {desc:'贷方', width: 1.5, cellType:'Ref', isSortable: true},
      dest_ccode_name: {desc: '对方科目', width: 5},
    },
  },
  {
    name: 'EQUITY',
    isCascaded: true,
    tools: [],
    colSpecs: {
      ccode_name: {desc: '条目名称', width: 1, isFilterable: true},
      'capital': {desc: '股本', width: 1},
      'other-preferred-shares': {desc: '其他权益工具优先股', width: 1},
      'other-perpetual-bonds': {desc: '其他权益工具永续债', width: 1},
      'other-other': {desc: '其他权益工具其它', width: 1},
      'capital-surplus': {desc: '资本公积', width: 1},
      'treasury': {desc: '减：库存股', width: 1},
      'other-earned': {desc: '其他综合收益', width: 1},
      'special-reserves': {desc: '专项储备', width: 1},
      'feature-surplus': {desc: '盈余公积', width: 1},
      'risk-prepare': {desc: '一般风险准备', width: 1},
      'undistributed': {desc: '未分配利润', width: 1},
      'amount': {desc: '股东权益合计', width: 1},
    },
  }
];

// for development stage only
(async () => {

  try {
    await init();
    await remove({table: 'SHEET_SPEC'});
    await create({table: 'SHEET_SPEC'}, sheetSpecs);

    // const specs = await retrieveRecs({table: 'SHEET_SPEC'});
    // console.log(specs);

  } catch(err) {
    console.log(err);
  }

})();


async function fetchSheetSpec(names) {
  
  if (typeof names === 'string') {
    names = [names];
  }

  const res = [];
  for (let name of names) {
    const [doc] = await retrieve({table:'SHEET_SPEC', name});
    res.push(doc);
  }

  return res;
}

module.exports = {
  fetchSheetSpec
}