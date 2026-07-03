// ============================================================
// 赛事实时播报 - Service Worker (Manifest V3) v2.0.5
// 精简版：世界杯(500.com) + NBA(500.com) + F1(TheSportsDB) + 电竞(静态日程)
// ============================================================

importScripts('data/leagues.js', 'data/esports_schedule.js');

// TheSportsDB 英文联赛名 → 中文
const LEAGUE_NAME_CN = {
  'Formula 1': 'F1', 'Formula One': 'F1', 'F1': 'F1',
  'FIFA World Cup': '世界杯', 'World Cup': '世界杯',
};

function translateLeague(en) {
  if (!en) return '未知';
  if (LEAGUE_NAME_CN[en]) return LEAGUE_NAME_CN[en];
  for (const [k, v] of Object.entries(LEAGUE_NAME_CN)) {
    if (en.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return en;
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

// ============================================================
// 安装 & 启动
// ============================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[赛事播报 v2.0.5] 安装/更新:', details.reason);
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  setupAllAlarms();
  try { await fetchAllData(); } catch (e) { console.error('[赛事播报] 初始化失败:', e.message); }
});

chrome.runtime.onStartup.addListener(async () => {
  setupAllAlarms();
  try { await fetchAllData(); } catch (e) { console.error('[赛事播报] 启动失败:', e.message); }
});

// ============================================================
// 定时器
// ============================================================
function setupAllAlarms() {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('fetchScores', { periodInMinutes: 1 });
    chrome.alarms.create('fetchF1', { periodInMinutes: 10 });
    chrome.alarms.create('cleanold', { periodInMinutes: 120 });
    chrome.alarms.create('yesterdaySummary', { when: getNextTime(8, 0), periodInMinutes: 1440 });
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'fetchScores': await fetchAllData(); break;
    case 'fetchF1': await fetchF1(); break;
    case 'cleanold': cleanOldData(); break;
    case 'yesterdaySummary': await generateYesterdaySummary(); break;
  }
});

// ============================================================
// 消息处理
// ============================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'settingsUpdated': setupAllAlarms(); fetchAllData(); sendResponse({ ok: true }); break;
    case 'refreshNow': fetchAllData().then(r => sendResponse({ ok: true, count: r.length })); return true;
    case 'getLeagues': sendResponse({ leagues: LEAGUES, gameCategories: GAME_CATEGORIES }); break;
    case 'searchHistory': searchHistory(msg.query, msg.startDate, msg.endDate).then(r => sendResponse(r)); return true;
    case 'getFavorites': getFavorites().then(r => sendResponse(r)); return true;
    case 'toggleFavorite': toggleFavorite(msg.leagueId).then(r => sendResponse(r)); return true;
    case 'clearHistory': chrome.storage.local.set({ matchHistory: {} }).then(() => sendResponse({ ok: true })); return true;
    case 'getYesterdaySummary': getYesterdaySummaryCache().then(r => sendResponse(r)); return true;
    case 'toggleVoice': toggleVoice().then(r => sendResponse(r)); return true;
  }
});

// ============================================================
// 1. 数据源：500彩票网 足球（世界杯）
// ============================================================
async function fetch500Football() {
  try {
    const res = await fetch('https://trade.500.com/jczq/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const buffer = await res.arrayBuffer();
    const html = new TextDecoder('gbk').decode(buffer);

    const rowPattern = /<tr class="bet-tb-tr[^"]*"[^>]*data-homesxname="([^"]*)"[^>]*data-awaysxname="([^"]*)"[^>]*>(.*?)<\/tr>/gs;
    const matches = [...html.matchAll(rowPattern)];

    const results = [];
    for (const m of matches) {
      const home = m[1], away = m[2];
      const rowHtml = m[3];
      const cells = [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];
      if (cells.length < 6) continue;

      const league = cells[1]?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const time = cells[2]?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const raw = cells[3]?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';

      let score = 'vs', status = '未开始';
      if (raw.match(/\d+:\d+/)) {
        const sm = raw.match(/(\d+:\d+)/);
        score = sm[1].replace(':', ' - ');
        status = '已结束';
      }

      // 只保留世界杯相关
      if (!league.includes('世界杯') && !league.includes('World Cup')) continue;

      results.push({
        id: `500fb-${results.length}`, league, time, home, away, score, status,
        detailUrl: 'https://trade.500.com/jczq/', source: '500彩票网', sport: 'football', type: 'live',
      });
    }

    console.log('[500足球] 世界杯:', results.length, '场');
    return results;
  } catch (err) { console.warn('[500足球] 失败:', err.message); return []; }
}

// ============================================================
// 2. 数据源：500彩票网 篮球（NBA）
// ============================================================
async function fetch500Basketball() {
  try {
    const res = await fetch('https://trade.500.com/jclq/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const buffer = await res.arrayBuffer();
    const html = new TextDecoder('gbk').decode(buffer);

    const rowPattern = /<tr class="bet-tb-tr[^"]*"[^>]*data-homesxname="([^"]*)"[^>]*data-awaysxname="([^"]*)"[^>]*>(.*?)<\/tr>/gs;
    const matches = [...html.matchAll(rowPattern)];

    const results = [];
    for (const m of matches) {
      const home = m[1], away = m[2];
      const rowHtml = m[3];
      const cells = [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];
      if (cells.length < 6) continue;

      const league = cells[1]?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const time = cells[2]?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const raw = cells[3]?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';

      let score = 'vs', status = '未开始';
      if (raw.match(/\d+:\d+/)) {
        const sm = raw.match(/(\d+:\d+)/);
        score = sm[1].replace(':', ' - ');
        status = '已结束';
      }

      results.push({
        id: `500bb-${results.length}`, league, time, home, away, score, status,
        detailUrl: 'https://trade.500.com/jclq/', source: '500彩票网', sport: 'basketball', type: 'live',
      });
    }

    console.log('[500篮球] 共:', results.length, '场');
    return results;
  } catch (err) { console.warn('[500篮球] 失败:', err.message); return []; }
}

// ============================================================
// 3. 数据源：TheSportsDB F1
// ============================================================
async function fetchF1() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Motorsport`);
    const data = await res.json();
    if (!data.events) return [];

    const f1Events = data.events.filter(e => (e.strLeague || '').toLowerCase().includes('formula'));
    const results = f1Events.map(evt => ({
      id: `f1-${evt.idEvent}`, league: 'F1',
      home: evt.strEvent || evt.strHomeTeam || '',
      away: evt.strAwayTeam || '',
      score: evt.intHomeScore != null ? `${evt.intHomeScore} - ${evt.intAwayScore}` : 'vs',
      status: evt.strStatus || '未开始',
      time: evt.strTimestamp || evt.dateEvent || '',
      detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
      source: 'TheSportsDB', sport: 'motorsport', type: 'live',
    }));
    console.log('[F1]', results.length, '场');
    return results;
  } catch (err) { console.warn('[F1] 失败:', err.message); return []; }
}

// ============================================================
// 4. 综合数据聚合（主入口）
// ============================================================
async function fetchAllData() {
  console.log('[fetchAllData] 开始拉取...');

  const [football, basketball, esportsEvents] = await Promise.all([
    fetch500Football(),
    fetch500Basketball(),
    Promise.resolve(getActiveEsportsEvents()),
  ]);

  // 电竞日程转为赛事卡片
  const esportsCards = esportsEvents.map(evt => ({
    id: evt.id, league: evt.league, game: evt.game,
    home: evt.league, away: evt.status,
    score: evt.status === '进行中' ? '进行中' : (evt.status === '即将开始' ? '即将开始' : 'vs'),
    status: evt.status,
    time: evt.startDate,
    detailUrl: evt.detailUrl,
    source: '电竞日程', sport: 'esports', type: 'live',
    info: evt.info || '',
  }));

  // F1 数据（可能已有缓存）
  const { f1Data } = await chrome.storage.local.get('f1Data');
  let f1Cards = f1Data || [];

  let allMatches = [...football, ...basketball, ...f1Cards, ...esportsCards];

  // 按联赛过滤
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  if (s.selectedLeagues.length > 0 && typeof findLeague === 'function') {
    allMatches = allMatches.filter(m => {
      return s.selectedLeagues.some(leagueId => {
        const league = findLeague(leagueId);
        if (!league) return false;
        return league.keywords.some(kw =>
          (m.league || '').includes(kw) || (m.game || '').toLowerCase().includes(kw.toLowerCase())
        );
      });
    });
  }

  console.log('[fetchAllData] 最终:', allMatches.length, '场');

  // 写入存储
  const oldData = (await chrome.storage.local.get('liveMatches')).liveMatches || [];
  await chrome.storage.local.set({ liveMatches: allMatches, lastUpdate: Date.now() });

  // 存入历史
  const finished = allMatches.filter(m => m.score !== 'vs' && m.status === '已结束');
  if (finished.length > 0) await saveToHistory(finished);

  // 通知
  const changes = allMatches.filter(m => {
    const old = oldData.find(o => o.id === m.id);
    return !old || old.score !== m.score;
  });
  if (changes.length > 0) {
    chrome.action.setBadgeText({ text: String(Math.min(changes.length, 99)) });
    chrome.action.setBadgeBackgroundColor({ color: '#3fb950' });
    for (const match of changes) {
      if (match.score !== 'vs' && s.notifyGoals) notifyMatch(match, 'goal');
      if (match.status === '已结束' && s.notifyFinal) notifyMatch(match, 'final');
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }

  // 同时拉取F1
  fetchF1().then(cards => {
    chrome.storage.local.set({ f1Data: cards });
  });

  return allMatches;
}

// ============================================================
// 5. 历史存储与搜索
// ============================================================
async function saveToHistory(matches) {
  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  const history = matchHistory || {};
  const today = new Date().toISOString().split('T')[0];
  for (const match of matches) {
    if (!match.score || match.score === 'vs') continue;
    history[`${today}_${match.id}`] = { ...match, savedDate: today, timestamp: Date.now() };
  }
  const oneYearAgo = Date.now() - 365 * 86400000;
  const cleaned = {};
  Object.entries(history).forEach(([k, v]) => { if (v.timestamp > oneYearAgo) cleaned[k] = v; });
  await chrome.storage.local.set({ matchHistory: cleaned });
}

async function searchHistory(query, startDate, endDate) {
  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  let results = Object.values(matchHistory || {});
  if (startDate) results = results.filter(m => m.savedDate >= startDate);
  if (endDate) results = results.filter(m => m.savedDate <= endDate);
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(m => (m.league + m.home + m.away + (m.game || '')).toLowerCase().includes(q));
  }
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return { results: results.slice(0, 200), total: results.length };
}

// ============================================================
// 6. 收藏
// ============================================================
async function getFavorites() {
  const { favorites } = await chrome.storage.sync.get('favorites');
  return { favorites: favorites || [] };
}
async function toggleFavorite(leagueId) {
  const { favorites } = await chrome.storage.sync.get('favorites');
  let favs = favorites || [];
  const idx = favs.indexOf(leagueId);
  if (idx > -1) favs.splice(idx, 1); else favs.push(leagueId);
  await chrome.storage.sync.set({ favorites: favs });
  return { favorites: favs, toggled: leagueId, isFav: idx === -1 };
}

// ============================================================
// 7. 通知 & 语音
// ============================================================
function notifyMatch(match, type) {
  const titles = { goal: '⚽ 得分！', final: '🏁 比赛结束', start: '▶ 比赛开始' };
  const gameLabel = match.game ? `[${match.game}] ` : '';
  chrome.notifications.create(`match-${match.id}-${type}`, {
    type: 'basic', iconUrl: 'icons/icon-128.png',
    title: titles[type] || '赛事更新',
    message: `${gameLabel}${match.home} ${match.score} ${match.away}\n${match.league} · ${match.source}`,
    priority: 2
  });
  chrome.storage.sync.get('settings', (data) => {
    const s = data.settings || DEFAULT_SETTINGS;
    if (s.voiceAnnounce) {
      if (type === 'goal' && s.voiceGoals)
        chrome.tts.speak(`${gameLabel}${match.home} ${match.score} ${match.away}`, { lang: 'zh-CN', rate: 0.9 });
      if (type === 'final' && s.voiceFinals)
        chrome.tts.speak(`比赛结束，${match.league}，${match.home} ${match.score} ${match.away}`, { lang: 'zh-CN', rate: 0.85 });
    }
  });
}

// ============================================================
// 8. 清理 & 语音
// ============================================================
function cleanOldData() {
  chrome.notifications.getAll((items) => {
    const now = Date.now();
    for (const [id, info] of Object.entries(items)) {
      if (now - info.timestamp > 3600000) chrome.notifications.clear(id);
    }
  });
}
async function toggleVoice() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  s.voiceAnnounce = !s.voiceAnnounce;
  await chrome.storage.sync.set({ settings: s });
  if (s.voiceAnnounce) chrome.tts.speak('语音播报已开启', { lang: 'zh-CN', rate: 1.0 });
  return { voiceAnnounce: s.voiceAnnounce };
}

// ============================================================
// 9. 昨日总结
// ============================================================
async function generateYesterdaySummary() {
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  const history = matchHistory || {};
  const yesterdayMatches = Object.values(history).filter(m => m.savedDate === yesterdayStr);

  if (yesterdayMatches.length === 0) {
    const summary = { date: yesterdayStr, dateDisplay: yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }), total: 0, bySport: {}, byLeague: {}, highlights: [], topText: `${yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}暂无赛事记录` };
    await chrome.storage.local.set({ yesterdaySummary: summary, yesterdaySummaryDate: yesterdayStr });
    return summary;
  }

  const bySport = {}, byLeague = {}, highlights = [];
  yesterdayMatches.forEach(m => {
    const sport = m.sport || '其他';
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

  const sportNames = { football: '足球', basketball: '篮球', motorsport: 'F1', esports: '电竞' };
  const sportParts = Object.entries(bySport).map(([k, v]) => `${sportNames[k] || k}${v.count}场`);
  const summary = {
    date: yesterdayStr, dateDisplay: yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    total: yesterdayMatches.length, bySport, byLeague, highlights: highlights.slice(0, 10),
    topText: `${yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}共${yesterdayMatches.length}场，${sportParts.join('，')}`,
  };
  await chrome.storage.local.set({ yesterdaySummary: summary, yesterdaySummaryDate: yesterdayStr });
  return summary;
}

async function getYesterdaySummaryCache() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const { yesterdaySummary, yesterdaySummaryDate } = await chrome.storage.local.get(['yesterdaySummary', 'yesterdaySummaryDate']);
  return { summary: (yesterdaySummary && yesterdaySummaryDate === yesterday) ? yesterdaySummary : null, cached: !!(yesterdaySummary && yesterdaySummaryDate === yesterday) };
}

function getNextTime(hour, minute) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime();
}