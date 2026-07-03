// ============================================================
// 赛事实时播报 - 设置页面逻辑
// ============================================================

const ALL_LEAGUES = [
  { id: 'premier-league',  name: '英超',        sport: 'football',   icon: '🏴' },
  { id: 'la-liga',         name: '西甲',        sport: 'football',   icon: '🇪🇸' },
  { id: 'serie-a',         name: '意甲',        sport: 'football',   icon: '🇮🇹' },
  { id: 'bundesliga',      name: '德甲',        sport: 'football',   icon: '🇩🇪' },
  { id: 'ligue-1',         name: '法甲',        sport: 'football',   icon: '🇫🇷' },
  { id: 'csl',             name: '中超',        sport: 'football',   icon: '🇨🇳' },
  { id: 'j-league',        name: 'J联赛',       sport: 'football',   icon: '🇯🇵' },
  { id: 'k-league',        name: 'K联赛',       sport: 'football',   icon: '🇰🇷' },
  { id: 'ucl',             name: '欧冠',        sport: 'football',   icon: '⭐' },
  { id: 'afc-cl',          name: '亚冠',        sport: 'football',   icon: '🏆' },
  { id: 'eredivisie',      name: '荷甲',        sport: 'football',   icon: '🇳🇱' },
  { id: 'primeira',        name: '葡超',        sport: 'football',   icon: '🇵🇹' },
  { id: 'nba',             name: 'NBA',         sport: 'basketball', icon: '🇺🇸' },
  { id: 'cba',             name: 'CBA',         sport: 'basketball', icon: '🇨🇳' },
  { id: 'euroleague',      name: '欧洲篮球联赛', sport: 'basketball', icon: '🇪🇺' },
  { id: 'nfl',             name: 'NFL',         sport: 'other',      icon: '🏈' },
  { id: 'mlb',             name: 'MLB',         sport: 'other',      icon: '⚾' },
  { id: 'nhl',             name: 'NHL',         sport: 'other',      icon: '🏒' },
  { id: 'f1',              name: 'F1',          sport: 'other',      icon: '🏎' },
  { id: 'tennis',          name: '网球',        sport: 'other',      icon: '🎾' },
];

const DEFAULT_SETTINGS = {
  refreshInterval: 30,
  notifyGoals: true,
  notifyFinal: true,
  notifyStart: false,
  selectedLeagues: [],
};

let currentSport = 'all';
let selectedLeagues = new Set();

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  // 搜索
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderLeagueList(e.target.value);
  });

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
      if (e.target.checked) {
        selectedLeagues.add(e.target.value);
      } else {
        selectedLeagues.delete(e.target.value);
      }
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
  document.getElementById('resetBtn').addEventListener('click', () => {
    selectedLeagues = new Set(DEFAULT_SETTINGS.selectedLeagues);
    document.getElementById('refreshInterval').value = DEFAULT_SETTINGS.refreshInterval;
    document.getElementById('notifyGoals').checked = DEFAULT_SETTINGS.notifyGoals;
    document.getElementById('notifyFinal').checked = DEFAULT_SETTINGS.notifyFinal;
    document.getElementById('notifyStart').checked = DEFAULT_SETTINGS.notifyStart;
    renderLeagueList();
    renderSelectedTags();
    showToast('已恢复默认设置');
  });
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

  renderLeagueList();
  renderSelectedTags();
}

// ============================================================
// 渲染联赛列表
// ============================================================
function renderLeagueList(searchQuery = '') {
  const list = document.getElementById('leagueList');
  let filtered = ALL_LEAGUES;

  if (currentSport !== 'all') {
    filtered = filtered.filter(l => l.sport === currentSport);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">未找到匹配的联赛</div>';
    return;
  }

  list.innerHTML = filtered.map(l => `
    <label class="league-item">
      <input type="checkbox" value="${l.id}"
        ${selectedLeagues.has(l.id) ? 'checked' : ''}>
      <span class="league-icon">${l.icon}</span>
      <span class="league-name">${l.name}</span>
      <span class="league-sport">${getSportLabel(l.sport)}</span>
    </label>
  `).join('');
}

// ============================================================
// 渲染已选标签
// ============================================================
function renderSelectedTags() {
  const container = document.getElementById('selectedTags');
  if (selectedLeagues.size === 0) {
    container.innerHTML = '<span style="font-size:12px;color:var(--muted)">未选择联赛（将显示全部）</span>';
    return;
  }
  const tags = [...selectedLeagues].map(id => {
    const league = ALL_LEAGUES.find(l => l.id === id);
    return league ? `
      <span class="tag-item">
        ${league.icon} ${league.name}
        <button class="tag-remove" data-id="${id}">×</button>
      </span>
    ` : '';
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
  };

  await chrome.storage.sync.set({ settings });
  chrome.runtime.sendMessage({ type: 'settingsUpdated' });
  showToast('设置已保存 ✓');
}

// ============================================================
// 工具函数
// ============================================================
function getSportLabel(sport) {
  const map = { football: '足球', basketball: '篮球', other: '其他' };
  return map[sport] || sport;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}