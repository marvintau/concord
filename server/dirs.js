const {remove, retrieveRecs, createRecs} = require('./database');

const {genName} = require('./nameGenerate');
const {v4} = require('uuid');

const manualPage = require('./manual-page');

const processManualPage = name => {
  return manualPage[name] !== undefined ? manualPage[name] : '描述未详'
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
    sheetName: 'CATEGORY_NAME_ALIASES',
    tools: ['HeaderCreate'],
    colSpecs: {
      alias: {desc: '科目别名', width: 12, cellType:'Labels'},
    },
  },
  {
    loadPoint: '/',
    name: 'ColAliases',
    desc: '表头别名',
    type: 'DATA',
    sheetName: 'COLUMN_NAME_ALIASES',
    tools: ['HeaderCreate'],
    colSpecs: {
      aliases: {desc: '等价的科目名称', width: 12, cellType: 'Labels'},
    },
  },
  {
    loadPoint: '/',
    name: 'ProjectList',
    desc: '项目列表',
    type: 'DATA',
    sheetName: 'PROJECT',
    tools: ['HeaderCreate', 'ImportExcel'],
    colSpecs: {
      year: {desc: '年度', width: 1, isFilterable: true},
      companyName: {desc: '项目（企业）名称', width: 9, isFilterable: true},
      manage: {desc: '-', width: 2, cellType:'Edit', attr:{isSync: true, removeEnabled: true, navigateEnabled: true}}
    },
    children: ['PROJECT'],
  },
  {
    loadPoint: '/',
    name: 'PROJECT',
    desc: '项目页',
    type: 'TEXT',
    refreshData: true,
    sheetName: undefined,
    colSpecs: undefined,
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
    sheetName: 'CONFIRMATION_MANAGEMENT',
    tools: ['ImportExcel', 'GenerateTemplate'],
    qrLink:true,
    colSpecs: {
      ID: {desc: '编号', width: 2, isFilterable: true},
      contact: {desc:'通信地址', width: 4, isFilerable: true, cellType: 'Address'},
      confStatus: {desc:'函证状态', width: 4, isFilterable: true, cellType: 'ConfStatus'},
      qr: {desc:'QR', width: 2, cellType:'QR'},
    },
  },
  {
    loadPoint: '/',
    name: 'ConfirmationTemplateManagement',
    desc: '询证函模版管理',
    type: 'DATA',
    sheetName: 'CONFIRMATION_TEMPLATE',
    tools: ['ImportExcel', 'HeaderCreate'],
    colSpecs: {
      tempName: {desc: '模版名称', width: 4, isFilerable: true},
      tempType: {desc: '模版类型', width: 4, isFilerable: true},
      fileInput: {desc:'上传', width: 2, cellType: 'FileInput'},
      manage: {desc: '管理', width: 2, cellType:'Edit', attr:{isSync: true, removeEnabled: true, insertEnabled: false}}
    },
  },
  {
    loadPoint: '/',
    name: 'Finance',
    desc: '财务与报表管理',
    type: 'TEXT',
    sheetName: undefined,
    colSpecs: undefined,
    children: ['Balance', 'CashflowStatement'],
  },
  {
    loadPoint: '/',
    name: 'Balance',
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
    name: 'CashflowStatement',
    desc: '现金流量表',
    type: 'DATA',
    sheetName: 'CASHFLOW_WORKSHEET',
    isCascaded: true,
    tools: ['ImportExcel', 'SaveRemote'],
    referredSheetNames: ['BALANCE', 'CATEGORY_NAME_ALIASES'],
    colSpecs: {
      ref: {desc: '条目', width: 10, isFilterable: true, cellType:'Ref'},
      edit: {desc: '编辑', width: 2, isFilterable: false, cellType:'Edit', attr:{isSync:false, insertEnabled:true, removeEnabled: true}},
    }      
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

(async () => {

  try {
    let retrieved = await retrieveRecs({table: 'PROJECT'});
    console.log(retrieved.length, 'retrieved project');

    if (retrieved.length === 0){
      let records = [];
      for (let i = 0; i < 15; i++){
        records.push({companyName: `${genName()} Inc.`, project_id:v4(), year:1990+Math.floor(Math.random()*30), link:'PROJECT'});
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

  return Object.fromEntries(loaded.map(({loadPoint, name, ...rest}) => [name, {name, ...rest}]))
}

module.exports = {fetchDir}