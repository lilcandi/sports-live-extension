// ============================================================
// 赛事实时播报 v2.0 - 设置页面逻辑
// ============================================================

const DEFAULT_SETTINGS = {
  refreshInterval: 30,
  notifyGoals: true,
  notifyFinal: true,
  notifyStart: false,
  selectedLeagues: [],
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
});

// ============================================================
// 加载设置
// ============================================================
async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = settings || DEFAULT_SETTINGS;

  selectedLeagues = new Set(s.selectedLeagues || []);
  document.getElementById('refreshInterval').value = s.refreshInterval || 30;
  document.getElementById('notifyGoals').checked = s.notifyGoals !== false;
  document.getElementById('notifyFinal').checked = s.notifyFinal !== false;
  document.getElementById('notifyStart').checked = s.notifyStart === true;

  // 内容源
  const src = s.sourceSettings || DEFAULT_SOURCE_SETTINGS;
  document.getElementById('src-weibo').checked = src.weibo?.enabled !== false;
  document.getElementById('src-zhihu').checked = src.zhihu?.enabled !== false;
  document.getElementById('src-hupu').checked = src.hupu?.enabled !== false;
  document.getElementById('src-hupu_esports').checked = src.hupu_esports?.enabled !== false;
  document.getElementById('src-zhihu_esports').checked = src.zhihu_esports?.enabled === true;
  document.getElementById('src-toutiao').checked = src.toutiao?.enabled === true;

  // API Tokens
  const tokens = s.apiTokens || DEFAULT_TOKENS;
  document.getElementById('token-alapi').value = tokens.alapi || '';
  document.getElementById('token-juhe').value = tokens.juhe || '';

  renderLeagueList();
  renderSelectedTags();
}

// ============================================================
// 渲染联赛列表
// ============================================================
function renderLeagueList(searchQuery = '') {
  const list = document.getElementById('leagueList');
  let filtered = getAllLeagues();

  if (currentSport !== 'all') {
    if (currentSport === 'esports') {
      filtered = LEAGUES.esports;
    } else if (currentSport === 'other') {
      filtered = LEAGUES.other_sports;
    } else {
      filtered = LEAGUES[currentSport] || [];
    }
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
  const sportLabel = l.game ? getSportLabel('esports') : getSportLabel(l.source === '500.com' ? 'football' : l.source === 'thesportsdb' ? 'football' : 'other');
  return `
    <label class="league-item">
      <input type="checkbox" value="${l.id}" ${selectedLeagues.has(l.id) ? 'checked' : ''}>
      <span class="league-icon">${l.game ? '🎮' : '⚽'}</span>
      <span class="league-name">${l.name}</span>
      ${gameTag}
      <span class="league-sport">${sportLabel}</span>
    </label>
  `;
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
    refreshInterval: Number(document.getElementById('refreshInterval').value),
    notifyGoals: document.getElementById('notifyGoals').checked,
    notifyFinal: document.getElementById('notifyFinal').checked,
    notifyStart: document.getElementById('notifyStart').checked,
    selectedLeagues: [...selectedLeagues],
    sourceSettings: {
      weibo:         { enabled: document.getElementById('src-weibo').checked, interval: 10 },
      zhihu:         { enabled: document.getElementById('src-zhihu').checked, interval: 15 },
      zhihu_esports: { enabled: document.getElementById('src-zhihu_esports').checked, interval: 30 },
      hupu:          { enabled: document.getElementById('src-hupu').checked, interval: 15 },
      hupu_esports:  { enabled: document.getElementById('src-hupu_esports').checked, interval: 15 },
      toutiao:       { enabled: document.getElementById('src-toutiao').checked, interval: 10 },
    },
    apiTokens: {
      alapi: document.getElementById('token-alapi').value.trim(),
      juhe:  document.getElementById('token-juhe').value.trim(),
    },
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
  selectedLeagues = new Set(DEFAULT_SETTINGS.selectedLeagues);
  document.getElementById('refreshInterval').value = DEFAULT_SETTINGS.refreshInterval;
  document.getElementById('notifyGoals').checked = DEFAULT_SETTINGS.notifyGoals;
  document.getElementById('notifyFinal').checked = DEFAULT_SETTINGS.notifyFinal;
  document.getElementById('notifyStart').checked = DEFAULT_SETTINGS.notifyStart;

  document.getElementById('src-weibo').checked = true;
  document.getElementById('src-zhihu').checked = true;
  document.getElementById('src-hupu').checked = true;
  document.getElementById('src-hupu_esports').checked = true;
  document.getElementById('src-zhihu_esports').checked = false;
  document.getElementById('src-toutiao').checked = false;

  document.getElementById('token-alapi').value = '';
  document.getElementById('token-juhe').value = '';

  renderLeagueList();
  renderSelectedTags();
  showToast('已恢复默认设置');
}

// ============================================================
// 工具函数
// ============================================================
function getSportLabel(sport) {
  const map = { football: '足球', basketball: '篮球', esports: '电竞', other: '其他' };
  return map[sport] || sport;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}