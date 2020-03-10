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
      children: ['ProjectList'],
    },
    ProjectList: {
      desc: '项目列表',
      type: 'DATA',
      dataType: 'DATA',
      tableName: 'PROJECT',
      colSpecs: {
        year: {desc: '年度', width: 1, isSortable: false, isFilterable: true},
        companyName: {desc: '项目（企业）名称', width: 10, isSortable: false, isFilterable: true},
        link: {desc: '--', width: 1, isSortable: false, isFilterable: false, cellType:'Link'},
      },
      children: ['Project'],
    },
    Project: {
      desc: '项目页',
      type: 'TEXT',
      dataType: undefined,
      tableName: undefined,
      colSpecs: undefined,
      children: ['Balance', 'ReferredTreeList'],
    },
    Balance: {
      desc: '余额表',
      type: 'DATA',
      dataType: 'FILE',
      tableName: 'BALANCE',
      colSpecs: {
        ccode: {desc: '编码', width: 1, isSortable: false, isFilterable: true},
        ccode_name: {desc: '科目名称', width: 3, isSortable: false, isFilterable: true},
        mb: {desc: '期初', width: 2, isSortable: false, isFilterable: true, cellType:'Number'},
        md: {desc: '借方', width: 2, isSortable: false, isFilterable: true, cellType:'Number'},
        mc: {desc: '贷方', width: 2, isSortable: false, isFilterable: true, cellType:'Number'},
        me: {desc: '期末', width: 2, isSortable: false, isFilterable: true, cellType:'Number'},
      }
    },
    ReferredTreeList: {
      desc: '现金流量表',
      type: 'REFT',
      dataType: 'FILE',
      refsType: 'FILE',
      tableName: 'CASHFLOW_WORKSHEET',
      referredName: 'BALANCE',
      colSpecs: {
        ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true, cellType:'Ref'},
      }      
    }
  }
}

router.post('/pull/:data_name', async ctx => {
  const {data_name} = ctx.params;
  
  try {
    ctx.body = await retrieveProc[data_name](ctx.request.body);
  } catch (error) {
    if (error.code === 'ENOENT'){
      console.log('not found', data_name)
      ctx.body = {error: 'DEAD_NOT_FOUND'}
    }
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