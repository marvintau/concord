const fs = require('fs').promises;
const Path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Serve = require('koa-static');
const Router = require('@koa/router');
const Multer = require('@koa/multer');

const exportExcel = require('./xlsx-export');
const dataProc = require('./data-proc');

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
      children: ['Preface']
    },
    Preface: {
      desc: '次页',
      children: ['TreeList', 'Balance', 'ReferredTreeList']
    },
    TreeList: {
      desc: '树形表'
    },
    Balance: {
      desc: '余额表'
    },
    ReferredTreeList: {
      desc: '现金流量表'
    }
  }
}

router.get('/pull/:data_name', async ctx => {
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

router.get('/push/:data_name', ctx => {
  data.example_table = ctx.request.body;
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