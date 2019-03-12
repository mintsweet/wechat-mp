'use strict'

var path = require('path');
var util = require('../libs/util');
var Wechat = require('../middlewares/wechat');
var wechat_access_file = path.join(__dirname, '../config/wechat_access.txt');
var wechat_ticket_file = path.join(__dirname, '../config/wechat_ticket.txt');

var config = {
  wechat: {
    appID: 'xxxxxxxxxxxxxxxxxxx',
    appSecret: 'xxxxxxxxxxxxxxxxxxx',
    token: 'xxxxxxxxxxxxxxxxxxx',
    getAccessToken: function() {
      return util.readFileAsync(wechat_access_file);
    },
    saveAccessToken: function(data) {
      data = JSON.stringify(data);
      return util.writeFileAsync(wechat_access_file, data);
    },
    getJsapiTicket: function() {
      return util.readFileAsync(wechat_ticket_file);
    },
    saveJsapiTicket: function(data) {
      data = JSON.stringify(data);
      return util.writeFileAsync(wechat_ticket_file, data);
    }
  }
}

exports.wechatConfig = config;

exports.getWechat = function () {
  var wechatApi = new Wechat(config.wechat);

  return wechatApi;
}
