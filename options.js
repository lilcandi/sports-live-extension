// ============================================================
// 赛事实时播报 v2.2.0 - 设置页面逻辑
// ============================================================

const DEFAULT_SETTINGS_FULL = {
  refreshInterval: 120,
  notifyGoals: true,
  notifyFinal: true,
  notifyStart: false,
  notifyMinHot: 70,
  notifySound: true,
  voiceAnnounce: false,
  voiceGoals: true,
  voiceFinals: true,
  voiceRate: 0.85,
  selectedLeagues: [],
  hotSortEnabled: true,
  showHotBadge: true,
  showSource: true,
  showGameTag: true,
  defaultTab: 'hot',
  maxNewsItems: 50,
  newsEnabled: true,
  newsInterval: 15,
  autoCleanHistory: true,
  historyKeepDays: 365,
  devMode: false,
  sourceSettings: DEFAULT_SOURCE_SETTINGS,
  apiTokens: DEFAULT_TOKENS,
};

let currentSport = 'all';
let selectedLeagues = new Set();

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadDataStats();

  // 搜索
  document.getElementById('searchInput').addEventListener('input', (e) => renderLeagueList(e.target.value));

  // 运动 Tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      currentSport = e.target.dataset.sport;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      renderLeagueList(document.getElementById('searchInput').value);
    });
  });

  // 联赛勾选
  document.getElementById('leagueList').addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      if (e.target.checked) selectedLeagues.add(e.target.value);
      else selectedLeagues.delete(e.target.value);
      renderSelectedTags();
    }
  });

  // 移除已选标签
  document.getElementById('selectedTags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-remove')) {
      selectedLeagues.delete(e.target.dataset.id);
      renderLeagueList(document.getElementById('searchInput').value);
      renderSelectedTags();
    }
  });

  // 保存
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // 恢复默认
  document.getElementById('resetBtn').addEventListener('click', resetSettings);

  // 数据管理按钮
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', importData);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllData);
});

// ============================================================
// 加载设置
// ============================================================
async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = { ...DEFAULT_SETTINGS_FULL, ...(settings || {}) };

  selectedLeagues = new Set(s.selectedLeagues || []);

  // 刷新设置
  document.getElementById('refreshInterval').value = s.refreshInterval || 120;

  // 通知设置
  document.getElementById('notifyGoals').checked = s.notifyGoals !== false;
  document.getElementById('notifyFinal').checked = s.notifyFinal !== false;
  document.getElementById('notifyStart').checked = s.notifyStart === true;
  document.getElementById('notifyMinHot').value = s.notifyMinHot ?? 70;
  document.getElementById('notifySound').checked = s.notifySound !== false;

  // 语音设置
  document.getElementById('voiceAnnounce').checked = s.voiceAnnounce === true;
  document.getElementById('voiceGoals').checked = s.voiceGoals !== false;
  document.getElementById('voiceFinals').checked = s.voiceFinals !== false;
  document.getElementById('voiceRate').value = s.voiceRate || 0.85;

  // 显示设置
  document.getElementById('hotSortEnabled').checked = s.hotSortEnabled !== false;
  document.getElementById('showHotBadge').checked = s.showHotBadge !== false;
  document.getElementById('showSource').checked = s.showSource !== false;
  document.getElementById('showGameTag').checked = s.showGameTag !== false;
  document.getElementById('defaultTab').value = s.defaultTab || 'hot';

  // 资讯设置
  document.getElementById('newsEnabled').checked = s.newsEnabled !== false;
  document.getElementById('newsInterval').value = s.newsInterval || 15;
  document.getElementById('maxNewsItems').value = s.maxNewsItems || 50;

  // 资讯源
  const src = s.sourceSettings || DEFAULT_SOURCE_SETTINGS;
  const sourceIds = [
    'hupu_bxj', 'hupu_nba', 'hupu_football', 'hupu_esports',
    'zhihu_hot', 'zhihu_esports', 'weibo',
    'dongqiudi', 'zhibo8', 'sina_sports', 'qq_sports',
    'toutiao', 'alapi_weibo'
  ];
  sourceIds.forEach(id => {
    const el = document.getElementById('src-' + id);
    if (el) el.checked = src[id]?.enabled !== false;
  });

  // API Tokens
  const tokens = s.apiTokens || DEFAULT_TOKENS;
  document.getElementById('token-alapi').value = tokens.alapi || '';
  document.getElementById('token-juhe').value = tokens.juhe || '';

  // 数据管理
  document.getElementById('autoCleanHistory').checked = s.autoCleanHistory !== false;
  document.getElementById('historyKeepDays').value = s.historyKeepDays ?? 365;

  renderLeagueList();
  renderSelectedTags();
}

// ============================================================
// 加载数据统计
// ============================================================
async function loadDataStats() {
  const local = await chrome.storage.local.get(['matchHistory', 'contentFeeds']);
  const sync = await chrome.storage.sync.get('favorites');

  const history = local.matchHistory || {};
  const feeds = local.contentFeeds || [];
  const favs = sync.favorites || [];

  document.getElementById('stat-matches').textContent = Object.keys(history).length;
  document.getElementById('stat-news').textContent = feeds.length;
  document.getElementById('stat-favs').textContent = favs.length;
}

// ============================================================
// 渲染联赛列表
// ============================================================
function renderLeagueList(searchQuery = '') {
  const list = document.getElementById('leagueList');
  let filtered = getAllLeagues();

  if (currentSport !== 'all') {
    filtered = LEAGUES[currentSport] || [];
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q) ||
      l.keywords.some(k => k.toLowerCase().includes(q)) ||
      (l.game && l.game.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">未找到匹配的联赛</div>';
    return;
  }

  // 按热度排序
  filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  // 按电竞游戏分组
  if (currentSport === 'esports' || currentSport === 'all') {
    const esports = filtered.filter(l => l.game);
    const sports = filtered.filter(l => !l.game);

    let html = '';

    if (sports.length > 0) {
      html += sports.map(l => renderLeagueItem(l)).join('');
    }

    if (esports.length > 0 && currentSport === 'all') {
      html += '<div style="padding:8px 10px;color:var(--accent5);font-weight:700;font-size:13px;border-top:1px solid var(--rule);margin-top:8px">🎮 电竞</div>';
      html += esports.map(l => renderLeagueItem(l)).join('');
    } else if (esports.length > 0) {
      html += esports.map(l => renderLeagueItem(l)).join('');
    }

    list.innerHTML = html;
  } else {
    list.innerHTML = filtered.map(l => renderLeagueItem(l)).join('');
  }
}

function renderLeagueItem(l) {
  const gameTag = l.game ? `<span class="league-game">${l.game}</span>` : '';
  const tierBadge = l.tier ? `<span class="league-tier tier-${l.tier}">${l.tier}</span>` : '';
  let sportLabel = l.game ? getSportLabel('esports') : getSportLabel(l.sport || 'football');
  let icon = l.game ? '🎮' : (l.sport === 'motorsport' ? '🏎️' : (l.sport === 'basketball' ? '🏀' : (l.sport === 'tennis' ? '🎾' : (l.sport === 'tabletennis' ? '🏓' : '⚽'))));
  return `
    <label class="league-item">
      <input type="checkbox" value="${l.id}" ${selectedLeagues.has(l.id) ? 'checked' : ''}>
      <span class="league-icon">${icon}</span>
      <span class="league-name">${l.name}${tierBadge}</span>
      ${gameTag}
      <span class="league-sport">${sportLabel}</span>
    </label>`;
}

// ============================================================
// 渲染已选标签
// ============================================================
function renderSelectedTags() {
  const container = document.getElementById('selectedTags');
  if (selectedLeagues.size === 0) {
    container.innerHTML = '<span style="font-size:12px;color:var(--muted)">未选择联赛（将显示全部赛事）</span>';
    return;
  }
  const tags = [...selectedLeagues].map(id => {
    const league = findLeague(id);
    return league ? `<span class="tag-item">${league.name}<button class="tag-remove" data-id="${id}">×</button></span>` : '';
  });
  container.innerHTML = tags.join('');
}

// ============================================================
// 保存设置
// ============================================================
async function saveSettings() {
  const settings = {
    // 刷新
    refreshInterval: Number(document.getElementById('refreshInterval').value),
    // 通知
    notifyGoals: document.getElementById('notifyGoals').checked,
    notifyFinal: document.getElementById('notifyFinal').checked,
    notifyStart: document.getElementById('notifyStart').checked,
    notifyMinHot: Number(document.getElementById('notifyMinHot').value),
    notifySound: document.getElementById('notifySound').checked,
    // 语音
    voiceAnnounce: document.getElementById('voiceAnnounce').checked,
    voiceGoals: document.getElementById('voiceGoals').checked,
    voiceFinals: document.getElementById('voiceFinals').checked,
    voiceRate: parseFloat(document.getElementById('voiceRate').value),
    // 联赛
    selectedLeagues: [...selectedLeagues],
    // 显示
    hotSortEnabled: document.getElementById('hotSortEnabled').checked,
    showHotBadge: document.getElementById('showHotBadge').checked,
    showSource: document.getElementById('showSource').checked,
    showGameTag: document.getElementById('showGameTag').checked,
    defaultTab: document.getElementById('defaultTab').value,
    maxNewsItems: Number(document.getElementById('maxNewsItems').value),
    // 资讯
    newsEnabled: document.getElementById('newsEnabled').checked,
    newsInterval: Number(document.getElementById('newsInterval').value),
    // 资讯源
    sourceSettings: {
      hupu_bxj:        { enabled: document.getElementById('src-hupu_bxj').checked,        interval: 15 },
      hupu_nba:         { enabled: document.getElementById('src-hupu_nba').checked,         interval: 15 },
      hupu_football:    { enabled: document.getElementById('src-hupu_football').checked,    interval: 15 },
      hupu_esports:     { enabled: document.getElementById('src-hupu_esports').checked,     interval: 15 },
      zhihu_hot:        { enabled: document.getElementById('src-zhihu_hot').checked,        interval: 20 },
      zhihu_esports:    { enabled: document.getElementById('src-zhihu_esports').checked,    interval: 30 },
      weibo:            { enabled: document.getElementById('src-weibo').checked,            interval: 10 },
      dongqiudi:        { enabled: document.getElementById('src-dongqiudi').checked,        interval: 15 },
      zhibo8:           { enabled: document.getElementById('src-zhibo8').checked,           interval: 15 },
      sina_sports:      { enabled: document.getElementById('src-sina_sports').checked,      interval: 20 },
      qq_sports:        { enabled: document.getElementById('src-qq_sports').checked,        interval: 20 },
      toutiao:          { enabled: document.getElementById('src-toutiao').checked,          interval: 10 },
      alapi_weibo:      { enabled: document.getElementById('src-alapi_weibo').checked,      interval: 10 },
    },
    // API
    apiTokens: {
      alapi: document.getElementById('token-alapi').value.trim(),
      juhe:  document.getElementById('token-juhe').value.trim(),
    },
    // 数据
    autoCleanHistory: document.getElementById('autoCleanHistory').checked,
    historyKeepDays: Number(document.getElementById('historyKeepDays').value),
  };

  await chrome.storage.sync.set({ settings });
  chrome.runtime.sendMessage({ type: 'settingsUpdated' });
  showToast('设置已保存 ✓');
}

// ============================================================
// 恢复默认
// ============================================================
function resetSettings() {
  if (!confirm('确定恢复默认设置？当前配置将被清除。')) return;

  selectedLeagues = new Set();

  // 刷新
  document.getElementById('refreshInterval').value = 120;
  // 通知
  document.getElementById('notifyGoals').checked = true;
  document.getElementById('notifyFinal').checked = true;
  document.getElementById('notifyStart').checked = false;
  document.getElementById('notifyMinHot').value = 70;
  document.getElementById('notifySound').checked = true;
  // 语音
  document.getElementById('voiceAnnounce').checked = false;
  document.getElementById('voiceGoals').checked = true;
  document.getElementById('voiceFinals').checked = true;
  document.getElementById('voiceRate').value = 0.85;
  // 显示
  document.getElementById('hotSortEnabled').checked = true;
  document.getElementById('showHotBadge').checked = true;
  document.getElementById('showSource').checked = true;
  document.getElementById('showGameTag').checked = true;
  document.getElementById('defaultTab').value = 'hot';
  document.getElementById('maxNewsItems').value = 50;
  // 资讯
  document.getElementById('newsEnabled').checked = true;
  document.getElementById('newsInterval').value = 15;
  // 资讯源
  const defaults = {
    hupu_bxj: true, hupu_nba: true, hupu_football: true, hupu_esports: true,
    zhihu_hot: true, zhihu_esports: false, weibo: true,
    dongqiudi: true, zhibo8: true, sina_sports: false, qq_sports: false,
    toutiao: false, alapi_weibo: false,
  };
  Object.entries(defaults).forEach(([id, val]) => {
    const el = document.getElementById('src-' + id);
    if (el) el.checked = val;
  });
  // API
  document.getElementById('token-alapi').value = '';
  document.getElementById('token-juhe').value = '';
  // 数据
  document.getElementById('autoCleanHistory').checked = true;
  document.getElementById('historyKeepDays').value = 365;

  renderLeagueList();
  renderSelectedTags();
  showToast('已恢复默认设置');
}

// ============================================================
// 数据管理
// ============================================================
async function exportData() {
  const sync = await chrome.storage.sync.get(null);
  const local = await chrome.storage.local.get(null);
  const data = { sync, local, exportTime: new Date().toISOString(), version: '2.2.0' };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sports-live-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出 ✓');
}

async function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('导入数据将覆盖当前所有设置和数据，确定继续？')) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.sync) await chrome.storage.sync.set(data.sync);
      if (data.local) await chrome.storage.local.set(data.local);
      showToast('数据导入成功 ✓');
      loadSettings();
      loadDataStats();
    } catch (err) {
      showToast('导入失败：文件格式错误', true);
    }
  };
  input.click();
}

async function clearAllData() {
  if (!confirm('确定清空全部数据？此操作不可恢复！')) return;
  if (!confirm('再次确认：所有设置、历史记录、缓存将被清空？')) return;

  await chrome.storage.sync.clear();
  await chrome.storage.local.clear();
  showToast('数据已清空');
  setTimeout(() => location.reload(), 1000);
}

// ============================================================
// 工具函数
// ============================================================
function getSportLabel(sport) {
  const map = { football: '足球', basketball: '篮球', motorsport: '赛车', tennis: '网球', tabletennis: '乒乓球', esports: '电竞' };
  return map[sport] || sport;
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
