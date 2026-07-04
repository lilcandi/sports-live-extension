// ============================================================
// 赛事实时播报 v2.0.6 - 赛果结论读取模式
// 不爬取网页内容，仅读取赛果结论（data-attribute + 比分）
// 来源：500.com（足球/篮球赛果） + TheSportsDB（F1） + 电竞静态日程
// ============================================================

importScripts('data/leagues.js', 'data/esports_schedule.js');

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
  language: 'zh',
};

// ============================================================
// 安装 & 启动
// ============================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[赛事播报 v2.0.6] 安装/更新:', details.reason);
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  setupAllAlarms();
  try { await fetchAllData(); } catch (e) { console.error(e.message); }
});

chrome.runtime.onStartup.addListener(async () => {
  setupAllAlarms();
  try { await fetchAllData(); } catch (e) { console.error(e.message); }
});

// ============================================================
// 定时器
// ============================================================
function setupAllAlarms() {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('fetchScores', { periodInMinutes: 2 });
    chrome.alarms.create('fetchF1', { periodInMinutes: 15 });
    chrome.alarms.create('cleanold', { periodInMinutes: 120 });
    chrome.alarms.create('yesterdaySummary', { when: getNextTime(8, 0), periodInMinutes: 1440 });
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'fetchScores': await fetchAllData(); break;
    case 'fetchF1': await fetchF1Data(); break;
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
// 核心：读取500.com赛果结论（data-attribute + 比分，不爬取页面内容）
// ============================================================

/**
 * 从500.com读取赛果结论
 * 策略：只读取 data-homesxname / data-awaysxname（球队名）和 td 中的比分（结论）
 * 不解析DOM，不爬取页面内容，只提取关键赛果信息
 */
async function fetch500Results(url, sport) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const buffer = await res.arrayBuffer();
    const html = new TextDecoder('gbk').decode(buffer);

    // 正则：匹配每行赛事的 data- 属性（球队名）和 td 内容（比分结论）
    const rowRe = /<tr class="bet-tb-tr[^"]*"\s*data-homesxname="([^"]*)"\s*data-awaysxname="([^"]*)"[^>]*>(.*?)<\/tr>/gs;
    const matches = [...html.matchAll(rowRe)];

    const results = [];
    for (const m of matches) {
      const homeTeam = m[1];
      const awayTeam = m[2];
      const rowHtml = m[3];

      // 提取 td 中的赛果结论
      const cells = [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];
      if (cells.length < 6) continue;

      const league = cells[1]?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const matchTime = cells[2]?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const raw = cells[3]?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';

      // 赛果结论：提取比分
      let score = 'vs';
      let status = '未开始';
      if (raw.match(/(\d+:\d+)/)) {
        score = RegExp.$1.replace(':', ' - ');
        status = '已结束';
      }

      // 只保留用户关注的赛事
      if (sport === 'football' && !isWantedLeague(league, ['世界杯', 'World Cup'])) continue;
      if (sport === 'basketball' && !isWantedLeague(league, ['NBA'])) continue;

      results.push({
        id: `500-${sport}-${results.length}`,
        league, time: matchTime, home: homeTeam, away: awayTeam, score, status,
        detailUrl: url,
        source: '500彩票网',
        sport,
        type: status === '已结束' ? 'result' : 'live',
      });
    }

    console.log(`[500.com ${sport}] 赛果: ${results.filter(r => r.status === '已结束').length} 场, 未开赛: ${results.filter(r => r.status === '未开始').length} 场`);
    return results;
  } catch (err) {
    console.warn(`[500.com ${sport}] 失败:`, err.message);
    return [];
  }
}

/** 检查联赛名是否匹配目标关键词 */
function isWantedLeague(league, keywords) {
  return keywords.some(kw => league.includes(kw));
}

// ============================================================
// F1 数据：TheSportsDB（JSON API，读取赛事结论）
// ============================================================
async function fetchF1Data() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Motorsport`);
    const data = await res.json();
    if (!data.events) return [];

    const f1 = data.events.filter(e => (e.strLeague || '').toLowerCase().includes('formula'));
    const results = f1.map(evt => {
      const hasResult = evt.intHomeScore != null;
      return {
        id: `f1-${evt.idEvent}`,
        league: 'F1',
        home: evt.strEvent || evt.strHomeTeam || '',
        away: evt.strAwayTeam || '',
        score: hasResult ? `${evt.intHomeScore} - ${evt.intAwayScore}` : 'vs',
        status: hasResult ? '已结束' : (evt.strStatus || '未开始'),
        time: evt.strTimestamp || evt.dateEvent || '',
        detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
        source: 'TheSportsDB',
        sport: 'motorsport',
        type: hasResult ? 'result' : 'live',
      };
    });

    console.log('[F1] 赛果:', results.filter(r => r.type === 'result').length, '场, 未开始:', results.filter(r => r.type === 'live').length, '场');

    await chrome.storage.local.set({ f1Data: results });
    return results;
  } catch (err) {
    console.warn('[F1] 失败:', err.message);
    return [];
  }
}

// ============================================================
// 电竞日程（静态数据，读取内置赛程结论）
// ============================================================
function getEsportsCards() {
  return getActiveEsportsEvents().map(evt => ({
    id: evt.id,
    league: evt.league,
    game: evt.game,
    home: evt.league,
    away: evt.status,
    score: evt.status === '进行中' ? '进行中' : (evt.status === '即将开始' ? '即将开始' : evt.status),
    status: evt.status,
    time: evt.startDate,
    detailUrl: evt.detailUrl,
    source: '电竞日程',
    sport: 'esports',
    type: 'live',
    info: evt.info || '',
  }));
}

// ============================================================
// 主入口：聚合所有赛果结论
// ============================================================
async function fetchAllData() {
  console.log('[fetchAllData] 开始读取赛果结论...');

  const [football, basketball, f1Cached, esportsCards] = await Promise.all([
    fetch500Results('https://trade.500.com/jczq/', 'football'),
    fetch500Results('https://trade.500.com/jclq/', 'basketball'),
    chrome.storage.local.get('f1Data').then(d => d.f1Data || []),
    Promise.resolve(getEsportsCards()),
  ]);

  // 同时异步拉取最新F1数据（不阻塞主流程）
  fetchF1Data();

  let allMatches = [...football, ...basketball, ...f1Cached, ...esportsCards];

  // 联赛过滤
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  if (s.selectedLeagues.length > 0 && typeof findLeague === 'function') {
    allMatches = allMatches.filter(m => {
      return s.selectedLeagues.some(leagueId => {
        const league = findLeague(leagueId);
        if (!league) return false;
        return league.keywords.some(kw =>
          (m.league || '').includes(kw) || (m.game || '').includes(kw)
        );
      });
    });
  }

  console.log('[fetchAllData] 赛果结论:', allMatches.filter(m => m.type === 'result').length, '场, 未开始/进行中:', allMatches.filter(m => m.type !== 'result').length, '场');

  // 写入存储
  const oldData = (await chrome.storage.local.get('liveMatches')).liveMatches || [];
  await chrome.storage.local.set({ liveMatches: allMatches, lastUpdate: Date.now() });

  // 已结束的存入历史
  const finished = allMatches.filter(m => m.type === 'result');
  if (finished.length > 0) await saveToHistory(finished);

  // 通知
  detectChanges(oldData, allMatches, s);

  return allMatches;
}

/** 对比新旧数据，发送通知 */
function detectChanges(oldData, newData, settings) {
  const changes = newData.filter(m => {
    const old = oldData.find(o => o.id === m.id);
    return !old || old.score !== m.score || old.status !== m.status;
  });

  if (changes.length > 0) {
    chrome.action.setBadgeText({ text: String(Math.min(changes.length, 99)) });
    chrome.action.setBadgeBackgroundColor({ color: '#3fb950' });

    for (const match of changes) {
      if (match.type === 'result' && match.status === '已结束' && settings.notifyFinal) {
        notifyMatch(match, 'final');
      }
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ============================================================
// 历史存储
// ============================================================
async function saveToHistory(matches) {
  const { matchHistory } = await chrome.storage.local.get('matchHistory');
  const history = matchHistory || {};
  const today = new Date().toISOString().split('T')[0];
  for (const match of matches) {
    history[`${today}_${match.id}`] = { ...match, savedDate: today, timestamp: Date.now() };
  }
  // 只保留一年
  const cutoff = Date.now() - 365 * 86400000;
  const cleaned = {};
  Object.entries(history).forEach(([k, v]) => { if (v.timestamp > cutoff) cleaned[k] = v; });
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
// 收藏
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
// 通知 & 语音
// ============================================================
function notifyMatch(match, type) {
  const gameLabel = match.game ? `[${match.game}] ` : '';
  const sportIcon = match.sport === 'football' ? '⚽' : (match.sport === 'basketball' ? '🏀' : (match.sport === 'motorsport' ? '🏎️' : '🎮'));
  const title = type === 'final' ? `${sportIcon} 赛果` : `${sportIcon} 赛事更新`;

  chrome.notifications.create(`match-${match.id}-${type}`, {
    type: 'basic', iconUrl: 'icons/icon-128.png',
    title,
    message: `${gameLabel}${match.league}：${match.home} ${match.score} ${match.away}\n来源：${match.source}`,
    priority: 2,
  });

  chrome.storage.sync.get('settings', (data) => {
    const s = data.settings || DEFAULT_SETTINGS;
    if (s.voiceAnnounce && type === 'final' && s.voiceFinals) {
      chrome.tts.speak(`${match.league}，${match.home} ${match.score} ${match.away}`, { lang: 'zh-CN', rate: 0.85 });
    }
  });
}

// ============================================================
// 清理
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
// 语音开关
// ============================================================
async function toggleVoice() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  s.voiceAnnounce = !s.voiceAnnounce;
  await chrome.storage.sync.set({ settings: s });
  if (s.voiceAnnounce) chrome.tts.speak('语音播报已开启', { lang: 'zh-CN', rate: 1.0 });
  return { voiceAnnounce: s.voiceAnnounce };
}

// ============================================================
// 昨日总结
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
    date: yesterdayStr,
    dateDisplay: yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
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