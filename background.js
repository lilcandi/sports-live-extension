// ============================================================
// 赛事实时播报 - Service Worker (Manifest V3)
// 数据源: TheSportsDB (免费) + 500彩票网 (免费) + 雷速体育 (免费)
// ============================================================

const DEFAULT_SETTINGS = {
  refreshInterval: 30,        // 秒
  notifyGoals: true,
  notifyFinal: true,
  notifyStart: true,
  selectedLeagues: [],
  dataSource: 'auto'          // 'auto' | 'thesportsdb' | '500' | 'leisu'
};

// 联赛列表
const ALL_LEAGUES = [
  { id: 'premier-league',  name: '英超',        sport: 'football',   keywords: ['英超', 'Premier League'] },
  { id: 'la-liga',         name: '西甲',        sport: 'football',   keywords: ['西甲', 'La Liga'] },
  { id: 'serie-a',         name: '意甲',        sport: 'football',   keywords: ['意甲', 'Serie A'] },
  { id: 'bundesliga',      name: '德甲',        sport: 'football',   keywords: ['德甲', 'Bundesliga'] },
  { id: 'ligue-1',         name: '法甲',        sport: 'football',   keywords: ['法甲', 'Ligue 1'] },
  { id: 'csl',             name: '中超',        sport: 'football',   keywords: ['中超', 'CSL', 'Chinese Super League'] },
  { id: 'j-league',        name: 'J联赛',       sport: 'football',   keywords: ['J联赛', 'J.League'] },
  { id: 'k-league',        name: 'K联赛',       sport: 'football',   keywords: ['K联赛', 'K League'] },
  { id: 'ucl',             name: '欧冠',        sport: 'football',   keywords: ['欧冠', 'Champions League'] },
  { id: 'afc-cl',          name: '亚冠',        sport: 'football',   keywords: ['亚冠', 'AFC Champions'] },
  { id: 'eredivisie',      name: '荷甲',        sport: 'football',   keywords: ['荷甲', 'Eredivisie'] },
  { id: 'primeira',        name: '葡超',        sport: 'football',   keywords: ['葡超', 'Primeira Liga'] },
  { id: 'nba',             name: 'NBA',         sport: 'basketball', keywords: ['NBA'] },
  { id: 'cba',             name: 'CBA',         sport: 'basketball', keywords: ['CBA'] },
  { id: 'euroleague',      name: '欧洲篮球联赛', sport: 'basketball', keywords: ['Euroleague', 'EuroLeague'] },
  { id: 'nfl',             name: 'NFL',         sport: 'football',   keywords: ['NFL'] },
  { id: 'mlb',             name: 'MLB',         sport: 'baseball',   keywords: ['MLB'] },
  { id: 'nhl',             name: 'NHL',         sport: 'hockey',     keywords: ['NHL'] },
  { id: 'f1',              name: 'F1',          sport: 'racing',     keywords: ['F1', 'Formula 1'] },
  { id: 'tennis',          name: '网球',        sport: 'tennis',     keywords: ['ATP', 'WTA', 'Tennis'] },
];

// ============================================================
// 安装 & 更新
// ============================================================
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[赛事实时播报] 扩展已安装/更新:', details.reason);
  chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  setupAlarm();
  fetchAllData();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarm();
  fetchAllData();
});

// ============================================================
// 定时器
// ============================================================
function setupAlarm() {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('fetchScores', { periodInMinutes: 0.5 }); // 30秒
    chrome.alarms.create('fetchDailyResults', { periodInMinutes: 60 }); // 每小时
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'fetchScores') {
    await fetchAllData();
  } else if (alarm.name === 'fetchDailyResults') {
    await fetch500Results();
  }
});

// ============================================================
// 消息处理
// ============================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'settingsUpdated') {
    setupAlarm();
    fetchAllData();
    sendResponse({ ok: true });
  } else if (msg.type === 'refreshNow') {
    fetchAllData().then(() => sendResponse({ ok: true }));
    return true; // 异步响应
  } else if (msg.type === 'getLeagues') {
    sendResponse({ leagues: ALL_LEAGUES });
  }
});

// ============================================================
// 数据获取：TheSportsDB（免费，2分钟延迟）
// API: https://www.thesportsdb.com/free/v1
// 测试 Key: "3" (免费开发 key)
// ============================================================
async function fetchTheSportsDB() {
  try {
    const API_KEY = '3';
    const BASE = 'https://www.thesportsdb.com/api/v1/json';

    // 获取当天赛事
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BASE}/${API_KEY}/eventsday.php?d=${today}&s=Soccer`);
    const data = await res.json();

    if (!data.events) return [];

    const oldScores = (await chrome.storage.local.get('scores')).scores || {};
    const newScores = {};
    const changes = [];

    for (const evt of data.events) {
      const id = `tsdb-${evt.idEvent}`;
      const homeScore = parseInt(evt.intHomeScore) || 0;
      const awayScore = parseInt(evt.intAwayScore) || 0;
      const status = evt.strStatus || evt.strProgress || '';

      newScores[id] = {
        id,
        league: evt.strLeague,
        home: evt.strHomeTeam,
        away: evt.strAwayTeam,
        score: evt.intHomeScore && evt.intAwayScore ? `${homeScore} - ${awayScore}` : 'vs',
        status: status,
        time: evt.strTimestamp || evt.dateEvent,
        detailUrl: `https://www.thesportsdb.com/event/${evt.idEvent}`,
        source: 'thesportsdb',
        sport: 'football'
      };

      const old = oldScores[id];
      if (!old || old.score !== newScores[id].score || old.status !== newScores[id].status) {
        changes.push(newScores[id]);
      }
    }

    return { scores: newScores, changes };
  } catch (err) {
    console.warn('[赛事实时播报] TheSportsDB 请求失败:', err.message);
    return { scores: {}, changes: [] };
  }
}

// ============================================================
// 数据获取：500彩票网（免费，赛后结果）
// ============================================================
async function fetch500Results() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // '2026-07-03'

    const res = await fetch(`https://trade.500.com/jczq/?date=${dateStr}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('gbk');
    const html = decoder.decode(buffer);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr.bet-tb-tr');

    const results = [];
    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return;

      const id = `500-${dateStr}-${idx}`;
      results.push({
        id,
        league: cells[1]?.textContent?.trim() || '',
        time: cells[2]?.textContent?.trim() || '',
        home: cells[3]?.textContent?.trim() || '',
        away: cells[5]?.textContent?.trim() || '',
        score: cells[4]?.textContent?.trim() || 'vs',
        status: '已结束',
        detailUrl: `https://trade.500.com/jczq/?date=${dateStr}`,
        source: '500.com',
        sport: 'football'
      });
    });

    if (results.length > 0) {
      await chrome.storage.local.set({ dailyResults: results, dailyResultsDate: dateStr });
    }
    return results;
  } catch (err) {
    console.warn('[赛事实时播报] 500彩票网请求失败:', err.message);
    return [];
  }
}

// ============================================================
// 综合数据获取
// ============================================================
async function fetchAllData() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const selectedLeagues = s.selectedLeagues || [];

  // 1. 从 TheSportsDB 获取实时数据
  const { scores: tsdbScores, changes: tsdbChanges } = await fetchTheSportsDB();

  // 2. 检查是否有缓存的 500彩票网数据
  const { dailyResults } = await chrome.storage.local.get('dailyResults');

  // 3. 合并数据
  const allMatches = { ...tsdbScores };
  if (dailyResults) {
    dailyResults.forEach(m => { allMatches[m.id] = m; });
  }

  // 4. 按用户勾选的联赛过滤
  let filtered = Object.values(allMatches);
  if (selectedLeagues.length > 0) {
    filtered = filtered.filter(match => {
      return selectedLeagues.some(leagueId => {
        const league = ALL_LEAGUES.find(l => l.id === leagueId);
        return league && league.keywords.some(kw =>
          (match.league || '').toLowerCase().includes(kw.toLowerCase())
        );
      });
    });
  }

  // 5. 写入存储
  await chrome.storage.local.set({
    liveMatches: filtered,
    lastUpdate: Date.now()
  });

  // 6. 通知
  if (tsdbChanges.length > 0) {
    const badgeText = tsdbChanges.length > 99 ? '99+' : String(tsdbChanges.length);
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#3fb950' });

    for (const match of tsdbChanges) {
      if (s.notifyGoals && match.score !== 'vs') {
        notifyMatch(match, 'goal');
      }
      if (s.notifyFinal && match.status && match.status.includes('FT')) {
        notifyMatch(match, 'final');
      }
      if (s.notifyStart && match.status === '1H' || match.status === '1st Half') {
        notifyMatch(match, 'start');
      }
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ============================================================
// 系统通知
// ============================================================
function notifyMatch(match, type) {
  const titles = {
    goal: '⚽ 进球了！',
    final: '🏁 比赛结束',
    start: '▶ 比赛开始'
  };
  const title = titles[type] || '赛事更新';

  chrome.notifications.create(`match-${match.id}-${type}`, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: `${match.home} ${match.score} ${match.away}\n${match.league}`,
    priority: 2
  });
}

// ============================================================
// 定时清理旧通知
// ============================================================
chrome.alarms.create('cleanNotifications', { periodInMinutes: 120 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanNotifications') {
    chrome.notifications.getAll((items) => {
      const now = Date.now();
      for (const [id, info] of Object.entries(items)) {
        if (now - info.timestamp > 3600000) { // 1小时
          chrome.notifications.clear(id);
        }
      }
    });
  }
});