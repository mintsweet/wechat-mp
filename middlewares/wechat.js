'use strict'

var Promise = require('bluebird');
// Promise化request方法使其具有then方法
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');

// 用于配置接口的Url对象
var prefix = 'https://api.weixin.qq.com/cgi-bin/'; // url前缀
var dataPrefix = 'https://api.weixin.qq.com/datacube/'; // 数据分析url前缀
var api = {
  // 全局票据
  accessToken: prefix + 'token?grant_type=client_credential', // access_token获取
  // js-sdk的临时票据
  jsapiTicket: prefix + 'ticket/getticket?', // jsapi_ticket获取
  // 自定义菜单
  menu: {
    create: prefix + 'menu/create?', // 自定义菜单创建
    get: prefix + 'menu/get?', // 自定义菜单查询
    delete: prefix + 'menu/delete?', // 自定义菜单删除
    addconditional: prefix + 'menu/addconditional?', // 创建个性化菜单
    delconditional: prefix + 'menu/delconditional?', // 删除个性化菜单
    trymatch: prefix + 'menu/trymatch?', // 测试个性化菜单匹配结果
    getCurrent: prefix + 'get_current_selfmenu_info?' // 获取自定义菜单配置
  },
  // 临时素材
  media: {
    upload: prefix + 'media/upload?', // 新增临时素材
    get: prefix + 'media/get?' // 获取临时素材
  },
  // 永久素材
  material: {
    addNews: prefix + 'material/add_news?', // 新增永久图文素材
    uploadImg: prefix + 'media/uploadimg?', // 上传图文消息内的图片获取URL
    addMaterial: prefix + 'material/add_material?', // 新增其他类型永久素材
    getMaterial: prefix + 'material/get_material?', // 获取永久素材
    delMaterial: prefix + 'material/del_material?', // 删除永久素材
    updateNews: prefix + 'material/update_news?', // 修改永久图文素材
    getMaterialCount: prefix + 'material/get_materialcount?', // 获取永久素材总数
    batchGetMaterial: prefix + 'material/batchget_material?' // 获取永久素材列表
  },
  // 用户标签管理
  tags: {
    create: prefix + 'tags/create?', // 创建标签
    get: prefix + 'tags/get?', // 获取以创建标签
    update: prefix + 'tags/update?', // 编辑标签
    delete: prefix + 'tags/delete?', // 删除标签
    userTag: prefix + 'user/tag/get?', // 获取标签下粉丝列表
    batchTagging: prefix + 'tags/members/batchtagging?', // 批量为用户打标签
    batchUnTagging: prefix + 'tags/members/batchuntagging?', // 批量为用户取消标签
    getIdList: prefix + 'tags/getidlist?' // 获取用户身上的标签列表
  },
  // 用户信息管理
  user: {
    updateRemark: prefix + 'user/info/updateremark?', // 设置用户备注名
    info: prefix + 'user/info?', // 获取用户基本信息
    batchGet: prefix + 'user/info/batchget?', // 批量获取用户基本信息
    get: prefix + 'user/get?', // 获取用户列表
    getBlackList: prefix + 'tags/members/getblacklist?', // 获取用户黑名单列表
    batchBlackList: prefix + 'tags/members/batchblacklist?', // 拉黑用户
    batchUnBlackList: prefix + 'tags/members/batchunblacklist?' // 取消拉黑用户
  },
  // 账号管理
  qrcode: {
    create: prefix + 'qrcode/create?', // 创建二维码ticket
    showqrcode: prefix + 'showqrcode?', // 通过ticket换取二维码
    shorturl: prefix + 'shorturl?' // 长链接转短链接接口
  },
  // 数据分析
  datacube: {
    getusersummary: dataPrefix + 'getusersummary?', // 获取用户增减数据
    getusercumulate: dataPrefix + 'getusercumulate?', // 获取累计用户数据
    getarticlesummary: dataPrefix + 'getarticlesummary?', // 获取图文群发每日数据
    getarticletotal: dataPrefix + 'getarticletotal?', // 获取图文群发总数据
    getuserread: dataPrefix + 'getuserread?', // 获取图文统计数据
    getuserreadhour: dataPrefix + 'getuserreadhour?', // 获取图文统计分时数据
    getusershare: dataPrefix + 'getusershare?', // 获取图文分享转发数据
    getusersharehour: dataPrefix + 'getusersharehour?', // 获取图文分享转发分时数据
    getupstreammsg: dataPrefix + 'getupstreammsg?', // 获取消息发送概况数据
    getupstreammsghour: dataPrefix + 'getupstreammsghour?', // 获取消息分送分时数据
    getupstreammsgweek: dataPrefix + 'getupstreammsgweek?', // 获取消息发送周数据
    getupstreammsgmonth: dataPrefix + 'getupstreammsgmonth?', // 获取消息发送月数据
    getupstreammsgdist: dataPrefix + 'getupstreammsgdist?', // 获取消息发送分布数据
    getupstreammsgdistweek: dataPrefix + 'getupstreammsgdistweek?', // 获取消息发送分布周数据
    getupstreammsgdistmonth: dataPrefix + 'getupstreammsgdistmonth?', //获取消息发送分布月数据
    getinterfacesummary: dataPrefix + 'getinterfacesummary?', // 获取接口分析数据
    getinterfacesummaryhour: dataPrefix + 'getinterfacesummaryhour?' // 获取接口分析分时数据
  }
}

// 初始化构造函数
function Wechat(opts) {
  var that = this;
  this.appID = opts.appID;
  this.appSecret = opts.appSecret;
  // 获取票据的方法
  this.getAccessToken = opts.getAccessToken;
  // 存储票据的方法
  this.saveAccessToken = opts.saveAccessToken;
  // 获取jsapi_ticket票据的方法
  this.getJsapiTicket = opts.getJsapiTicket;
  // 存储jsapi_ticket票据的方法
  this.saveJsapiTicket = opts.saveJsapiTicket;

  // 取得当前票据信息
  this.fetchAccessToken();
}

// 取得有效票据
Wechat.prototype.fetchAccessToken = function (data) {
  var that = this;

  if (this.access_token && this.expires_in) {
    // 检查票据是否有效
    if (this.isValidAccessToken(this)) {
      return Promise.resolve(this);
    }
  }

  return this.getAccessToken() // 此处我使用单独的一个文件存储access_token
      .then(function(data) {
        try {
          data = JSON.parse(data);
        } catch(e) {
          // 票据不存在或者不合法时捕获异常，更新票据
          return that.updateAccessToken();
        }
        // 取得票据后检查票据是否合法且在有效期内
        if (that.isValidAccessToken(data)) {
          return Promise.resolve(data);
        } else {
          // 不合法或者不在有效期内继续更新票据
          return that.updateAccessToken();
        }
      })
      .then(function(data) {
        // 检查完毕后得到的data将是合法且有效的票据，保存在此对象上的实例上
        that.access_token = data.access_token;
        // 除了access_token外，还有一个过期字段expires_in
        that.expires_in = data.expires_in;
        // 调用私有方法，存入票据
        that.saveAccessToken(data);

        return Promise.resolve(data);
      });
}

// 用于验证票据是否过期的方法
Wechat.prototype.isValidAccessToken = function (data) {
  // 这些值不存在时，不合法返回false
  if (!data || !data.access_token || !data.expires_in) return false;

  // 取得票据和过期时间
  var access_token = data.access_token;
  var expires_in = data.expires_in;
  // 取得当前时间
  var now_time = (new Date().getTime());

  // 判断当前时间是否小于过期时间，小于说明未过期
  if (now_time < expires_in) return true;
  else return false;
}

// 用于票据的更新方法
Wechat.prototype.updateAccessToken = function () {
  var appID = this.appID;
  var appSecret = this.appSecret;
  // 请求票据的地址
  var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

  return new Promise(function(resolve, reject) {
    request({url: url, json: true}).then(function(response) {
      var data = response.body;
      var now_time = (new Date().getTime());
      // 生成新的过期时间，此处使票据在两小时的基础上提前二十秒刷新，考虑网络延迟的原因。
      var expires_in = now_time + (data.expires_in - 20) * 1000;
      // 新的过期时间覆盖之前的
      data.expires_in = expires_in;
      // 往下继续传递数据
      resolve(data);
    });
  });
}

// 自定义菜单创建接口
Wechat.prototype.createMenu = function (menu) {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken() // 拿到有效票据
      .then(function(data) {
        // 拼接url
        var url = api.menu.create + 'access_token=' + data.access_token;
        // 发送请求
        request({method: 'POST', url: url, body: menu, json:true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Create Menu Fails!');
          }
        }).catch(function(err) {
          reject(err);
        });
      });
  });
}

// 自定义菜单查询接口
Wechat.prototype.getMenu = function () {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.menu.get + 'access_token' + data.access_token;

        // request默认为GET方法
        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Menu Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 自定义菜单删除接口
Wechat.prototype.deleteMenu = function () {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.menu.delete + 'access_token' + data.access_token;

        // request默认为GET方法
        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Delete Menu Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 创建个性化菜单接口
Wechat.prototype.addconditionalMenu = function (menu) {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        // 拼接url
        var url = api.menu.addconditionalMenu + 'access_token=' + data.access_token;
        // 发送请求
        request({method: 'POST', url: url, body: menu, json:true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Addconditional Menu Fails!');
          }
        }).catch(function(err) {
          reject(err);
        });
      });
  });
}

// 删除个性化菜单接口
Wechat.prototype.delconditionalMenu = function (menuId) {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        // 拼接url
        var url = api.menu.delconditional + 'access_token=' + data.access_token;
        // 组装请求体
        var form = {
          menuid: menuId
        }
        // 发送请求
        request({method: 'POST', url: url, body: form, json:true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Delconditional Menu Fails!');
          }
        }).catch(function(err) {
          reject(err);
        });
      });
  });
}

// 测试个性化菜单匹配结果接口
Wechat.prototype.trymatchMenu = function (userId) {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        // 拼接url
        var url = api.menu.trymatch + 'access_token=' + data.access_token;
        // 组装请求体
        var form = {
          user_id: userId
        }
        // 发送请求
        request({method: 'POST', url: url, body: form, json:true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Trymatch Menu Fails!');
          }
        }).catch(function(err) {
          reject(err);
        });
      });
  });
}

// 获取自定义菜单配置接口
Wechat.prototype.getCurrentMenu = function () {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.menu.getCurrentMenu + 'access_token' + data.access_token;

        // request默认为GET方法
        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('GetCurrent Menu Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 新增临时素材接口
Wechat.prototype.uploadMedia = function(type, media) {
  var that = this;
  // 取得临时素材文件装入form
  var form = {
    media: fs.createReadStream(media)
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.media.upload + 'access_token=' + data.access_token + '&type=' + type;

        request({ method: 'POST', url: url, formData: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Upload Media Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取临时素材接口
Wechat.prototype.getMedia = function (mediaId) {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.media.upload + 'access_token=' + data.access_token + '&media_id=' + mediaId;

        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Media Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 新增永久素材接口
Wechat.prototype.addMaterial = function (type, material) {
  var that = this;
  var form = {};

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var options = {
          method: 'POST',
          json: true
        };
        var url;
        // 判断是否为图文消息内的图片
        if (type === 'pic') {
          url = api.material.uploadImg + 'access_token=' + data.access_token;
          form.media = fs.createReadStream(material);
          options.formData = form;
          options.url = url;
        } else if (type === 'news') { // 图文消息类型永久素材
          url = api.material.addNews + 'access_token=' + data.access_token;
          form = material;
          options.body = material;
          options.url = url;
        } else { // 其他类型永久素材
          url = api.material.addMaterial + 'access_token=' + data.access_token + '&type=' + type;
          form.media = fs.createReadStream(material);
          options.formData = form;
          options.url = url;
        }

        request(options).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Add Material Fails');
          }
        }).catch(function(err) {
          reject(err);
        });
      });
  });
}

// 获取永久素材接口
Wechat.prototype.getMaterial = function (mediaId) {
  var that = this;
  var form = {
    media_id: mediaId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.material.getMaterial + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Material Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 删除永久素材接口
Wechat.prototype.delMaterial = function (mediaId) {
  var that = this;
  var form = {
    media_id: mediaId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.material.delMaterial + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Delete Material Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 修改永久图文素材接口
Wechat.prototype.updateNewsMaterial = function (mediaId, index, news) {
  var that = this;
  var form = {
    media_id: mediaId,
    index: index,
    articles: news
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.material.updateNews + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Update News Material Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取永久素材总数接口
Wechat.prototype.getMaterialCount = function () {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.material.getMaterialCount + 'access_token=' + data.access_token;

        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Material Count Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取永久素材列表
Wechat.prototype.batchGetMaterial = function (options) {
  var that = this;

  options.type = options.type || 'image';
  options.offset = options.offset || 0;
  options.count = options.count || 1;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.material.batchGetMaterial + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: options, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Batch Get Material Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 创建标签接口
Wechat.prototype.createTags = function (name) {
  var that = this;
  var form = {
    tag: {
      name: name
    }
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.create + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Create Tag Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取公众号已创建的标签接口
Wechat.prototype.getTags = function () {
  var that = this;

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.get + 'access_token=' + data.access_token;

        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Tags Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 编辑标签接口
Wechat.prototype.updateTags = function (tagId, newName) {
  var that = this;
  var form = {
    tag: {
      id: tagId,
      name: newName
    }
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.update + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Update Tag Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 删除标签接口
Wechat.prototype.deleteTags = function (tagId) {
  var that = this;
  var form = {
    tag: {
      id: tagId
    }
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.delete + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Delete Tag Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取标签下粉丝列表接口
Wechat.prototype.userTags = function (tagId, nextOpenId) {
  var that = this;
  var form = {
      tagid: tagId,
      next_openid: nextOpenId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.userTag + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('User Tag Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 批量为用户打标签接口
Wechat.prototype.batchTagging = function (openIdList, tagId) {
  var that = this;
  var form = {
    openid_list: openIdList,
    tagid: tagId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.batchTagging + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Batch Tagging Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 批量为用户取消标签接口
Wechat.prototype.batchUnTagging = function (openIdList, tagId) {
  var that = this;
  var form = {
    openid_list: openIdList,
    tagid: tagId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.batchUnTagging + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Batch Un Tagging Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取用户身上的标签列表
Wechat.prototype.getIdListTags = function (openId) {
  var that = this;
  var form = {
    openid: openId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.tags.getIdList + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Id List Tags Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 设置用户备注名接口
Wechat.prototype.updateRemarkUser = function (openId, remark) {
  var that = this;
  var form = {
    openid: openId,
    remark: remark
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.updateRemark + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Update Remark User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取用户基本信息接口
Wechat.prototype.infoUser = function (openId, lang) {
  var that = this;

  lang = lang || 'zh-CN';

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.info + 'access_token=' + data.access_token + '&openid=' + openId + '&lang=' + lang;

        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Info User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 批量获取用户基本信息接口
Wechat.prototype.batchGetUser = function (openIds) {
  var that = this;
  var form = {
    user_list: openIds
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.batchGet + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Batch Get User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取用户列表接口
Wechat.prototype.getUser = function (nextOpenId) {
  var that = this;
  nextOpenId = nextOpenId || '';

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.get + 'access_token=' + data.access_token + '&next_openid=' + nextOpenId;

        request({ url: url, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 获取公众号的黑名单列表接口
Wechat.prototype.getBlackListUser = function (openId) {
  var that = this;
  var form = {
    begin_openid: openId || ''
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.getBlackList + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Black List User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 拉黑用户接口
Wechat.prototype.batchBlackListUser = function (openIds) {
  var that = this;
  var form = {
    openid_list: openIds
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.batchBlackList + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Batch Black List User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 取消拉黑用户接口
Wechat.prototype.batchUnBlackListUser = function (openIds) {
  var that = this;
  var form = {
    openid_list: openIds
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.batchUnBlackList + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Batch Un Black List User Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 创建二维码ticket接口
Wechat.prototype.createQrcode = function (qr) {
  var that = this;
  // 在对qr进行处理的时候不在后台处理，为了方便我们观察临时二维码和永久二维码
  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.qrcode.create + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: qr, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Create Qrcode Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 通过ticket换取二维码接口
Wechat.prototype.showQrcode = function (ticket) {
  return api.qrcode.showqrcode + 'ticket=' + encodeURI(ticket);
}

// 长链接转短链接接口
Wechat.prototype.shortUrl = function (action, url) {
  var that = this;
  action = action || 'long2short';
  var form = {
    action: action,
    long_url: url
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.qrcode.shorturl + 'access_token=' + data.access_token;

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Short Url Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 用户分析数据接口
Wechat.prototype.getUserData = function (beginDate, endDate, type) {
  var that = this;

  type = type || 'summary';

  if ((new Date(beginDate).getTime() - new Date(endDate).getTime()) > 0) return;

  var form = {
    begin_date: beginDate,
    end_date: endDate
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url;

        if (type === 'summary') {
          url = api.datacube.getusersummary + 'access_token=' + data.access_token;
        }

        if (type === 'cumulate') {
          url = api.datacube.getusercumulate + 'access_token=' + data.access_token;
        }

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get User Data Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 图文数据分析接口
Wechat.prototype.getArticleData = function (beginDate, endDate, type) {
  var that = this;

  type = type || 'summary';

  if ((new Date(beginDate).getTime() - new Date(endDate).getTime()) > 0) return;

  var form = {
    begin_date: beginDate,
    end_date: endDate
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url;

        if (type === 'total') {
          url = api.datacube.getarticletotal + 'access_token=' + data.access_token;
        } else if (type === 'read') {
          url = api.datacube.getuserread + 'access_token=' + data.access_token;
        } else if (type === 'readhour') {
          url = api.datacube.getuserreadhour + 'access_token=' + data.access_token;
        } else if (type === 'share') {
          url = api.datacube.getusershare + 'access_token=' + data.access_token;
        } else if (type === 'sharehour') {
          url = api.datacube.getusersharehour + 'access_token=' + data.access_token;
        } else {
          url = api.datacube.getarticlesummary + 'access_token=' + data.access_token;
        }

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Article Data Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 消息分析数据接口
Wechat.prototype.getUpstreamData = function (beginDate, endDate, type) {
  var that = this;

  type = type || 'msg';

  if ((new Date(beginDate).getTime() - new Date(endDate).getTime()) > 0) return;

  var form = {
    begin_date: beginDate,
    end_date: endDate
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url;

        if (type === 'msghour') {
          url = api.datacube.getupstreammsghour + 'access_token=' + data.access_token;
        } else if (type === 'msgweek') {
          url = api.datacube.getupstreammsgweek + 'access_token=' + data.access_token;
        } else if (type === 'msgmonth') {
          url = api.datacube.getupstreammsgmonth + 'access_token=' + data.access_token;
        } else if (type === 'msgdist') {
          url = api.datacube.getupstreammsgdist + 'access_token=' + data.access_token;
        } else if (type === 'msgdistweek') {
          url = api.datacube.getupstreammsgdistweek + 'access_token=' + data.access_token;
        } else if (type === 'msgdistmonth') {
          url = api.datacube.getupstreammsgdistmonth + 'access_token=' + data.access_token;
        } else {
          url = api.datacube.getupstreammsg + 'access_token=' + data.access_token;
        }

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Upstream Data Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 接口分析数据接口
Wechat.prototype.getInterfaceData = function (beginDate, endDate, type) {
  var that = this;

  type = type || 'summary';

  if ((new Date(beginDate).getTime() - new Date(endDate).getTime()) > 0) return;

  var form = {
    begin_date: beginDate,
    end_date: endDate
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url;

        if (type === 'summary') {
          url = api.datacube.getinterfacesummary + 'access_token=' + data.access_token;
        }

        if (type === 'summaryhour') {
          url = api.datacube.getinterfacesummaryhour + 'access_token=' + data.access_token;
        }

        request({ method: 'POST', url: url, body: form, json: true}).then(function(response) {
          var _data = response.body;

          if (_data) {
            resolve(_data);
          } else {
            throw new Error('Get Interface Data Fails!');
          }

        }).catch(function(err) {
            reject(err);
        });
      });
  });
}

// 回复的方法，此时已经存储了回复的消息
Wechat.prototype.reply = function () {
  var content = this.body;
  var message = this.weixin;

  var xml = util.tpl(content, message);

  this.status = 200;
  this.type = 'application/xml';
  this.body = xml;
}

// 取得有效jsapi_ticket临时票据
Wechat.prototype.fetchJsapiTicket = function (access_token) {
  var that = this;

  return this.getJsapiTicket()
      .then(function(data) {
        try {
          data = JSON.parse(data);
        } catch(e) {
          // 票据不存在或者不合法时捕获异常，更新票据
          return that.updateJsapiTicket(access_token);
        }
        // 取得票据后检查票据是否合法且在有效期内
        if (that.isValidJsapiTicket(data)) {
          return Promise.resolve(data);
        } else {
          // 不合法或者不在有效期内继续更新票据
          return that.updateJsapiTicket(access_token);
        }
      })
      .then(function(data) {

        that.saveJsapiTicket(data);

        return Promise.resolve(data);
      });
}

// 用于验证jsapi_ticket临时票据是否过期的方法
Wechat.prototype.isValidJsapiTicket = function (data) {
  // 这些值不存在时，不合法返回false
  if (!data || !data.ticket || !data.expires_in) return false;

  // 取得jsapi_ticket临时票据和过期时间
  var jsapi_ticket = data.jsapi_ticket;
  var expires_in = data.expires_in;
  // 取得当前时间
  var now_time = (new Date().getTime());

  // 判断当前时间是否小于过期时间，小于说明未过期
  if (jsapi_ticket && now_time < expires_in) return true;
  else return false;
}

// 用于jsapi_ticket临时票据的更新方法
Wechat.prototype.updateJsapiTicket = function (accessToken) {
  // 请求jsapi_ticket临时票据的地址
  var url = api.jsapiTicket + 'access_token=' + accessToken + '&type=jsapi';

  return new Promise(function(resolve, reject) {
    request({url: url, json: true}).then(function(response) {
      var data = response.body;
      var now_time = (new Date().getTime());
      // 生成新的过期时间，此处使票据在两小时的基础上提前二十秒刷新，考虑网络延迟的原因。
      var expires_in = now_time + (data.expires_in - 20) * 1000;
      // 新的过期时间覆盖之前的
      data.expires_in = expires_in;
      // 往下继续传递数据
      resolve(data);
    });
  });
}

module.exports = Wechat;
