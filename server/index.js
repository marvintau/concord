var Window = require('window');
global.window = new Window();

const fs = require('fs').promises;

const Path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Serve = require('koa-static');
const Send = require('koa-send');
const Router = require('@koa/router');
const Multer = require('@koa/multer');

const exportExcel = require('./xlsx-export');
const generateDocs = require('./generate-docs');

const DataTables = require('./tables');

// const uploadProc = require('./upload-proc');
// const retrieveProc = require('./retrieve-proc');
// const updateProc = require('./update-proc');

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
  console.log('PULLING', data_name);
  
  try {

    console.log(DataTables[data_name], data_name, 'retireve');

    if (DataTables[data_name].retrieve === undefined){
      console.log('DEAD_NOT_IMPL_PULL', data_name);
      throw {code: 'DEAD_NOT_IMPL_PULL'}
    }
    ctx.body = await DataTables[data_name].retrieve(ctx.request.body);
  } catch (error) {
    console.log(error, 'pull error code');
    ctx.body = {error: error.code || 'DEAD_UNKNOWN_FETCH_ERROR'}

  }
})

router.post('/push/:data_name', async ctx => {
  const {data_name} = ctx.params;
  try {
    if (DataTables[data_name].update === undefined){
      throw {code: 'DEAD_NOT_IMPL_PUSH'}
    }
    ctx.body = await DataTables[data_name].update(ctx.request.body);
  } catch (error) {
    console.log(error);
    const {code} = error;
    ctx.body = {error: code || 'DEAD_UNKNOWN_PUSH_ERROR'}
  }
})

router.post('/export/:data_name', async ctx => {
  const {data_name} = ctx.params;
  const {currArgs} = ctx.request.body;
  const exported = await exportExcel(data_name, currArgs);
  ctx.body = exported;
})

router.post('/generate-letters', async ctx => {
  const {project_id, project_name} = ctx.request.body;
  console.log('generaate reached here');
  try{
    await generateDocs(project_id, project_name);
    const buffer = await fs.readFile(`generated/${project_id}/${project_name}.zip`);
    ctx.body = buffer;
  } catch (error) {
    ctx.body = {error: 'SERVER'};
  }
})

router.post('/upload/:data_name', upload.single('file'), async ctx => {
  const {data_name} = ctx.params;
  console.log(data_name, ctx.request.body, 'uploaded');
  const file = ctx.request.file;
  try{
    if (DataTables[data_name].upload === undefined){
      throw {code: 'DEAD_NOT_IMPL_UPLOAD'}
    }
    const res = await DataTables[data_name].upload(file.buffer, ctx.request.body);
    ctx.body = res;
  } catch (error){

    console.log(error, 'on upload')
    const {code} = error;
    ctx.body = {error: code || 'DEAD_UNKNOWN_UPLOAD_ERROR'}
  }
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

app.use(BodyParser({
  formLimit: 524288000,
  jsonLimit: 524288000,
  textLimit: 524288000
}));
app.use(router.routes());

app.use(Serve(publicPath));

app.use(async (ctx, next) => {
  console.log(ctx.response.status);
  if (parseInt(ctx.response.status) === 404){
    await Send(ctx, 'index.html', {root: publicPath});
  }
});

app.listen(port);