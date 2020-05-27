const fs = require('fs').promises;

const {remove, retrieveRecs, createRecs} = require('./database');

const {genName} = require('./nameGenerate');
const {v4} = require('uuid');

const manualPage = require('./manuals');

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
    children: ['GeneralConfigure', 'ProjectList'],
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
    referredTables: ['CATEGORY_NAME_ALIASES'],

  },
  {
    loadPoint: '/',
    pageName: 'ColAliases',
    desc: '表头别名',
    type: 'DATA',
  },
  {
    loadPoint: '/',
    pageName: 'ProjectList',
    desc: '项目列表',
    type: 'DATA',
    children: ['PROJECT'],
  },
  {
    loadPoint: '/',
    pageName: 'PROJECT',
    contextualPageName: 'companyName',
    desc: '项目页',
    type: 'TEXT',
    children: ['Finance', 'Confirmation'],
  },
  // {
  //   loadPoint: '/',
  //   pageName: 'Confirmation',
  //   desc: '函证管理',
  //   type: 'TEXT',
  //   children: ['ConfirmationManagement', 'ConfirmationTemplateManagement'],
  // },
  // {
  //   loadPoint: '/',
  //   pageName: 'ConfirmationManagement',
  //   desc: '函证状态管理',
  //   type: 'DATA',
  //   sheetName: 'CONFIRMATION_MANAGEMENT',
  //   tools: ['ImportExcel', 'GenerateTemplate'],
  //   qrLink:true,
  //   colSpecs: {
  //     ID: {desc: '编号', width: 2, isFilterable: true},
  //     type: {desc:'类型', width: 1, isFilerable: true},
  //     contact: {desc:'通信地址', width: 3, isFilerable: true, cellType: 'Address'},
  //     confStatus: {desc:'函证状态', width: 4, isFilterable: true, cellType: 'ConfStatus'},
  //     qr: {desc:'QR', width: 2, cellType:'QR'},
  //   },
  // },
  // {
  //   loadPoint: '/',
  //   pageName: 'ConfirmationTemplateManagement',
  //   desc: '询证函模版管理',
  //   type: 'DATA',
  //   sheetName: 'CONFIRMATION_TEMPLATE',
  //   tools: ['HeaderCreate'],
  //   colSpecs: {
  //     tempName: {desc: '模版名称', width: 4, isFilerable: true},
  //     tempType: {desc: '模版类型', width: 4, isFilerable: true},
  //     fileInput: {desc:'上传', width: 2, cellType: 'FileInput'},
  //   },
  //   rowEdit: {isSync: true, removeEnabled: true, insertEnabled: false}
  // },
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
    referredSheetNames:['BALANCE']
  },
  {
    loadPoint: '/',
    pageName: 'AccrualAnalysis',
    desc: '发生额分析',
    type: 'MULTI-DATA',
  },
  {
    loadPoint: '/',
    pageName: 'CashflowStatement',
    desc: '现金流量表',
    type: 'DATA',
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