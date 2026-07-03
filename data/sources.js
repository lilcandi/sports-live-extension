// ============================================================
// 中文内容源配置 - 知乎、虎扑、微博、新闻聚合
// ============================================================

const CONTENT_SOURCES = {
  // 微博热搜 - 通过 ALAPI 免费API
  weibo: {
    name: '微博热搜',
    icon: '📢',
    enabled: true,
    url: 'https://v2.alapi.cn/api/new/wbtop',
    method: 'GET',
    params: { num: 20, token: '' },  // token 需用户在设置中填写
    interval: 10, // 分钟
    filter: ['体育', '电竞', 'NBA', 'LOL', 'LPL', '足球', '篮球', 'CS2', 'Valorant', 'F1', '网球', '拳击', 'UFC', '中超', '欧冠', '英超', '世界杯', 'MSI', 'S赛', 'TI', '无畏契约', 'KPL', 'CBA', 'NFL', 'MLB'],
    parser: 'alapi_weibo',
    needsToken: true,
    tokenUrl: 'https://v2.alapi.cn/',
  },

  // 知乎热榜 - 通过 RSSHub
  zhihu: {
    name: '知乎热榜',
    icon: '💡',
    enabled: true,
    url: 'https://rsshub.app/zhihu/hot',
    method: 'GET',
    params: {},
    interval: 15, // 分钟
    filter: ['体育', '电竞', '足球', '篮球', '英雄联盟', 'LOL', 'NBA', 'LPL', 'LCK', '世界杯', '欧冠', '​​​CS2', '无畏契约', 'Dota2', 'TI', 'F1', '网球', '拳击', 'MSI', 'S赛', '​​​Valorant'],
    parser: 'rsshub_zhihu',
    needsToken: false,
  },

  // 知乎话题 - 电竞话题
  zhihu_esports: {
    name: '知乎电竞话题',
    icon: '🎮',
    enabled: false,
    url: 'https://rsshub.app/zhihu/topic/19551206',
    method: 'GET',
    params: {},
    interval: 30,
    filter: [],
    parser: 'rsshub_zhihu',
    needsToken: false,
  },

  // 虎扑步行街
  hupu: {
    name: '虎扑论坛',
    icon: '🏀',
    enabled: true,
    url: 'https://bbs.hupu.com/all-gambia',
    method: 'GET',
    params: {},
    interval: 15,
    filter: ['NBA', 'LOL', '足球', '篮球', '电竞', 'LPL', 'S赛', '欧冠', '英超', '​​​中超', 'CBA', '英雄联盟', 'CS2', 'TI', '无畏契约', '网球', 'F1', '拳击', 'UFC'],
    parser: 'html_hupu',
    needsToken: false,
  },

  // 虎扑电竞专区
  hupu_esports: {
    name: '虎扑电竞',
    icon: '🎯',
    enabled: true,
    url: 'https://bbs.hupu.com/e-sports',
    method: 'GET',
    params: {},
    interval: 15,
    filter: [],
    parser: 'html_hupu',
    needsToken: false,
  },

  // 头条新闻-体育
  toutiao: {
    name: '头条体育新闻',
    icon: '📰',
    enabled: false,
    url: 'http://v.juhe.cn/toutiao/index',
    method: 'GET',
    params: { type: 'tiyu', key: '' },  // key 需用户在设置中填写
    interval: 10,
    filter: [],
    parser: 'juhe_news',
    needsToken: true,
    tokenUrl: 'https://www.juhe.cn/',
  },
};

// 默认内容源配置
const DEFAULT_SOURCE_SETTINGS = {
  weibo:         { enabled: true,  interval: 10 },
  zhihu:         { enabled: true,  interval: 15 },
  zhihu_esports: { enabled: false, interval: 30 },
  hupu:          { enabled: true,  interval: 15 },
  hupu_esports:  { enabled: true,  interval: 15 },
  toutiao:       { enabled: false, interval: 10 },
};

// API Tokens
const DEFAULT_TOKENS = {
  alapi:   '',  // https://v2.alapi.cn/ 扫码关注公众号获取
  juhe:    '',  // https://www.juhe.cn/ 注册获取
};