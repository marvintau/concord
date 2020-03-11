const fs = require('fs').promises;
const Path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Serve = require('koa-static');
const Router = require('@koa/router');
const Multer = require('@koa/multer');

const exportExcel = require('./xlsx-export');
const dataProc = require('./xlsx-proc');
const postProc = require('./post-proc');
const retrieveProc = require('./retrieve-proc');
const {retrieve} = require('./database');

const {genName} = require('./nameGenerate');

const app = new Koa();
const router = new Router();
const upload = new Multer();

var {PORT: port, MODE: mode} = process.env;
port = parseInt(port);
!port && (port = 3000);

var publicPath;
if (mode !== 'production') {
  port += 1;
  publicPath = Path.join(__dirname, '../client/public');
} else {
  publicPath = Path.join(__dirname, '../client/build')
}

const dirs = {
  "/":{
    Home: {
      desc: '首页',
      type: 'TEXT',
      title: '你好!',
      content: ['当前测试版本未添加用户控制模组，可以直接进入项目页面'],
      children: ['ProjectList'],
    },
    ProjectList: {
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
    Project: {
      desc: '项目页',
      type: 'TEXT',
      title: {key: 'companyName'},
      content: '这里显示公司的摘要，左侧进入分类内容',
      tableName: undefined,
      colSpecs: undefined,
      children: ['Finance', 'Confirmation'],
    },
    Confirmation: {
      desc: '函证管理',
      type: 'TEXT',
      title: '函证管理',
      content : ['函证相关内容。', '函证状态管理包括函证的生成、以及收发信息。函证模版管理包括不同类型询证函的模版的管理'],
      children: ['ConfirmationManagement', 'ConfirmationTemplateManagement'],
    },
    ConfirmationManagement: {
      desc: '函证状态管理',
      type: 'DATA',
      tableName: 'CONFIRMATION_MANAGEMENT',
      colSpecs: {
        ID: {desc: '编号', width: 2, isFilterable: true},
        contact: {desc:'通信地址', width: 5, isFilterable: true, cellType: 'Address'},
        confStatus: {desc:'函证状态', width: 5, isFilterable: true, cellType: 'ConfStatus'}
      },
    },
    ConfirmationTemplateManagement: {
      desc: '询证函模版管理',
      type: 'DATA',
      tableName: 'CONFIRMATION_TEMPLATE_MANAGEMENT',
      colSpecs: undefined,
    },
    Finance: {
      desc: '财务与报表管理',
      type: 'TEXT',
      title: '财务与报表管理',
      content: '包含所有财务相关的信息，包括账目、余额表和各类报表',
      tableName: undefined,
      colSpecs: undefined,
      children: ['Balance', 'ReferredTreeList'],
    },
    Balance: {
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
    ReferredTreeList: {
      desc: '现金流量表',
      type: 'REFT',
      tableName: 'CASHFLOW_WORKSHEET',
      referredName: 'BALANCE',
      colSpecs: {
        ref: {desc: '条目', width: 11, isFilterable: true, cellType:'Ref'},
        edit: {desc: '编辑', width: 1, isFilterable: false, cellType:'Edit'},
      }      
    }
  }
}

router.post('/pull/:data_name', async ctx => {
  const {data_name} = ctx.params;
  
  try {
    if (retrieveProc[data_name] === undefined){
      throw {code: 'NO_HANDLER'}
    }
    ctx.body = await retrieveProc[data_name](ctx.request.body);
  } catch (error) {
    console.log('yeah', error)

    const msgs ={
      'ENOENT' : 'DEAD_NOT_FOUND',
      'NO_HANDLER' : 'DEAD_NOT_IMPL'
    }

    ctx.body = {error: msgs[error.code]}
  }
})

router.post('/push/DATA/:data_name', async ctx => {
  const {data_name} = ctx.params;
  await postProc[data_name](ctx.request.body);
  ctx.body = {result: 'DONE'};
})

router.post('/export', ctx => {
  const {cols, data} = ctx.request.body;

  const keys = Object.keys(cols);
  let prunedData = data.map(rec => {
    let newRec = {};
    for (let k of keys){
      newRec[cols[k]] = rec[k];
    }
    return newRec;
  })

  const exported = exportExcel(prunedData);
  // console.log(exported);
  ctx.body = exported;
})

router.post('/upload/:data_name', upload.single('file'), async ctx => {
  const {data_name} = ctx.params;
  console.log(data_name, 'upload');
  console.log(ctx.request.body, 'upload');
  const file = ctx.request.file;
  const res = await dataProc(file.buffer, data_name, ctx.request.body);
  // console.log(res, 'proc res')
  ctx.body = res;
})

router.post('/pages', ctx => {
  const {fetchPath} = ctx.request.body;
  ctx.body = dirs[fetchPath];
});


(async () => {

  const projects = await retrieve('table', 'Project');

  if (projects.length === 0){
    let records = [];
    for (let i = 0; i < 10; i++){
      records.push({ table:'Project', companyName: `${genName()} Inc.`, year:1990+Math.floor(Math.random()*30)});
    }
    await postProc['Project'](records);
  }

  const result = await retrieve('table', 'Project');
  console.log(result, 'init');

})();


app.use(BodyParser());
app.use(router.routes());

app.use(Serve(publicPath));
app.listen(port);