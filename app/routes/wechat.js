'use strict'

var wt_check = require('../../middlewares/generator');
var reply = require('../../wx/weixin');
var wx = require('../../wx/index');

exports.hear = function *(next) {
  this.middle = wt_check(wx.wechatConfig.wechat, reply.reply);

  yield this.middle(next);
}
