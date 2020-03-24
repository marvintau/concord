const fs = require('fs').promises;
const Path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Serve = require('koa-static');
const Send = require('koa-send');
const Router = require('@koa/router');
const Multer = require('@koa/multer');

const exportExcel = require('./xlsx-export');

const uploadProc = require('./upload-proc');
const retrieveProc = require('./retrieve-proc');
const updateProc = require('./update-proc');

const {fetchDir} = require('./dirs');

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

console.log('Port: ', port, '  Public path: ', publicPath);

router.post('/pull/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    if (retrieveProc[data_name] === undefined){
      throw {code: 'NO_HANDLER'}
    }
    ctx.body = await retrieveProc[data_name](ctx.request.body);
  } catch (error) {
    console.log('error on pull', data_name, error)

    const msgs ={
      'NOT_FOUND' : 'DEAD_NOT_FOUND',
      'NO_HANDLER' : 'DEAD_NOT_IMPL'
    }

    ctx.body = {error: msgs[error.code]}
  }
})

router.post('/fetch/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    if (retrieveProc[data_name] === undefined){
      throw {code: 'NO_HANDLER'}
    }
    ctx.body = await retrieveProc[data_name](ctx.request.body, 'fetch');
  } catch (error) {
    console.log('error on fetch', data_name, error)

    const msgs ={
      'NOT_FOUND' : 'DEAD_NOT_FOUND',
      'NO_HANDLER' : 'DEAD_NOT_IMPL'
    }

    ctx.body = {error: msgs[error.code]}
  }
})

router.post('/push/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    await updateProc[data_name](ctx.request.body);
    ctx.body = {result: 'DONE'};
  } catch (error) {
    ctx.body = {error: error.code}
  }
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
  console.log(ctx.request.body, 'upload form');
  const file = ctx.request.file;
  const res = await uploadProc(file.buffer, data_name, ctx.request.body);
  // console.log(res, 'proc res')
  ctx.body = res;
})

router.post('/pages', async ctx => {
  const {fetchPath} = ctx.request.body;
  ctx.body = await fetchDir(fetchPath);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.url} ${ms}ms`);
});

app.use(BodyParser());
app.use(router.routes());

app.use(Serve(publicPath));

app.use(async (ctx, next) => {
  console.log(ctx.response.status);
  if (parseInt(ctx.response.status) === 404){
    await Send(ctx, 'index.html', {root: publicPath});
  }
});

app.listen(port);