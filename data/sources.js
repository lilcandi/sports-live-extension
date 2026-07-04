// ============================================================
// 中文内容源配置 v2.1.0 - 扩展版
// 资讯源分两类：
// 1. 可爬取型：直接爬取网页内容（虎扑、懂球帝、直播吧等
// 2. 结论读取型：只读赛果结论（500.com等）
// ============================================================

const CONTENT_SOURCES = {
  // ===== 虎扑论坛 =====
  hupu_bxj: {
    name: '虎扑步行街',
    icon: '🏀',
    enabled: true,
    url: 'https://bbs.hupu.com/all-gambia',
    method: 'GET',
    type: 'html',
    parser: 'html_hupu_list',
    interval: 15,
    filter: ['NBA', '足球', '篮球', '电竞', 'LPL', 'S赛', '欧冠', '英超', '中超', 'CBA', '英雄联盟', 'CS2', '无畏契约'],
    needsToken: false,
  },
  hupu_esports: {
    name: '虎扑电竞',
    icon: '🎯',
    enabled: true,
    url: 'https://bbs.hupu.com/e-sports',
    method: 'GET',
    type: 'html',
    parser: 'html_hupu_list',
    interval: 15,
    filter: [],
    needsToken: false,
  },
  hupu_nba: {
    name: '虎扑NBA',
    icon: '🏀',
    enabled: true,
    url: 'https://bbs.hupu.com/nba',
    method: 'GET',
    type: 'html',
    parser: 'html_hupu_list',
    interval: 15,
    filter: [],
    needsToken: false,
  },
  hupu_football: {
    name: '虎扑足球',
    icon: '⚽',
    enabled: true,
    url: 'https://bbs.hupu.com/football',
    method: 'GET',
    type: 'html',
    parser: 'html_hupu_list',
    interval: 15,
    filter: [],
    needsToken: false,
  },

  // ===== 知乎热榜 =====
  zhihu_hot: {
    name: '知乎热榜',
    icon: '💡',
    enabled: true,
    url: 'https://rsshub.app/zhihu/hot',
    method: 'GET',
    type: 'rss',
    parser: 'rss_generic',
    interval: 20,
    filter: ['体育', '足球', '篮球', '电竞', '英雄联盟', 'NBA', 'LPL', '世界杯', '欧冠', 'CS2', '无畏契约', 'DOTA2', 'F1', '网球'],
    needsToken: false,
  },
  zhihu_esports: {
    name: '知乎电竞话题',
    icon: '🎮',
    enabled: false,
    url: 'https://rsshub.app/zhihu/topic/19551206',
    method: 'GET',
    type: 'rss',
    parser: 'rss_generic',
    interval: 30,
    filter: [],
    needsToken: false,
  },

  // ===== 微博热搜 =====
  weibo: {
    name: '微博热搜',
    icon: '📢',
    enabled: true,
    url: 'https://rsshub.app/weibo/search/hot',
    method: 'GET',
    type: 'rss',
    parser: 'rss_generic',
    interval: 10,
    filter: ['体育', '电竞', 'NBA', 'LOL', 'LPL', '足球', '篮球', 'CS2', 'Valorant', 'F1', '网球', '中超', '欧冠', '英超', '世界杯', 'MSI', 'S赛', 'TI', '无畏契约', 'KPL', 'CBA'],
    needsToken: false,
  },

  // ===== 懂球帝 =====
  dongqiudi: {
    name: '懂球帝',
    icon: '⚽',
    enabled: true,
    url: 'https://www.dongqiudi.com/',
    method: 'GET',
    type: 'html',
    parser: 'html_dongqiudi',
    interval: 15,
    filter: [],
    needsToken: false,
  },

  // ===== 直播吧 =====
  zhibo8: {
    name: '直播吧',
    icon: '📺',
    enabled: true,
    url: 'https://www.zhibo8.cc/',
    method: 'GET',
    type: 'html',
    parser: 'html_zhibo8',
    interval: 15,
    filter: [],
    needsToken: false,
  },

  // ===== 新浪体育 =====
  sina_sports: {
    name: '新浪体育',
    icon: '📰',
    enabled: false,
    url: 'https://sports.sina.com.cn/',
    method: 'GET',
    type: 'html',
    parser: 'html_sina',
    interval: 20,
    filter: [],
    needsToken: false,
  },

  // ===== 腾讯体育 =====
  qq_sports: {
    name: '腾讯体育',
    icon: '🏆',
    enabled: false,
    url: 'https://sports.qq.com/',
    method: 'GET',
    type: 'html',
    parser: 'html_qqsports',
    interval: 20,
    filter: [],
    needsToken: false,
  },

  // ===== 头条新闻（需API Key） =====
  toutiao: {
    name: '头条体育新闻',
    icon: '📱',
    enabled: false,
    url: 'http://v.juhe.cn/toutiao/index',
    method: 'GET',
    params: { type: 'tiyu', key: '' },
    type: 'api',
    parser: 'juhe_news',
    interval: 10,
    filter: [],
    needsToken: true,
    tokenUrl: 'https://www.juhe.cn/',
  },

  // ===== ALAPI 微博热搜（需Token） =====
  alapi_weibo: {
    name: 'ALAPI微博热搜',
    icon: '🔥',
    enabled: false,
    url: 'https://v2.alapi.cn/api/new/wbtop',
    method: 'GET',
    params: { num: 20, token: '' },
    type: 'api',
    parser: 'alapi_weibo',
    interval: 10,
    filter: ['体育', '电竞', 'NBA', 'LOL', 'LPL', '足球', '篮球'],
    needsToken: true,
    tokenUrl: 'https://v2.alapi.cn/',
  },
};

// 默认内容源配置
const DEFAULT_SOURCE_SETTINGS = {
  hupu_bxj:        { enabled: true,  interval: 15 },
  hupu_esports:    { enabled: true,  interval: 15 },
  hupu_nba:         { enabled: true,  interval: 15 },
  hupu_football:    { enabled: true,  interval: 15 },
  zhihu_hot:        { enabled: true,  interval: 20 },
  zhihu_esports:    { enabled: false, interval: 30 },
  weibo:            { enabled: true,  interval: 10 },
  dongqiudi:        { enabled: true,  interval: 15 },
  zhibo8:           { enabled: true,  interval: 15 },
  sina_sports:      { enabled: false, interval: 20 },
  qq_sports:        { enabled: false, interval: 20 },
  toutiao:          { enabled: false, interval: 10 },
  alapi_weibo:      { enabled: false, interval: 10 },
};

// API Tokens
const DEFAULT_TOKENS = {
  alapi:   '',
  juhe:    '',
};

// 资讯源分类（用于设置页展示）
const SOURCE_CATEGORIES = {
  forum: {
    name: '论坛社区',
    icon: '💬',
    sources: ['hupu_bxj', 'hupu_nba', 'hupu_football', 'hupu_esports', 'zhihu_hot', 'zhihu_esports', 'weibo'],
  },
  news: {
    name: '体育资讯',
    icon: '📰',
    sources: ['dongqiudi', 'zhibo8', 'sina_sports', 'qq_sports'],
  },
  api: {
    name: 'API接口（需密钥）',
    icon: '🔑',
    sources: ['toutiao', 'alapi_weibo'],
  },
};
