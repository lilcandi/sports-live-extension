// ============================================================
// 赛事实时播报 - Service Worker (Manifest V3) v2.0.2
// 功能：体育+电竞+中文内容源+历史搜索+未来赛事+收藏赛制+语音播报+昨日总结
// ============================================================

// 导入数据定义
try {
  importScripts('data/leagues.js', 'data/sources.js');
  console.log('[赛事实时播报] 数据文件加载成功，联赛数:', getAllLeagues().length);
} catch (e) {
  console.error('[赛事实时播报] importScripts 失败:', e.message, e.stack);
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
// 安装 & 更新
// ============================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[赛事实时播报 v2.0.2] 已安装/更新:', details.reason);
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  setupAllAlarms();
  // 立即拉取数据
  try {
    const count = await fetchAllData();
    console.log('[赛事实时播报] 初始化拉取完成，赛事数:', count.length);
  } catch (e) {
    console.error('[赛事实时播报] 初始化拉取失败:', e.message);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  setupAllAlarms();
  try {
    const count = await fetchAllData();
    console.log('[赛事实时播报] 启动拉取完成，赛事数:', count.length);
  } catch (e) {
    console.error('[赛事实时播报] 启动拉取失败:', e.message);
  }
});

// ============================================================
// 定时器设置
// ============================================================
function setupAllAlarms() {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('fetchScores', { periodInMinutes: 0.5 });      // 30秒 - 实时比分
    chrome.alarms.create('fetchEsports', { periodInMinutes: 3 });       // 3分钟 - 电竞数据
    chrome.alarms.create('fetchDailyResults', { periodInMinutes: 60 }); // 1小时 - 每日赛果
    chrome.alarms.create('fetchContent', { periodInMinutes: 10 });      // 10分钟 - 中文内容
    chrome.alarms.create('fetchFutureEvents', { periodInMinutes: 30 }); // 30分钟 - 未来赛事
    chrome.alarms.create('cleanold', { periodInMinutes: 120 });         // 2小时 - 清理
    // 每日早上8点生成昨日总结
    chrome.alarms.create('yesterdaySummary', { when: getNextTime(8, 0), periodInMinutes: 1440 });
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'fetchScores':       await fetchAllData(); break;
    case 'fetchEsports':      await fetchEsportsData(); break;
    case 'fetchDailyResults': await fetch500Results(); break;
    case 'fetchContent':      await fetchContentFeeds(); break;
    case 'fetchFutureEvents': await fetchFutureEvents(); break;
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
      Promise.all([fetchAllData(), fetchEsportsData(), fetchContentFeeds(), fetchFutureEvents()])
        .then(() => sendResponse({ ok: true }));
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
// 1. 体育数据：TheSportsDB
// ============================================================
async function fetchTheSportsDB() {
  try {
    const API_KEY = '3';
    const BASE = 'https://www.thesportsdb.com/api/v1/json';
    const today = new Date().toISOString().split('T')[0];

    const res = await fetch(`${BASE}/${API_KEY}/eventsday.php?d=${today}&s=Soccer`);
    const data = await res.json();
    console.log('[TheSportsDB] 请求成功:', data.events?.length || 0, '场赛事');
    if (!data.events) return [];

    return data.events.map(evt => ({
      id: `tsdb-${evt.idEvent}`,
      league: evt.strLeague || '',
      home: evt.strHomeTeam || '',
      away: evt.strAwayTeam || '',
      score: evt.intHomeScore != null ? `${evt.intHomeScore} - ${evt.intAwayScore}` : 'vs',
      status: evt.strStatus || evt.strProgress || '',
      time: evt.strTimestamp || evt.dateEvent || '',
      detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
      source: 'TheSportsDB',
      sport: 'football',
      type: 'live',
    }));
  } catch (err) {
    console.warn('[TheSportsDB] 请求失败:', err.message);
    return [];
  }
}

// ============================================================
// 2. 体育数据：500彩票网
// ============================================================
async function fetch500Results() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://trade.500.com/jczq/?date=${today}`, {
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
      results.push({
        id: `500-${today}-${idx}`,
        league: cells[1]?.textContent?.trim() || '',
        time: cells[2]?.textContent?.trim() || '',
        home: cells[3]?.textContent?.trim() || '',
        away: cells[5]?.textContent?.trim() || '',
        score: cells[4]?.textContent?.trim() || 'vs',
        status: '已结束',
        detailUrl: `https://trade.500.com/jczq/?date=${today}`,
        source: '500彩票网',
        sport: 'football',
        type: 'result',
      });
    });

    if (results.length > 0) {
      await chrome.storage.local.set({ dailyResults: results, dailyResultsDate: today });
      // 存入历史
      await saveToHistory(results);
    }
    return results;
  } catch (err) {
    console.warn('[500彩票网] 请求失败:', err.message);
    return [];
  }
}

// ============================================================
// 3. 电竞数据：Liquipedia + HLTV + vlr.gg 爬取
// ============================================================
async function fetchEsportsData() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const selected = s.selectedLeagues || [];
  const esportsIds = selected.filter(id => LEAGUES.esports.some(l => l.id === id));

  if (esportsIds.length === 0 && selected.length > 0) return []; // 用户只选了传统体育

  const allMatches = [];

  // 3a. Liquipedia: LOL 赛事 (LPL/LCK/MSI/Worlds)
  try {
    const lolMatches = await fetchLiquipediaLOL();
    allMatches.push(...lolMatches);
  } catch (e) { console.warn('[Liquipedia] LOL:', e.message); }

  // 3b. HLTV: CS2 赛事
  try {
    const cs2Matches = await fetchHLTV();
    allMatches.push(...cs2Matches);
  } catch (e) { console.warn('[HLTV] CS2:', e.message); }

  // 3c. vlr.gg: Valorant 赛事
  try {
    const valMatches = await fetchVLR();
    allMatches.push(...valMatches);
  } catch (e) { console.warn('[vlr.gg] Valorant:', e.message); }

  // 3d. Liquipedia: Dota2 TI
  try {
    const dotaMatches = await fetchLiquipediaDota2();
    allMatches.push(...dotaMatches);
  } catch (e) { console.warn('[Liquipedia] Dota2:', e.message); }

  if (allMatches.length > 0) {
    await chrome.storage.local.set({ esportsMatches: allMatches, esportsLastUpdate: Date.now() });
  }

  return allMatches;
}

// --- Liquipedia LOL 数据 ---
async function fetchLiquipediaLOL() {
  // 通过 Liquipedia API 获取赛事页面
  const pages = [
    { title: 'LPL/2026/Summer', id: 'lol-lpl' },
    { title: 'LCK/2026/Summer', id: 'lol-lck' },
    { title: 'LEC/2026/Summer', id: 'lol-lec' },
    { title: 'LCS/2026/Summer', id: 'lol-lcs' },
    { title: 'Mid-Season_Invitational/2026', id: 'lol-msi' },
    { title: 'World_Championship/2026', id: 'lol-worlds' },
  ];

  const matches = [];
  for (const page of pages) {
    try {
      const url = `https://liquipedia.net/leagueoflegends/api.php?action=parse&page=${encodeURIComponent(page.title)}&prop=text&format=json&origin=*`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        console.warn('[Liquipedia] LOL fetch failed:', res.status, page.title);
        continue;
      }
      const data = await res.json();
      if (!data.parse) continue;

      const html = data.parse.text['*'];
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // 查找赛程表格
      const tables = doc.querySelectorAll('table.wikitable');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 4) return;

          const dateCell = cells[0]?.textContent?.trim() || '';
          const team1 = cells[1]?.textContent?.trim() || '';
          const scoreCell = cells[2]?.textContent?.trim() || '';
          const team2 = cells[3]?.textContent?.trim() || '';

          if (!team1 || !team2) return;

          const isLive = scoreCell.includes('vs') || scoreCell.includes(':') || /\d+-\d+/.test(scoreCell);
          const isFinished = /\d+-\d+/.test(scoreCell) && !scoreCell.includes('vs');

          matches.push({
            id: `lol-${page.id}-${matches.length}`,
            league: page.title.replace(/_/g, ' ').replace(/\//g, ' '),
            home: team1,
            away: team2,
            score: scoreCell || 'vs',
            status: isFinished ? '已结束' : (isLive ? '进行中' : '未开始'),
            time: dateCell,
            detailUrl: `https://liquipedia.net/leagueoflegends/${page.title}`,
            source: 'Liquipedia',
            sport: 'esports',
            game: 'LOL',
            type: isFinished ? 'result' : 'live',
          });
        });
      });
    } catch (e) {
      // 单个页面失败不影响其他
    }
  }
  return matches;
}

// --- HLTV CS2 数据 ---
async function fetchHLTV() {
  try {
    const res = await fetch('https://www.hltv.org/matches', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const matches = [];
    const matchCards = doc.querySelectorAll('.upcomingMatch, .liveMatch, .standard-box');

    matchCards.forEach(card => {
      const teams = card.querySelectorAll('.team');
      const scoreEl = card.querySelector('.match-score, .map-score');
      const eventEl = card.querySelector('.match-event-name, .event-name');
      const timeEl = card.querySelector('.match-time');
      const statusEl = card.querySelector('.match-status');

      if (teams.length < 2) return;

      const team1 = teams[0]?.textContent?.trim() || '';
      const team2 = teams[1]?.textContent?.trim() || '';
      const score = scoreEl?.textContent?.trim() || 'vs';
      const event = eventEl?.textContent?.trim() || 'CS2赛事';
      const time = timeEl?.textContent?.trim() || '';
      const statusText = statusEl?.textContent?.trim() || '';

      const isLive = statusText.toLowerCase().includes('live');
      const isFinished = statusText.toLowerCase().includes('finished');

      matches.push({
        id: `cs2-hltv-${matches.length}`,
        league: event,
        home: team1,
        away: team2,
        score: score,
        status: isFinished ? '已结束' : (isLive ? '进行中' : '未开始'),
        time: time,
        detailUrl: card.querySelector('a')?.href || 'https://www.hltv.org/matches',
        source: 'HLTV',
        sport: 'esports',
        game: 'CS2',
        type: isFinished ? 'result' : 'live',
      });
    });

    return matches;
  } catch (e) {
    return [];
  }
}

// --- vlr.gg Valorant 数据 ---
async function fetchVLR() {
  try {
    const res = await fetch('https://www.vlr.gg/matches', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const matches = [];
    const matchItems = doc.querySelectorAll('.wf-card, .match-item');

    matchItems.forEach(item => {
      const teams = item.querySelectorAll('.match-item-vs-team-name, .wf-title-med');
      const scoreEl = item.querySelector('.match-item-vs-score, .js-spoiler');
      const eventEl = item.querySelector('.match-item-event, .wf-title');
      const timeEl = item.querySelector('.match-item-time');
      const statusEl = item.querySelector('.ml-status');

      if (teams.length < 2) return;

      const team1 = teams[0]?.textContent?.trim() || '';
      const team2 = teams[1]?.textContent?.trim() || '';
      const score = scoreEl?.textContent?.trim() || 'vs';
      const event = eventEl?.textContent?.trim() || 'Valorant赛事';
      const time = timeEl?.textContent?.trim() || '';
      const statusText = statusEl?.textContent?.trim() || '';

      const isLive = statusText.toLowerCase().includes('live');
      const isFinished = statusText.toLowerCase().includes('completed');

      matches.push({
        id: `val-vlr-${matches.length}`,
        league: event,
        home: team1,
        away: team2,
        score: score,
        status: isFinished ? '已结束' : (isLive ? '进行中' : '未开始'),
        time: time,
        detailUrl: item.querySelector('a')?.href || 'https://www.vlr.gg/matches',
        source: 'vlr.gg',
        sport: 'esports',
        game: 'Valorant',
        type: isFinished ? 'result' : 'live',
      });
    });

    return matches;
  } catch (e) {
    return [];
  }
}

// --- Liquipedia Dota2 数据 ---
async function fetchLiquipediaDota2() {
  try {
    const url = 'https://liquipedia.net/dota2/api.php?action=parse&page=The_International/2026&prop=text&format=json&origin=*';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      console.warn('[Liquipedia] Dota2 fetch failed:', res.status);
      return [];
    }
    const data = await res.json();
    if (!data.parse) return [];

    const html = data.parse.text['*'];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table.wikitable');
    const matches = [];

    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return;
        matches.push({
          id: `dota2-ti-${matches.length}`,
          league: 'The International 2026',
          home: cells[1]?.textContent?.trim() || '',
          away: cells[3]?.textContent?.trim() || '',
          score: cells[2]?.textContent?.trim() || 'vs',
          status: /\d+-\d+/.test(cells[2]?.textContent?.trim() || '') ? '已结束' : '未开始',
          time: cells[0]?.textContent?.trim() || '',
          detailUrl: 'https://liquipedia.net/dota2/The_International/2026',
          source: 'Liquipedia',
          sport: 'esports',
          game: 'Dota2',
          type: 'live',
        });
      });
    });
    return matches;
  } catch (e) {
    return [];
  }
}

// ============================================================
// 4. 中文内容源：微博/知乎/虎扑
// ============================================================
async function fetchContentFeeds() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const sourceSettings = s.sourceSettings || DEFAULT_SOURCE_SETTINGS;
  const tokens = s.apiTokens || DEFAULT_TOKENS;

  const allFeeds = [];

  // 微博热搜 (ALAPI)
  if (sourceSettings.weibo?.enabled) {
    try {
      const token = tokens.alapi || '';
      const url = token
        ? `https://v2.alapi.cn/api/new/wbtop?num=20&token=${token}`
        : 'https://rsshub.app/weibo/search/hot';

      const res = await fetch(url);
      const data = await res.json();

      let items = [];
      if (data.code === 200 && data.data) {
        // ALAPI 格式
        items = (data.data.list || data.data || []).map(i => ({
          title: i.word || i.title || '',
          url: i.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(i.word || '')}`,
          hot: i.num || i.hotValue || '',
        }));
      } else if (data.items) {
        // RSSHub 格式
        items = data.items.map(i => ({
          title: i.title || '',
          url: i.link || i.url || '',
          hot: '',
        }));
      }

      // 关键词过滤
      const filter = CONTENT_SOURCES.weibo.filter;
      const filtered = items.filter(i =>
        filter.some(kw => i.title.includes(kw))
      ).slice(0, 15);

      filtered.forEach(i => {
        allFeeds.push({
          id: `wb-${allFeeds.length}`,
          title: `🔥 ${i.title}`,
          url: i.url,
          source: '微博热搜',
          sourceIcon: '📢',
          hot: i.hot,
          time: new Date().toISOString(),
          type: 'news',
        });
      });
    } catch (e) { console.warn('[微博热搜] 请求失败:', e.message); }
  }

  // 知乎热榜 (RSSHub)
  if (sourceSettings.zhihu?.enabled) {
    try {
      const res = await fetch('https://rsshub.app/zhihu/hot');
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/xml');
      const items = doc.querySelectorAll('item');

      const filter = CONTENT_SOURCES.zhihu.filter;
      items.forEach(item => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        if (filter.some(kw => title.includes(kw))) {
          allFeeds.push({
            id: `zh-${allFeeds.length}`,
            title: `💡 ${title}`,
            url: link,
            source: '知乎热榜',
            sourceIcon: '💡',
            time: new Date().toISOString(),
            type: 'news',
          });
        }
      });
    } catch (e) { console.warn('[知乎热榜] 请求失败:', e.message); }
  }

  // 虎扑论坛
  if (sourceSettings.hupu?.enabled) {
    try {
      const res = await fetch('https://bbs.hupu.com/all-gambia', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const posts = doc.querySelectorAll('.titlelink, .topic-title, .post-title');

      const filter = CONTENT_SOURCES.hupu.filter;
      posts.forEach(post => {
        const title = post.textContent?.trim() || '';
        const link = post.querySelector('a')?.href || post.href || '';
        if (title && filter.some(kw => title.includes(kw))) {
          allFeeds.push({
            id: `hp-${allFeeds.length}`,
            title: `🏀 ${title}`,
            url: link.startsWith('http') ? link : `https://bbs.hupu.com${link}`,
            source: '虎扑',
            sourceIcon: '🏀',
            time: new Date().toISOString(),
            type: 'news',
          });
        }
      });
    } catch (e) { console.warn('[虎扑] 请求失败:', e.message); }
  }

  // 虎扑电竞专区
  if (sourceSettings.hupu_esports?.enabled) {
    try {
      const res = await fetch('https://bbs.hupu.com/e-sports', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const posts = doc.querySelectorAll('.titlelink, .topic-title, .post-title');

      posts.forEach(post => {
        const title = post.textContent?.trim() || '';
        const link = post.querySelector('a')?.href || post.href || '';
        if (title) {
          allFeeds.push({
            id: `hp-g-${allFeeds.length}`,
            title: `🎯 ${title}`,
            url: link.startsWith('http') ? link : `https://bbs.hupu.com${link}`,
            source: '虎扑电竞',
            sourceIcon: '🎯',
            time: new Date().toISOString(),
            type: 'news',
          });
        }
      });
    } catch (e) { console.warn('[虎扑电竞] 请求失败:', e.message); }
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
      contentFeeds: unique.slice(0, 50),
      contentLastUpdate: Date.now()
    });
  }

  return allFeeds;
}

// ============================================================
// 5. 未来赛事
// ============================================================
async function fetchFutureEvents() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const selected = s.selectedLeagues || [];

  const futureEvents = [];

  // 从 TheSportsDB 获取未来赛事
  try {
    const API_KEY = '3';
    const BASE = 'https://www.thesportsdb.com/api/v1/json';
    // 获取未来两周的赛事
    for (let d = 0; d < 14; d++) {
      const date = new Date(Date.now() + d * 86400000).toISOString().split('T')[0];
      const res = await fetch(`${BASE}/${API_KEY}/eventsday.php?d=${date}&s=Soccer`);
      const data = await res.json();
      if (!data.events) continue;

      for (const evt of data.events) {
        if (evt.strStatus === 'Not Started' || !evt.strStatus) {
          futureEvents.push({
            id: `future-${evt.idEvent}`,
            league: evt.strLeague || '',
            home: evt.strHomeTeam || '',
            away: evt.strAwayTeam || '',
            score: 'vs',
            status: '未开始',
            time: evt.dateEvent || '',
            detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
            source: 'TheSportsDB',
            sport: 'football',
            type: 'future',
          });
        }
      }
    }
  } catch (e) { console.warn('[未来赛事] 请求失败:', e.message); }

  // 电竞未来赛程（从 Liquipedia）
  try {
    const lol = await fetchLiquipediaLOL();
    futureEvents.push(...lol.filter(m => m.type !== 'result'));
  } catch (e) {}

  try {
    const cs2 = await fetchHLTV();
    futureEvents.push(...cs2.filter(m => m.type !== 'result'));
  } catch (e) {}

  if (futureEvents.length > 0) {
    await chrome.storage.local.set({
      futureEvents: futureEvents.slice(0, 100),
      futureLastUpdate: Date.now()
    });
  }

  return futureEvents;
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
    history[key] = {
      ...match,
      savedDate: today,
      timestamp: Date.now(),
    };
  }

  // 只保留最近一年的数据
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

  // 时间范围过滤
  if (startDate) {
    results = results.filter(m => m.savedDate >= startDate);
  }
  if (endDate) {
    results = results.filter(m => m.savedDate <= endDate);
  }

  // 关键词搜索
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(m =>
      (m.league || '').toLowerCase().includes(q) ||
      (m.home || '').toLowerCase().includes(q) ||
      (m.away || '').toLowerCase().includes(q) ||
      (m.game || '').toLowerCase().includes(q) ||
      (m.source || '').toLowerCase().includes(q)
    );
  }

  // 按时间倒序
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return { results: results.slice(0, 200), total: results.length };
}

// ============================================================
// 7. 收藏赛制
// ============================================================
async function getFavorites() {
  const { favorites } = await chrome.storage.sync.get('favorites');
  return { favorites: favorites || [] };
}

async function toggleFavorite(leagueId) {
  const { favorites } = await chrome.storage.sync.get('favorites');
  let favs = favorites || [];

  const idx = favs.indexOf(leagueId);
  if (idx > -1) {
    favs.splice(idx, 1);
  } else {
    favs.push(leagueId);
  }

  await chrome.storage.sync.set({ favorites: favs });
  return { favorites: favs, toggled: leagueId, isFav: idx === -1 };
}

// ============================================================
// 8. 综合数据聚合
// ============================================================
async function fetchAllData() {
  console.log('[fetchAllData] 开始拉取数据...');
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const selectedLeagues = s.selectedLeagues || [];

  // 1. 体育数据
  const tsdbMatches = await fetchTheSportsDB();
  console.log('[fetchAllData] TheSportsDB 返回:', tsdbMatches.length, '场');

  // 2. 500彩票网（缓存）
  const { dailyResults } = await chrome.storage.local.get('dailyResults');

  // 3. 电竞数据（缓存）
  const { esportsMatches } = await chrome.storage.local.get('esportsMatches');

  // 4. 合并所有赛事
  let allMatches = [...tsdbMatches];
  if (dailyResults) allMatches = allMatches.concat(dailyResults);
  if (esportsMatches) allMatches = allMatches.concat(esportsMatches);

  console.log('[fetchAllData] 合并后:', allMatches.length, '场，已选联赛:', selectedLeagues.length);

  // 5. 按联赛过滤
  if (selectedLeagues.length > 0) {
    allMatches = allMatches.filter(match => {
      return selectedLeagues.some(leagueId => {
        const league = findLeague(leagueId);
        if (!league) return false;
        return league.keywords.some(kw =>
          (match.league || '').toLowerCase().includes(kw.toLowerCase()) ||
          (match.game || '').toLowerCase().includes(kw.toLowerCase())
        );
      });
    });
    console.log('[fetchAllData] 过滤后:', allMatches.length, '场');
  }

  // 6. 去重
  const seen = new Set();
  const unique = allMatches.filter(m => {
    const key = `${m.home}-${m.away}-${m.league}`.substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 7. 写入存储
  const oldData = (await chrome.storage.local.get('liveMatches')).liveMatches || [];
  await chrome.storage.local.set({
    liveMatches: unique,
    lastUpdate: Date.now()
  });

  // 7b. 将已结束的比赛存入历史
  const finishedMatches = unique.filter(m => m.score !== 'vs' && m.score !== '0 - 0');
  if (finishedMatches.length > 0) {
    await saveToHistory(finishedMatches);
  }

  console.log('[fetchAllData] 写入完成:', unique.length, '场赛事，存入历史:', finishedMatches.length, '场');

  // 8. 检测变化并通知
  const changes = unique.filter(m => {
    const old = oldData.find(o => o.id === m.id);
    return !old || old.score !== m.score || old.status !== m.status;
  });

  if (changes.length > 0) {
    const badgeText = changes.length > 99 ? '99+' : String(changes.length);
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#3fb950' });

    for (const match of changes) {
      const isGoal = match.score !== 'vs' && !match.score?.includes('vs');
      const isFinal = match.status === 'FT' || match.status === '已结束' || match.status === 'Finished';
      const isStart = match.status === '1H' || match.status === '进行中' || match.status === 'Live';

      if (isGoal && s.notifyGoals) notifyMatch(match, 'goal');
      if (isFinal && s.notifyFinal) notifyMatch(match, 'final');
      if (isStart && s.notifyStart) notifyMatch(match, 'start');
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }

  return unique;
}

// ============================================================
// 9. 通知
// ============================================================
function notifyMatch(match, type) {
  const titles = {
    goal: '⚽ 进球/得分！',
    final: '🏁 比赛结束',
    start: '▶ 比赛开始'
  };
  const title = titles[type] || '赛事更新';

  // 中文推送
  const gameLabel = match.game ? `[${match.game}] ` : '';
  const message = `${match.home} ${match.score} ${match.away}\n${gameLabel}${match.league} · ${match.source}`;

  chrome.notifications.create(`match-${match.id}-${type}`, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message,
    priority: 2
  });

  // 语音播报
  chrome.storage.sync.get('settings', (data) => {
    const s = data.settings || DEFAULT_SETTINGS;
    if (s.voiceAnnounce) {
      if (type === 'goal' && s.voiceGoals) {
        const voiceText = `进球！${match.home} ${match.score} ${match.away}`;
        chrome.tts.speak(voiceText, { lang: 'zh-CN', rate: 0.9, pitch: 1.0 });
      }
      if (type === 'final' && s.voiceFinals) {
        const voiceText = `比赛结束，${match.league}，${match.home} ${match.score} ${match.away}`;
        chrome.tts.speak(voiceText, { lang: 'zh-CN', rate: 0.85, pitch: 1.0 });
      }
    }
  });
}

// ============================================================
// 10. 清理
// ============================================================
function cleanOldData() {
  chrome.notifications.getAll((items) => {
    const now = Date.now();
    for (const [id, info] of Object.entries(items)) {
      if (now - info.timestamp > 3600000) {
        chrome.notifications.clear(id);
      }
    }
  });
}

// ============================================================
// 11. 昨日赛事总结
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
      total: 0,
      bySport: {},
      byLeague: {},
      highlights: [],
      topText: `${yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}暂无赛事记录`,
    };
    await chrome.storage.local.set({ yesterdaySummary: summary, yesterdaySummaryDate: yesterdayStr });
    return summary;
  }

  // 按运动分类
  const bySport = {};
  const byLeague = {};
  const highlights = [];

  yesterdayMatches.forEach(m => {
    const sport = m.sport || '其他';
    if (!bySport[sport]) bySport[sport] = { count: 0, matches: [] };
    bySport[sport].count++;
    bySport[sport].matches.push(m);

    const league = m.league || '未知赛事';
    if (!byLeague[league]) byLeague[league] = { count: 0, matches: [] };
    byLeague[league].count++;
    byLeague[league].matches.push(m);

    // 收集高光比赛（大比分）
    if (m.score && m.score !== 'vs') {
      const parts = m.score.split('-').map(Number);
      if (parts.length === 2) {
        const total = parts[0] + parts[1];
        if (total >= 4) {
          highlights.push({
            match: `${m.home} ${m.score} ${m.away}`,
            league: m.league || '',
            game: m.game || '',
            sport: m.sport || '',
          });
        }
      }
    }
  });

  // 生成文字总结
  const sportNames = { football: '足球', basketball: '篮球', esports: '电竞' };
  const sportParts = Object.entries(bySport).map(([k, v]) => {
    const name = sportNames[k] || (k === 'other' ? '其他' : k);
    return `${name}${v.count}场`;
  });

  const topText = `${yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}共进行${yesterdayMatches.length}场比赛，${sportParts.join('，')}`;

  const summary = {
    date: yesterdayStr,
    dateDisplay: yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    total: yesterdayMatches.length,
    bySport,
    byLeague,
    highlights: highlights.slice(0, 10),
    topText,
  };

  await chrome.storage.local.set({ yesterdaySummary: summary, yesterdaySummaryDate: yesterdayStr });

  // 如果有高光比赛，发送通知
  if (highlights.length > 0) {
    chrome.notifications.create('yesterday-summary', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: '📊 昨日赛事总结',
      message: topText + (highlights.length > 0 ? `\n高光比赛：${highlights[0].match}` : ''),
      priority: 1,
    });
  }

  return summary;
}

// 获取缓存的昨日总结（不重新生成）
async function getYesterdaySummaryCache() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const { yesterdaySummary, yesterdaySummaryDate } = await chrome.storage.local.get(['yesterdaySummary', 'yesterdaySummaryDate']);

  if (yesterdaySummary && yesterdaySummaryDate === yesterday) {
    return { summary: yesterdaySummary, cached: true };
  }
  return { summary: yesterdaySummary || null, cached: false };
}

// ============================================================
// 12. 语音播报开关
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
// 13. 辅助函数：计算下一次指定时间
// ============================================================
function getNextTime(hour, minute) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}