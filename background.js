// ============================================================
// 赛事实时播报 - Service Worker (Manifest V3) v2.0.4
// 纯中文数据源：500彩票网 + TheSportsDB(中文映射) + 虎扑
// ============================================================

// 导入数据定义
try {
  importScripts('data/leagues.js', 'data/sources.js');
  console.log('[赛事播报] 数据文件加载成功，联赛数:', typeof getAllLeagues === 'function' ? getAllLeagues().length : 'N/A');
} catch (e) {
  console.error('[赛事播报] importScripts 失败:', e.message);
}

// ============================================================
// TheSportsDB 英文联赛名 → 中文 映射表
// ============================================================
const LEAGUE_NAME_CN = {
  'English Premier League': '英超',
  'Premier League': '英超',
  'Spanish La Liga': '西甲',
  'La Liga': '西甲',
  'Italian Serie A': '意甲',
  'Serie A': '意甲',
  'German Bundesliga': '德甲',
  'Bundesliga': '德甲',
  'French Ligue 1': '法甲',
  'Ligue 1': '法甲',
  'UEFA Champions League': '欧冠',
  'Champions League': '欧冠',
  'UEFA Europa League': '欧联杯',
  'Europa League': '欧联杯',
  'American MLS': '美职联',
  'MLS': '美职联',
  'American USL Championship': '美国USL',
  'American USL League One': '美国USL甲级',
  'Dutch Eredivisie': '荷甲',
  'Eredivisie': '荷甲',
  'Portuguese Liga': '葡超',
  'Primeira Liga': '葡超',
  'Brazilian Serie A': '巴甲',
  'Argentine Liga Profesional': '阿甲',
  'Scottish Premier League': '苏超',
  'Japanese J.League': 'J联赛',
  'J.League': 'J联赛',
  'Korean K League': 'K联赛',
  'K League': 'K联赛',
  'Australian A-League': '澳超',
  'A-League': '澳超',
  'Chinese Super League': '中超',
  'CSL': '中超',
  'FIFA World Cup': '世界杯',
  'World Cup': '世界杯',
  'UEFA Euro': '欧洲杯',
  'Copa America': '美洲杯',
  'AFC Asian Cup': '亚洲杯',
  'FA Cup': '足总杯',
  'Copa del Rey': '国王杯',
  'NBA': 'NBA',
  'NCAA': 'NCAA篮球',
  'EuroLeague': '欧洲篮球联赛',
  'NFL': 'NFL',
  'MLB': 'MLB',
  'NHL': 'NHL',
  'Formula 1': 'F1',
  'FIFA': 'FIFA',
  'AFC Champions League': '亚冠',
  'International': '国际友谊赛',
  'Friendly': '友谊赛',
  'Cup': '杯赛',
};

function translateLeague(englishName) {
  if (!englishName) return '未知赛事';
  // 精确匹配
  if (LEAGUE_NAME_CN[englishName]) return LEAGUE_NAME_CN[englishName];
  // 部分匹配
  for (const [en, cn] of Object.entries(LEAGUE_NAME_CN)) {
    if (englishName.toLowerCase().includes(en.toLowerCase())) return cn;
  }
  return englishName;
}

// ============================================================
// 默认设置
// ============================================================
const DEFAULT_SETTINGS = {
  refreshInterval: 30,
  notifyGoals: true,
  notifyFinal: true,
  notifyStart: false,
  voiceAnnounce: false,
  voiceGoals: true,
  voiceFinals: true,
  selectedLeagues: [],
  sourceSettings: (typeof DEFAULT_SOURCE_SETTINGS !== 'undefined') ? DEFAULT_SOURCE_SETTINGS : {},
  apiTokens: (typeof DEFAULT_TOKENS !== 'undefined') ? DEFAULT_TOKENS : {},
  language: 'zh',
};

// Sel f-healing: 如果数据文件加载失败，使用最小定义
if (typeof LEAGUES === 'undefined') {
  var LEAGUES = { football: [], basketball: [], other_sports: [], mega_events: [], esports: [] };
}
if (typeof GAME_CATEGORIES === 'undefined') {
  var GAME_CATEGORIES = {};
}
if (typeof CONTENT_SOURCES === 'undefined') {
  var CONTENT_SOURCES = {};
}
if (typeof DEFAULT_SOURCE_SETTINGS === 'undefined') {
  var DEFAULT_SOURCE_SETTINGS = {};
}
if (typeof DEFAULT_TOKENS === 'undefined') {
  var DEFAULT_TOKENS = {};
}
if (typeof getAllLeagues !== 'function') {
  function getAllLeagues() { return []; }
}
if (typeof findLeague !== 'function') {
  function findLeague(id) { return null; }
}

// ============================================================
// 安装 & 启动
// ============================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[赛事播报 v2.0.4] 安装/更新:', details.reason);
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  setupAllAlarms();
  try {
    const result = await fetchAllData();
    console.log('[赛事播报] 初始化拉取完成，赛事:', result.length, '场，资讯:', result.feeds || 0, '条');
  } catch (e) {
    console.error('[赛事播报] 初始化拉取失败:', e.message);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  setupAllAlarms();
  try {
    await fetchAllData();
    console.log('[赛事播报] 启动拉取完成');
  } catch (e) {
    console.error('[赛事播报] 启动拉取失败:', e.message);
  }
});

// ============================================================
// 定时器 (Chrome MV3 最小间隔 1 分钟)
// ============================================================
function setupAllAlarms() {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('fetchScores', { periodInMinutes: 1 });       // 1分钟 - 实时比分
    chrome.alarms.create('fetchDailyResults', { periodInMinutes: 30 }); // 30分钟 - 赛果
    chrome.alarms.create('fetchFuture', { periodInMinutes: 60 });       // 1小时 - 未来赛程
    chrome.alarms.create('fetchContent', { periodInMinutes: 15 });      // 15分钟 - 中文资讯
    chrome.alarms.create('cleanold', { periodInMinutes: 120 });         // 2小时 - 清理
    chrome.alarms.create('yesterdaySummary', { when: getNextTime(8, 0), periodInMinutes: 1440 });
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'fetchScores':       await fetchAllData(); break;
    case 'fetchDailyResults': await fetch500Results(); break;
    case 'fetchFuture':       await fetchFutureEvents(); break;
    case 'fetchContent':      await fetchContentFeeds(); break;
    case 'cleanold':          cleanOldData(); break;
    case 'yesterdaySummary':  await generateYesterdaySummary(); break;
  }
});

// ============================================================
// 消息处理
// ============================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'settingsUpdated':
      setupAllAlarms();
      fetchAllData();
      sendResponse({ ok: true });
      break;
    case 'refreshNow':
      fetchAllData().then(result => sendResponse({ ok: true, count: result.length }));
      return true;
    case 'getLeagues':
      sendResponse({ leagues: LEAGUES, gameCategories: GAME_CATEGORIES });
      break;
    case 'searchHistory':
      searchHistory(msg.query, msg.startDate, msg.endDate).then(r => sendResponse(r));
      return true;
    case 'getFavorites':
      getFavorites().then(r => sendResponse(r));
      return true;
    case 'toggleFavorite':
      toggleFavorite(msg.leagueId).then(r => sendResponse(r));
      return true;
    case 'clearHistory':
      chrome.storage.local.set({ matchHistory: {} }).then(() => sendResponse({ ok: true }));
      return true;
    case 'getYesterdaySummary':
      getYesterdaySummaryCache().then(r => sendResponse(r));
      return true;
    case 'toggleVoice':
      toggleVoice().then(r => sendResponse(r));
      return true;
  }
});

// ============================================================
// 1. 主数据源：TheSportsDB（免费API，英文→中文映射）
// ============================================================
async function fetchTheSportsDB() {
  try {
    const API_KEY = '3';
    const BASE = 'https://www.thesportsdb.com/api/v1/json';
    const today = new Date().toISOString().split('T')[0];

    const res = await fetch(`${BASE}/${API_KEY}/eventsday.php?d=${today}&s=Soccer`);
    const data = await res.json();
    if (!data.events) return [];

    console.log('[TheSportsDB] 获取到', data.events.length, '场足球赛事');

    return data.events.map(evt => ({
      id: `tsdb-${evt.idEvent}`,
      league: translateLeague(evt.strLeague),
      home: evt.strHomeTeam || '',
      away: evt.strAwayTeam || '',
      score: evt.intHomeScore != null ? `${evt.intHomeScore} - ${evt.intAwayScore}` : 'vs',
      status: evt.strStatus || (evt.intHomeScore != null ? '已结束' : '未开始'),
      time: evt.strTimestamp || evt.dateEvent || '',
      detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
      source: 'TheSportsDB',
      sport: 'football',
      type: evt.intHomeScore != null ? 'result' : 'live',
    }));
  } catch (err) {
    console.warn('[TheSportsDB] 请求失败:', err.message);
    return [];
  }
}

// ============================================================
// 2. 中文数据源：500彩票网（GBK编码HTML解析）
// ============================================================
async function fetch500Results() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch('https://trade.500.com/jczq/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const buffer = await res.arrayBuffer();
    const html = new TextDecoder('gbk').decode(buffer);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr.bet-tb-tr');

    const results = [];
    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return;

      const league = cells[1]?.textContent?.trim() || '';
      const time = cells[2]?.textContent?.trim() || '';
      const raw = cells[3]?.textContent?.trim() || '';  // "[3]西班牙 3:0 奥地利[22]" 或 "澳大利亚\nVS\n埃及"

      // 解析 home, score, away
      let home = '', away = '', score = 'vs', status = '未开始';

      // 去掉排名标记 [数字]，规范化空白
      let clean = raw.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();

      if (clean.includes(' VS ')) {
        // 未开赛：澳大利亚 VS 埃及
        const parts = clean.split(' VS ');
        home = parts[0]?.trim() || '';
        away = parts[1]?.trim() || '';
        score = 'vs';
        status = '未开始';
      } else if (clean.match(/\d+:\d+/)) {
        // 已完赛：西班牙 3:0 奥地利
        const scoreMatch = clean.match(/(.+?)\s+(\d+:\d+)\s+(.+)/);
        if (scoreMatch) {
          home = scoreMatch[1].trim();
          score = scoreMatch[2].replace(':', ' - ');
          away = scoreMatch[3].trim();
          status = '已结束';
        } else {
          home = clean;
          status = '未知';
        }
      } else {
        home = clean;
        status = '未知';
      }

      if (!home) return;

      results.push({
        id: `500-${today}-${idx}`,
        league: league,
        time: time,
        home: home,
        away: away,
        score: score,
        status: status,
        detailUrl: 'https://trade.500.com/jczq/',
        source: '500彩票网',
        sport: 'football',
        type: score !== 'vs' ? 'result' : 'live',
      });
    });

    console.log('[500彩票网] 解析到', results.length, '场赛事，其中完赛:', results.filter(r => r.status === '已结束').length, '场');

    if (results.length > 0) {
      await chrome.storage.local.set({ dailyResults: results, dailyResultsDate: today });
    }
    return results;
  } catch (err) {
    console.warn('[500彩票网] 请求失败:', err.message);
    return [];
  }
}

// ============================================================
// 3. 中文资讯：虎扑论坛（HTML解析）
// 虎扑是SPA，但部分页面有静态HTML内容
// ============================================================
async function fetchContentFeeds() {
  const allFeeds = [];

  // 虎扑-国际足球
  try {
    const feeds = await scrapeHupu('all-soccer', '虎扑足球');
    allFeeds.push(...feeds);
  } catch (e) { console.warn('[虎扑足球] 失败:', e.message); }

  // 虎扑-篮球
  try {
    const feeds = await scrapeHupu('all-nba', '虎扑NBA');
    allFeeds.push(...feeds);
  } catch (e) { console.warn('[虎扑NBA] 失败:', e.message); }

  // 虎扑-电竞
  try {
    const feeds = await scrapeHupu('all-gg', '虎扑电竞');
    allFeeds.push(...feeds);
  } catch (e) { console.warn('[虎扑电竞] 失败:', e.message); }

  // 如果虎扑抓取失败，从赛事数据生成资讯
  if (allFeeds.length === 0) {
    const { dailyResults } = await chrome.storage.local.get('dailyResults');
    if (dailyResults && dailyResults.length > 0) {
      const finished = dailyResults.filter(r => r.status === '已结束');
      finished.slice(0, 10).forEach(r => {
        allFeeds.push({
          id: `news-${r.id}`,
          title: `⚽ ${r.league}：${r.home} ${r.score} ${r.away}`,
          url: r.detailUrl,
          source: '500彩票网',
          sourceIcon: '📊',
          time: r.time || new Date().toISOString(),
          type: 'news',
        });
      });
    }
  }

  if (allFeeds.length > 0) {
    // 去重
    const seen = new Set();
    const unique = allFeeds.filter(f => {
      const key = f.title.substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await chrome.storage.local.set({
      contentFeeds: unique.slice(0, 30),
      contentLastUpdate: Date.now()
    });
  }

  return allFeeds;
}

async function scrapeHupu(section, sourceName) {
  try {
    const res = await fetch(`https://bbs.hupu.com/${section}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();

    // 虎扑页面中的帖子标题
    const titlePattern = /<a[^>]*href="(https:\/\/bbs\.hupu\.com\/\d+\.html)"[^>]*>([^<]{5,100})<\/a>/gi;
    const matches = [...html.matchAll(titlePattern)];

    const feeds = [];
    for (const m of matches) {
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      if (title.length < 5 || title.includes('function') || title.includes('window.')) continue;
      feeds.push({
        id: `hp-${section}-${feeds.length}`,
        title: title,
        url: m[1],
        source: sourceName,
        sourceIcon: '🏀',
        time: new Date().toISOString(),
        type: 'news',
      });
    }

    console.log(`[虎扑${sourceName}] 抓取到 ${feeds.length} 条`);
    return feeds.slice(0, 15);
  } catch (e) {
    return [];
  }
}

// ============================================================
// 4. 未来赛程：TheSportsDB
// ============================================================
async function fetchFutureEvents() {
  const futureEvents = [];

  try {
    const API_KEY = '3';
    const BASE = 'https://www.thesportsdb.com/api/v1/json';

    // 获取未来3天的赛事（减少请求量）
    for (let d = 1; d <= 3; d++) {
      const date = new Date(Date.now() + d * 86400000).toISOString().split('T')[0];
      const res = await fetch(`${BASE}/${API_KEY}/eventsday.php?d=${date}&s=Soccer`);
      const data = await res.json();
      if (!data.events) continue;

      for (const evt of data.events) {
        if (evt.strStatus === 'Not Started' || !evt.strStatus) {
          futureEvents.push({
            id: `future-${evt.idEvent}`,
            league: translateLeague(evt.strLeague),
            home: evt.strHomeTeam || '',
            away: evt.strAwayTeam || '',
            score: 'vs',
            status: '未开始',
            time: evt.dateEvent || evt.strTimestamp || '',
            detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
            source: 'TheSportsDB',
            sport: 'football',
            type: 'future',
          });
        }
      }
    }
    console.log('[未来赛程] 获取到', futureEvents.length, '场');
  } catch (e) {
    console.warn('[未来赛程] 请求失败:', e.message);
  }

  if (futureEvents.length > 0) {
    await chrome.storage.local.set({
      futureEvents: futureEvents.slice(0, 50),
      futureLastUpdate: Date.now()
    });
  }

  return futureEvents;
}

// ============================================================
// 5. 综合数据聚合（主入口）
// ============================================================
async function fetchAllData() {
  console.log('[fetchAllData] 开始拉取...');
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const selectedLeagues = s.selectedLeagues || [];

  // 并行拉取所有数据源
  const [tsdbMatches, results500] = await Promise.all([
    fetchTheSportsDB(),
    fetch500Results()
  ]);

  console.log('[fetchAllData] TheSportsDB:', tsdbMatches.length, '场, 500彩票网:', results500.length, '场');

  // 合并：TheSportsDB + 500彩票网
  let allMatches = [...tsdbMatches, ...results500];

  // 去重（按联赛+球队）
  const seen = new Set();
  const unique = allMatches.filter(m => {
    const key = `${m.league}-${m.home}-${m.away}`.substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 按联赛过滤
  let filtered = unique;
  if (selectedLeagues.length > 0) {
    filtered = unique.filter(match => {
      return selectedLeagues.some(leagueId => {
        const league = findLeague(leagueId);
        if (!league) return false;
        return league.keywords.some(kw =>
          (match.league || '').includes(kw) ||
          (match.game || '').toLowerCase().includes(kw.toLowerCase())
        );
      });
    });
  }

  console.log('[fetchAllData] 最终:', filtered.length, '场赛事');

  // 写入存储
  const oldData = (await chrome.storage.local.get('liveMatches')).liveMatches || [];
  await chrome.storage.local.set({
    liveMatches: filtered,
    lastUpdate: Date.now()
  });

  // 存入历史
  const finished = filtered.filter(m => m.score !== 'vs' && m.score !== '0 - 0');
  if (finished.length > 0) {
    await saveToHistory(finished);
  }

  // 通知变化
  const changes = filtered.filter(m => {
    const old = oldData.find(o => o.id === m.id);
    return !old || old.score !== m.score || old.status !== m.status;
  });

  if (changes.length > 0) {
    chrome.action.setBadgeText({ text: String(Math.min(changes.length, 99)) });
    chrome.action.setBadgeBackgroundColor({ color: '#3fb950' });

    for (const match of changes) {
      if (match.score !== 'vs' && s.notifyGoals) notifyMatch(match, 'goal');
      if (match.status === '已结束' && s.notifyFinal) notifyMatch(match, 'final');
      if (match.status === '未开始' && s.notifyStart) notifyMatch(match, 'start');
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }

  return filtered;
}

// ============================================================
// 6. 历史赛事存储与搜索
// ============================================================
async function saveToHistory(matches) {
  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  const history = matchHistory || {};
  const today = new Date().toISOString().split('T')[0];

  for (const match of matches) {
    if (!match.score || match.score === 'vs') continue;
    const key = `${today}_${match.id}`;
    history[key] = { ...match, savedDate: today, timestamp: Date.now() };
  }

  // 只保留一年
  const oneYearAgo = Date.now() - 365 * 86400000;
  const cleaned = {};
  Object.entries(history).forEach(([k, v]) => {
    if (v.timestamp > oneYearAgo) cleaned[k] = v;
  });

  await chrome.storage.local.set({ matchHistory: cleaned });
}

async function searchHistory(query, startDate, endDate) {
  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  const history = matchHistory || {};
  let results = Object.values(history);

  if (startDate) results = results.filter(m => m.savedDate >= startDate);
  if (endDate) results = results.filter(m => m.savedDate <= endDate);

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(m =>
      (m.league || '').toLowerCase().includes(q) ||
      (m.home || '').toLowerCase().includes(q) ||
      (m.away || '').toLowerCase().includes(q) ||
      (m.game || '').toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return { results: results.slice(0, 200), total: results.length };
}

// ============================================================
// 7. 收藏
// ============================================================
async function getFavorites() {
  const { favorites } = await chrome.storage.sync.get('favorites');
  return { favorites: favorites || [] };
}

async function toggleFavorite(leagueId) {
  const { favorites } = await chrome.storage.sync.get('favorites');
  let favs = favorites || [];
  const idx = favs.indexOf(leagueId);
  if (idx > -1) { favs.splice(idx, 1); }
  else { favs.push(leagueId); }
  await chrome.storage.sync.set({ favorites: favs });
  return { favorites: favs, toggled: leagueId, isFav: idx === -1 };
}

// ============================================================
// 8. 通知 & 语音
// ============================================================
function notifyMatch(match, type) {
  const titles = { goal: '⚽ 进球/得分！', final: '🏁 比赛结束', start: '▶ 比赛开始' };
  const title = titles[type] || '赛事更新';

  chrome.notifications.create(`match-${match.id}-${type}`, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: `${match.home} ${match.score} ${match.away}\n${match.league} · ${match.source}`,
    priority: 2
  });

  chrome.storage.sync.get('settings', (data) => {
    const s = data.settings || DEFAULT_SETTINGS;
    if (s.voiceAnnounce) {
      if (type === 'goal' && s.voiceGoals) {
        chrome.tts.speak(`进球！${match.home} ${match.score} ${match.away}`, { lang: 'zh-CN', rate: 0.9 });
      }
      if (type === 'final' && s.voiceFinals) {
        chrome.tts.speak(`比赛结束，${match.league}，${match.home} ${match.score} ${match.away}`, { lang: 'zh-CN', rate: 0.85 });
      }
    }
  });
}

// ============================================================
// 9. 清理
// ============================================================
function cleanOldData() {
  chrome.notifications.getAll((items) => {
    const now = Date.now();
    for (const [id, info] of Object.entries(items)) {
      if (now - info.timestamp > 3600000) chrome.notifications.clear(id);
    }
  });
}

// ============================================================
// 10. 昨日总结
// ============================================================
async function generateYesterdaySummary() {
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  const history = matchHistory || {};
  const yesterdayMatches = Object.values(history).filter(m => m.savedDate === yesterdayStr);

  if (yesterdayMatches.length === 0) {
    const summary = {
      date: yesterdayStr,
      dateDisplay: yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
      total: 0, bySport: {}, byLeague: {}, highlights: [],
      topText: `${yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}暂无赛事记录`,
    };
    await chrome.storage.local.set({ yesterdaySummary: summary, yesterdaySummaryDate: yesterdayStr });
    return summary;
  }

  const bySport = {}, byLeague = {}, highlights = [];
  yesterdayMatches.forEach(m => {
    const sport = m.sport || '足球';
    if (!bySport[sport]) bySport[sport] = { count: 0 };
    bySport[sport].count++;
    const league = m.league || '未知';
    if (!byLeague[league]) byLeague[league] = { count: 0 };
    byLeague[league].count++;
    if (m.score && m.score !== 'vs') {
      const parts = m.score.split('-').map(Number);
      if (parts.length === 2 && parts[0] + parts[1] >= 4) {
        highlights.push({ match: `${m.home} ${m.score} ${m.away}`, league: m.league || '' });
      }
    }
  });

  const sportNames = { football: '足球', basketball: '篮球', esports: '电竞' };
  const sportParts = Object.entries(bySport).map(([k, v]) => `${sportNames[k] || k}${v.count}场`);

  const summary = {
    date: yesterdayStr,
    dateDisplay: yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    total: yesterdayMatches.length,
    bySport, byLeague, highlights: highlights.slice(0, 10),
    topText: `${yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}共${yesterdayMatches.length}场，${sportParts.join('，')}`,
  };

  await chrome.storage.local.set({ yesterdaySummary: summary, yesterdaySummaryDate: yesterdayStr });

  if (highlights.length > 0) {
    chrome.notifications.create('yesterday-summary', {
      type: 'basic', iconUrl: 'icons/icon-128.png',
      title: '📊 昨日赛事总结',
      message: summary.topText + '\n' + highlights[0].match,
      priority: 1,
    });
  }
  return summary;
}

async function getYesterdaySummaryCache() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const { yesterdaySummary, yesterdaySummaryDate } = await chrome.storage.local.get(['yesterdaySummary', 'yesterdaySummaryDate']);
  if (yesterdaySummary && yesterdaySummaryDate === yesterday) {
    return { summary: yesterdaySummary, cached: true };
  }
  return { summary: yesterdaySummary || null, cached: false };
}

// ============================================================
// 11. 语音开关
// ============================================================
async function toggleVoice() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  s.voiceAnnounce = !s.voiceAnnounce;
  await chrome.storage.sync.set({ settings: s });
  if (s.voiceAnnounce) {
    chrome.tts.speak('语音播报已开启', { lang: 'zh-CN', rate: 1.0 });
  }
  return { voiceAnnounce: s.voiceAnnounce };
}

// ============================================================
// 12. 辅助函数
// ============================================================
function getNextTime(hour, minute) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime();
}