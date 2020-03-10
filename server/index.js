const fs = require('fs').promises;
const Path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Serve = require('koa-static');
const Router = require('@koa/router');
const Multer = require('@koa/multer');

const exportExcel = require('./xlsx-export');
const dataProc = require('./data-proc');
const postProc = require('./post-proc');
const {retrieve} = require('./database');

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
      tableName: 'Project',
      children: ['Project'],
      colSpecs: {
        year: {desc: '年度', width: 1, isSortable: false, isFilterable: true, cellType: 'Year'},
        name: {desc: '项目（企业）名称', width: 8, isSortable: false, isFilterable: true},
        link: {desc: '导航', width: 2, isSortable: false, isFilterable: false, cellType:'Link'},
      }
    },
    Project: {
      desc: '项目页',
      children: ['TreeList', 'Balance', 'ReferredTreeList'],
    },
    TreeList: {
      desc: '树形表'
    },
    Balance: {
      desc: '余额表'
    },
    ReferredTreeList: {
      desc: '现金流量表',
      type: 'REFT',
      dataType: 'FILE',
      refsType: 'FILE',
      tableName: 'CASHFLOW_WORKSHEET',
      referredName: 'BALANCE',
      colSpecs: {
        ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true, cellType:'Ref'}
      }      
    }
  }
}

router.get('/pull/FILE/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    const data = await fs.readFile(Path.resolve('./file_store', data_name))
    ctx.body = JSON.parse(data.toString());
  } catch (error) {
    if (error.code === 'ENOENT'){
      console.log('not found', data_name)
      ctx.body = {error: 'DEAD_NOT_FOUND'}
    }
  }
})

router.get('/pull/DATA/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    const data = await retrieve('table', data_name)
    ctx.body = data;
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
  const file = ctx.request.file;
  const res = await dataProc(file.buffer, data_name);
  console.log(res, 'proc res')
  ctx.body = res;
})

router.post('/pages', ctx => {
  const {fetchPath} = ctx.request.body;
  ctx.body = dirs[fetchPath];
})

app.use(BodyParser());
app.use(router.routes());

app.use(Serve(publicPath));
app.listen(port);