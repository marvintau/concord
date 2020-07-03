const {init, remove, retrieve, create} = require('./database');

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
    children: ['Finance', 'Confirmation'],
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
    children: ['Balance', 'TrialBalance', 'FinancialPositionStatement', 'ProfitAndLoss', 'Equity', 'CashflowStatement'],
  },
 

  {
    loadPoint: '/',
    name: 'Balance',
    desc: '余额表',
    type: 'DATA',
    isHidingManual: true,
    data: ['BALANCE', 'TRIAL_BALANCE'],
    // data: ['BALANCE'],
    importedData: [
      {name: 'JOURNAL', desc:'序时帐'},
      {name: 'CURR_JOURNAL', desc:'往来-序时帐'},
      {name: 'BALANCE', desc:'科目余额'},
      {name: 'ASSISTED', desc:'辅助核算'},
      {name: 'TB_RULES', desc:'TB分配规则'},
    ],
  },
  {
    loadPoint: '/',
    name: 'FinancialPositionStatement',
    desc: '资产负债表',
    type: 'DATA',
    isHidingManual: true,
    data: ['SOFP']
  },
  {
    loadPoint: '/',
    name: 'TrialBalance',
    desc: '试算平衡表',
    type: 'DATA',
    data: ['TRIAL_BALANCE', 'SOFP', 'PAL'],
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
  {
    loadPoint: '/',
    name: 'Equity',
    desc: '所有权变动表',
    isHidingManual: true,
    type: 'DATA',
    data: ['EQUITY']
  },
  {
    loadPoint: '/',
    name: 'CashflowStatement',
    desc: '现金流量表',
    isHidingManual: true,
    type: 'DATA',
    data: ['CASHFLOW']
  },
];

// for development stage only
(async () => {

  for (let dir of dirs) {
    let {name} = dir;
    dir.manual = processManualPage(name);
  }

  try {
    await init();
    await remove({table: 'DIRS'});
    await create({table: 'DIRS'}, dirs);
  } catch(err) {
    console.log(err);
  }

})();
 
async function fetchDir(givenLoadPoint='/') {
  const dirs = await retrieve({table: 'DIRS'});

  const loadedPages = dirs.filter(({loadPoint}) => loadPoint === givenLoadPoint);

  for (let page of loadedPages){

    if (page.data !== undefined ){
      page.data = await fetchSheetSpec(page.data);
    }
  }

  return Object.fromEntries(loadedPages.map(({loadPoint, name, ...rest}) => [name, {name, ...rest}]))
}

module.exports = {fetchDir}
