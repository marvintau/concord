'use strict';

const Hapi = require('@hapi/hapi');
const Path = require('path');
const Inert = require('inert');

const dir = {
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

// Simple way of handling port number given from environment variables.
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


const init = async () => {

  const server = Hapi.server({
    port,
    host: 'localhost',
    routes:{
      files: { relativeTo: publicPath }
    }
  });

  await server.register(Inert);

  server.route({
    method: 'POST',
    path: '/pages',
    handler: (req, h) => {
      return dir;
    }
  });

  server.route({
    method: 'GET',
    path: '/{any*}',
    handler: {directory: {path: '.', redirectToSlash: true}}
  });

  server.route({
    method: '*',
    path: '/{any*}',
    handler: function (request, h) {

        h.response`没有找到${request.param.any}对应的请求，可能是您输入了错误的地址`
        .code(404);
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
