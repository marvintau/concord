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
const {fetchDir} = require('./dirs');

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


router.post('/pull/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    if (retrieveProc[data_name] === undefined){
      throw {code: 'NO_HANDLER'}
    }
    ctx.body = await retrieveProc[data_name](ctx.request.body);
  } catch (error) {
    console.log('yeah', data_name, error)

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

router.post('/pages', async ctx => {
  const {fetchPath} = ctx.request.body;
  ctx.body = await fetchDir(fetchPath);
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