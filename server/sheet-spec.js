const {remove, retrieveRecs, createRecs} = require('./database');

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
    tools: ['ImportExcel', 'HeaderCreate', 'SaveRemote'],
    colSpecs: {
      alias: {desc: '科目别名', width: 12, cellType:'Labels'},
    }
  },
  {
    name: 'CONFIRMATION_MANAGEMENT',
    tools: ['ImportExcel', 'GenerateTemplate'],
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
    sheetName: 'BALANCE',
    isCascaded: true,
    tools: ['ImportExcel'],
    colSpecs: {
      ccode: {desc: '编码', width: 1, isFilterable: true},
      ccode_name: {desc: '科目名称', width: 3, isFilterable: true},
      mb: {desc: '期初', width: 2, isFilterable: true, cellType:'Number'},
      md: {desc: '借方', width: 2, isFilterable: true, cellType:'Number'},
      mc: {desc: '贷方', width: 2, isFilterable: true, cellType:'Number'},
      me: {desc: '期末', width: 2, isFilterable: true, cellType:'Number'},
    }
  },
  {
    sheetName: 'CONFIRMATION_TEMPLATE',
    tools: ['HeaderCreate'],
    colSpecs: {
      tempName: {desc: '模版名称', width: 4, isFilerable: true},
      tempType: {desc: '模版类型', width: 4, isFilerable: true},
      fileInput: {desc:'上传', width: 2, cellType: 'FileInput'},
    },
    rowEdit: {isSync: true, removeEnabled: true, insertEnabled: false}
  },
  {
    sheetName: 'SOFP',
    isCascaded: true,
    tools: ['ImportExcel'],
    colSpecs: {
      ccode_name: {desc: '条目', width: 3, isFilterable: true},
      mb: {desc: '期初', width: 2, isFilterable: true, cellType:'Number'},
      mc: {desc: '借方发生', width: 2, isFilterable: true, cellType:'Number'},
      md: {desc: '贷方发生', width: 2, isFilterable: true, cellType:'Number'},
      me: {desc: '期末', width: 2, isFilterable: true, cellType:'Number'},
    }
  },
  {
    name: 'ACCRUAL_ANALYSIS',
    isCascaded: true,
    tools: ['ImportExcel', 'SaveRemote', 'ExportExcel'],
    referredSheetNames: ['SOFP'],
    colSpecs: {
      ccode_name: {desc: '科目名称', width: 2, isFilterable: true},
      dest_ccode_name: {desc: '对方科目', width: 1, isFilterable: true},
      md: {desc: '借方发生', width: 1, isFilterable: true, isSortable: true, cellType:'Number'},
      mc: {desc: '贷方发生', width: 1, isFilterable: true, isSortable: true, cellType:'Number'},
      descendant_num: {desc: '笔数', width: 1, isSortable: true},
      digest: {desc:'摘要', width: 1, isFilerable: true},
      analyzed: {desc:'已分析', width: 1},
      categorized: {desc:'列入报表项目', width: 4, cellType:'Ref'}
    },
  },
  {
    name: 'TRIAL_BALANCE',
    isCascaded: true,
    tools: ['ImportExcel'],
    colSpecs: {
      ccode_name: {desc: '条目名称', width: 4, isFilterable: true},
      value: {desc:'金额', width: 8, cellType:'Ref'},
      categorized: {desc:'列入报表项目', width: 4, cellType:'Ref'}
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
    await remove({table: 'SHEET_SPEC'});
    await createRecs('SHEET_SPEC', sheetSpecs);

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

  const res = await retrieveRecs({table:'SHEET_SPEC', name:{$in:names}});

  return res;
}

module.exports = {
  fetchSheetSpec
}