const {insert, remove, retrieve} = require('./database');

const dirs = [
  {
    loadPoint: '/',
    name: 'Home',
    desc: '首页',
    type: 'TEXT',
    title: '你好!',
    content: ['当前测试版本未添加用户控制模组，可以直接进入项目页面'],
    children: ['ProjectList', 'GeneralConfigure'],
  },
  {
    loadPoint: '/',
    name: 'GeneralConfigure',
    desc: '通用配置',
    type: 'TEXT',
    title: '通用配置',
    content: ['包括适用于所有项目的设置，以及和系统相关的配置项目'],
    children: ['EquivalentCategory', 'PageConfiguration'],
  },
  {
    loadPoint: '/',
    name: 'PageConfiguration',
    desc: '页面导航',
    type: 'TEXT',
    title: '页面导航设置',
    content: ['在这里配置页面、数据表格'],
    // children: ['']
  },
  {
    loadPoint: '/',
    name: 'EquivalentCategory',
    desc: '等效科目名称',
    type: 'DATA',
    tableName: 'EQUIVALENT_NAMES',
    colSpecs: {
      categoryName: {desc: '科目名称', width: 1, isFilterable: true},
      equivalents: {desc: '等价的科目名称', width: 11},
    },
  },
  {
    loadPoint: '/',
    name: 'ProjectList',
    desc: '项目列表',
    type: 'DATA',
    tableName: 'PROJECT',
    colSpecs: {
      link: {desc: '--', width: 1, isFilterable: false, cellType:'Link'},
      year: {desc: '年度', width: 1, isFilterable: true},
      companyName: {desc: '项目（企业）名称', width: 10, isFilterable: true},
    },
    children: ['Project'],
  },
  {
    loadPoint: '/',
    name: 'Project',
    desc: '项目页',
    type: 'TEXT',
    title: {key: 'companyName'},
    content: '这里显示公司的摘要，左侧进入分类内容',
    tableName: undefined,
    colSpecs: undefined,
    children: ['Finance', 'Confirmation'],
  },
  {
    loadPoint: '/',
    name: 'Confirmation',
    desc: '函证管理',
    type: 'TEXT',
    title: '函证管理',
    content : ['函证相关内容。', '函证状态管理包括函证的生成、以及收发信息。函证模版管理包括不同类型询证函的模版的管理'],
    children: ['ConfirmationManagement', 'ConfirmationTemplateManagement'],
  },
  {
    loadPoint: '/',
    name: 'ConfirmationManagement',
    desc: '函证状态管理',
    type: 'DATA',
    tableName: 'CONFIRMATION_MANAGEMENT',
    colSpecs: {
      ID: {desc: '编号', width: 2, isFilterable: true},
      contact: {desc:'通信地址', width: 5, isFilterable: true, cellType: 'Address'},
      confStatus: {desc:'函证状态', width: 5, isFilterable: true, cellType: 'ConfStatus'}
    },
  },
  {
    loadPoint: '/',
    name: 'ConfirmationTemplateManagement',
    desc: '询证函模版管理',
    type: 'DATA',
    tableName: 'CONFIRMATION_TEMPLATE_MANAGEMENT',
    colSpecs: undefined,
  },
  {
    loadPoint: '/',
    name: 'Finance',
    desc: '财务与报表管理',
    type: 'TEXT',
    title: '财务与报表管理',
    content: '包含所有财务相关的信息，包括账目、余额表和各类报表',
    tableName: undefined,
    colSpecs: undefined,
    children: ['Balance', 'CashflowStatement'],
  },
  {
    loadPoint: '/',
    name: 'Balance',
    desc: '余额表',
    type: 'DATA',
    tableName: 'BALANCE',
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
    type: 'REFT',
    tableName: 'CASHFLOW_WORKSHEET',
    referredName: 'BALANCE',
    colSpecs: {
      ref: {desc: '条目', width: 11, isFilterable: true, cellType:'Ref'},
      edit: {desc: '编辑', width: 1, isFilterable: false, cellType:'Edit'},
    }      
  }
];

// for development stage only
(async () => {
  const result = await retrieve('table', 'dirs');
  console.log(result, 'resutl')

  if (result.length !== dirs.length){
    await remove({table: 'dirs'});
    for (let dir of dirs){
      await insert({table: 'dirs', ...dir});
    }
  }
})();

async function fetchDir(givenLoadPoint='/') {
  const dirs = await retrieve('table', 'dirs');
  const loaded = dirs.filter(({loadPoint}) => loadPoint === givenLoadPoint);

  return Object.fromEntries(loaded.map(({loadPoint, name, ...rest}) => [name, rest]))
}

module.exports = {fetchDir}