const fs = require('fs').promises;

const {remove, retrieveRecs, createRecs} = require('./database');

const {genName} = require('./nameGenerate');
const {v4} = require('uuid');

const manualPage = require('./manual-page');

const processManualPage = name => {
  return manualPage[name] !== undefined
  ? manualPage[name]
  : `### 此页面无文档
如果使用中遇到问题，请联系程序员

**陶悦**

Email:yue.marvin.tao@foxmail.com

WeChat: marvintau

Phone: 176-0085-2337
`
}

const dirs = [
  {
    loadPoint: '/',
    pageName: 'Home',
    desc: '首页',
    type: 'TEXT',
    children: ['ProjectList', 'GeneralConfigure'],
  },
  {
    loadPoint: '/',
    pageName: 'GeneralConfigure',
    desc: '通用配置',
    type: 'TEXT',
    children: ['CategoryNameAliases', 'ColAliases', 'PageConfiguration'],
  },
  {
    loadPoint: '/',
    pageName: 'PageConfiguration',
    desc: '页面导航',
    type: 'TEXT',
    children: ['']
  },
  {
    loadPoint: '/',
    pageName: 'CategoryNameAliases',
    desc: '科目别名',
    type: 'DATA',
    sheetName: 'CATEGORY_NAME_ALIASES',
    tools: ['ImportExcel', 'HeaderCreate', 'SaveRemote'],
    colSpecs: {
      alias: {desc: '科目别名', width: 12, cellType:'Labels'},
    },
  },
  {
    loadPoint: '/',
    pageName: 'ColAliases',
    desc: '表头别名',
    type: 'DATA',
    sheetName: 'COLUMN_NAME_ALIASES',
    tools: ['HeaderCreate'],
    colSpecs: {
      aliases: {desc: '表头别名', width: 12, cellType: 'Labels'},
    },
  },
  {
    loadPoint: '/',
    pageName: 'ProjectList',
    desc: '项目列表',
    type: 'DATA',
    sheetName: 'PROJECT',
    tools: ['HeaderCreate'],
    colSpecs: {
      year: {desc: '年度', width: 2, isFilterable: true},
      companyName: {desc: '项目（企业）名称', width: 10, isFilterable: true},
    },
    rowEdit: {isSync: true, removeEnabled: true},
    children: ['PROJECT'],
  },
  {
    loadPoint: '/',
    pageName: 'PROJECT',
    desc: '项目页',
    type: 'TEXT',
    refreshData: true,
    sheetName: undefined,
    colSpecs: undefined,
    children: ['Finance', 'Confirmation'],
  },
  {
    loadPoint: '/',
    pageName: 'Confirmation',
    desc: '函证管理',
    type: 'TEXT',
    children: ['ConfirmationManagement', 'ConfirmationTemplateManagement'],
  },
  {
    loadPoint: '/',
    pageName: 'ConfirmationManagement',
    desc: '函证状态管理',
    type: 'DATA',
    sheetName: 'CONFIRMATION_MANAGEMENT',
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
    loadPoint: '/',
    pageName: 'ConfirmationTemplateManagement',
    desc: '询证函模版管理',
    type: 'DATA',
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
    loadPoint: '/',
    pageName: 'Finance',
    desc: '财务与报表管理',
    type: 'TEXT',
    sheetName: undefined,
    colSpecs: undefined,
    children: ['AccrualAnalysis', 'Balance', 'CashflowStatement'],
  },
  {
    loadPoint: '/',
    pageName: 'Balance',
    desc: '余额表',
    type: 'DATA',
    isCascaded: true,
    tools: ['ImportExcel'],
    sheetName: 'BALANCE',
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
    loadPoint: '/',
    pageName: 'AccrualAnalysis',
    desc: '发生额分析',
    type: 'DATA',
    sheetName: 'ACCRUAL_ANALYSIS',
    // isCascaded: true,
    isHidingManual: true,
    tools: ['ImportExcel', 'SaveRemote', 'ExportExcel'],
    // referredSheetNames: ['BALANCE'],
    colSpecs: {
      ccode_name: {desc: '科目名称', width: 2, isFilterable: true},
      // iyear: {desc:'会计年', width: 1, isFilerable: true},
      iperiod: {desc:'会计月', width: 1, isFilerable: true},
      // dbill_date: {desc:'记账时间', width: 1, isFilerable: true},
      voucher_id: {desc:'凭证编号', width: 1, isFilerable: true},
      voucher_line_num: {desc:'行号', width: 1, isFilerable: true},
      // ccode: {desc: '编码', width: 1, isFilterable: true},
      ccode_dest: {desc: '对方科目', width: 1, isFilterable: true},
      md: {desc: '借方发生', width: 1, isFilterable: true, cellType:'Number'},
      mc: {desc: '贷方发生', width: 1, isFilterable: true, cellType:'Number'},
      digest: {desc:'摘要', width: 4, isFilterable: true}
    },
  },
  {
    loadPoint: '/',
    pageName: 'CashflowStatement',
    desc: '现金流量表',
    type: 'DATA',
    sheetName: 'CASHFLOW_WORKSHEET',
    isCascaded: true,
    tools: ['ImportExcel', 'SaveRemote', 'ExportExcel'],
    referredSheetNames: ['BALANCE', 'CATEGORY_NAME_ALIASES'],
    colSpecs: {
      desc: {desc: '题目', width: 5, isFilerable: true},
      ref:  {desc: '条目', width: 7, isFilterable: true, cellType:'Ref'},
    },
    rowEdit: {isSync:false, insertEnabled:true, removeEnabled: true},
  }
];

// for development stage only
(async () => {

  for (let dir of dirs) {
    let {pageName} = dir;
    dir.manual = processManualPage(pageName);
  }

  try {
    await remove({table: 'DIRS'});
    await createRecs('DIRS', dirs);
  } catch(err) {
    console.log(err);
  }

})();

(async () => {

  try {
    let retrieved = await retrieveRecs({table: 'PROJECT'});
    console.log(retrieved.length, 'retrieved project');

    if (retrieved.length === 0){
      let records = [];
      for (let i = 0; i < 10; i++){
        records.push({companyName: `${genName()} Inc.`, project_id:v4(), year:1990+Math.floor(Math.random()*30), link:'PROJECT', date:Date.now()});
      }
      createRecs('PROJECT', records);
    }

    retrieved = await retrieveRecs({table: 'PROJECT'});
    console.log(retrieved.length, 'retrieved project');

  } catch (err) {
    console.log(err);
  }
})();

async function fetchDir(givenLoadPoint='/') {
  const dirs = await retrieveRecs({table: 'DIRS'});

  const loaded = dirs.filter(({loadPoint}) => loadPoint === givenLoadPoint);

  return Object.fromEntries(loaded.map(({loadPoint, pageName, ...rest}) => [pageName, {pageName, ...rest}]))
}

module.exports = {fetchDir}