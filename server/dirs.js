const {remove, retrieveRecs, createRecs} = require('./database');

const manualPage = require('./manual-page');

const {fetchSheetSpec} = require('./sheet-spec');

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
    name: 'Home',
    desc: '首页',
    type: 'TEXT',
    children: ['ProjectList', 'GeneralConfigure'],
  },
  {
    loadPoint: '/',
    name: 'GeneralConfigure',
    desc: '通用配置',
    type: 'TEXT',
    children: ['CategoryNameAliases', 'ColAliases', 'PageConfiguration'],
  },
  {
    loadPoint: '/',
    name: 'PageConfiguration',
    desc: '页面导航',
    type: 'TEXT',
    children: ['']
  },
  {
    loadPoint: '/',
    name: 'CategoryNameAliases',
    desc: '科目别名',
    type: 'DATA',
  },
  {
    loadPoint: '/',
    name: 'ColAliases',
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
    name: 'ProjectList',
    desc: '项目列表',
    type: 'DATA',
    data: 'PROJECT',
    children: ['PROJECT'],
  },
  {
    loadPoint: '/',
    name: 'PROJECT',
    contextualName: 'companyName',
    desc: '项目页',
    type: 'TEXT',
    children: ['Finance', 'Confirmation', 'Tests'],
  },
  {
    loadPoint: '/',
    name: 'Confirmation',
    desc: '函证管理',
    type: 'TEXT',
    children: ['ConfirmationManagement', 'ConfirmationTemplateManagement'],
  },
  {
    loadPoint: '/',
    name: 'ConfirmationManagement',
    desc: '函证状态管理',
    type: 'DATA',
  },
  {
    loadPoint: '/',
    name: 'ConfirmationTemplateManagement',
    desc: '询证函模版管理',
    type: 'DATA',
  },
  {
    loadPoint: '/',
    name: 'Finance',
    desc: '财务与报表管理',
    type: 'TEXT',
    // children: ['AccrualAnalysis', 'Balance', 'TrialBalance', 'FinancialPositionStatement', 'ProfitAndLoss', 'Cashflow', 'Equity', 'CashflowStatement'],
    children: ['AccrualAnalysis', 'Balance', 'TrialBalance', 'FinancialPositionStatement', 'ProfitAndLoss', 'Equity', 'CashflowStatement'],
  },
  {
    loadPoint: '/',
    name: 'Tests',
    desc: '测试用表',
    type: 'TEXT',
    children: ['TestSource', 'TestTarget', 'TestRearrange', 'TestMediate'],
  },
  {
    loadPoint: '/',
    name: 'TestMediate',
    desc: '测试-Assign',
    isHidingManual: true,
    type: 'DATA',
    data: ['MEDIATE', 'TARGET', 'SOURCE'],
  },
  {
    loadPoint: '/',
    name: 'TestRearrange',
    desc: '测试-Rearrange',
    isHidingManual: true,
    type: 'DATA',
    data: ['REARRANGE', 'TARGET', 'SOURCE'],
  },
  {
    loadPoint: '/',
    name: 'TestTarget',
    desc: '测试-分配目标数据',
    isHidingManual: true,
    type: 'DATA',
    data: ['TARGET'],
  },
  {
    loadPoint: '/',
    name: 'TestSource',
    desc: '测试-引用来源数据',
    isHidingManual: true,
    type: 'DATA',
    data: ['SOURCE'],
  },

  {
    loadPoint: '/',
    name: 'Balance',
    desc: '余额表',
    type: 'DATA',
    data: ['BALANCE']
  },
  {
    loadPoint: '/',
    name: 'FinancialPositionStatement',
    desc: '资产负债表',
    type: 'DATA',
  },
  {
    loadPoint: '/',
    name: 'AccrualAnalysis',
    desc: '发生额分析',
    type: 'DATA',
    data: 'ACCRUAL_ANALYSIS',
    isHidingManual: true,
  },
  {
    loadPoint: '/',
    name: 'TrialBalance',
    desc: '试算平衡表',
    type: 'DATA',
    data: ['TRIAL_BALANCE'],
    isHidingManual: true,
  },
  {
    loadPoint: '/',
    name: 'ProfitAndLoss',
    desc: '损益表',
    isHidingManual: true,
    type: 'DATA',
    data: ['PAL'],
    
  },
  // {
  //   loadPoint: '/',
  //   name: 'Cashflow',
  //   desc: '现金流量表',
  //   type: 'DATA',
  //   isHidingManual: true,
  //   data: ['CASHFLOW']
  // },
  {
    loadPoint: '/',
    name: 'Equity',
    desc: '所有权变动表',
    type: 'DATA',
    isHidingManual: true,
  },
  {
    loadPoint: '/',
    name: 'CashflowStatement',
    desc: '现金流量表 (Obsoleted)',
    type: 'DATA',
    sheetName: 'CASHFLOW_WORKSHEET',
    isCascaded: true,
    tools: [],
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
    let {name} = dir;
    dir.manual = processManualPage(name);
  }

  try {
    await remove({table: 'DIRS'});
    await createRecs('DIRS', dirs);
  } catch(err) {
    console.log(err);
  }

})();
 
async function fetchDir(givenLoadPoint='/') {
  const dirs = await retrieveRecs({table: 'DIRS'});

  const loadedPages = dirs.filter(({loadPoint}) => loadPoint === givenLoadPoint);

  for (let page of loadedPages){

    if (page.data !== undefined ){
      page.data = await fetchSheetSpec(page.data);
    }
  }

  return Object.fromEntries(loadedPages.map(({loadPoint, name, ...rest}) => [name, {name, ...rest}]))
}

module.exports = {fetchDir}
