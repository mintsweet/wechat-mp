'use strict'

var path = require('path');
var wx = require('./index');
var wechatApi = wx.getWechat();

// 回复规则
exports.reply = function* (next) {
  var message = this.weixin;

  if (message.MsgType === 'event') {

    if (message.Event === 'subscribe') {
      this.body = '山有木兮木有枝，心悦君兮君不知';
    } else if (message.Event === 'unsubscribe') {

    } else if (message.Event === 'SCAN') {

    } else if (message.Event === 'LOCATION') {

    } else if (message.Event === 'CLICK') {

    } else if (message.Event === 'VIEW') {

    }
  } else if (message.MsgType === 'text') {
    var content = message.Content;
    var reply = '查看帮助回复help或者帮助！';

    if (content === 'help' || content === '帮助') {
      reply = 'Welcome to an other home:\n' +
              '1. \n' +
              '2. \n' +
              '3. \n' +
              '<a href="http://www.yujunren.com/">青湛</a>';
    } else if (content === '1') {

    } else if (content === '2') {

    } else if (content === '3') {

    } else if (content === '4') {

    }

    this.body = reply;

  } else if (message.MsgType === 'image') {

  } else if (message.MsgType === 'vocie') {

  } else if (message.MsgType === 'video') {

  } else if (message.MsgType === 'shortvideo') {

  } else if (message.MsgType === 'location') {

  } else if (message.MsgType === 'link') {

  }

  yield next;
}
