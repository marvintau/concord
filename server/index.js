
const Path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Serve = require('koa-static');
const Router = require('@koa/router');
const Multer = require('@koa/multer');

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
      children: ['TreeList', 'FlatList', 'ReferredTreeList']
    },
    TreeList: {
      desc: '树形表'
    },
    FlatList: {
      desc: '普通表'
    },
    ReferredTreeList: {
      desc: '引用表'
    }
  }
}

router.post('/upload', upload.array('files', 10), ctx => {
  console.log('file', ctx.request.files);
  ctx.body = ctx.request.body;
})

router.post('/pages', ctx => {
  const {fetchPath} = ctx.request.body;
  ctx.body = dirs[fetchPath];
})

app.use(BodyParser());
app.use(router.routes());

app.use(Serve(publicPath));
app.listen(port);