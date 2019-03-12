'use strict'

var Koa = require('koa');
var app = new Koa();
var path = require('path');

// 初始化菜单
var menu = require('./wx/menu');
var wx = require('./wx/index');
var wechatApi = wx.getWechat();

wechatApi.deleteMenu().then(function() {
  return wechatApi.createMenu(menu);
}).then(function(msg) {
  console.log(msg);
});

var Router = require('koa-router');
var router = new Router();

var wechat = require('./app/routes/wechat');
var about = require('./app/routes/about');

var views = require('koa-views');

app.use(views(__dirname + '/app/views', {
  extension: 'pug'
}));

router.get('/about', about.du);

router.get('/wx', wechat.hear);
router.post('/wx', wechat.hear);

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
console.log('listening: 3000');
