// ============================================================
// 赛事实时播报 v2.0.2 - Popup 逻辑
// 6个Tab: 实时赛事 | 中文资讯 | 未来赛程 | 历史搜索 | 我的收藏 | 昨日总结
// ============================================================

let currentTab = 'live';
let currentLiveFilter = 'all';
let currentNewsFilter = 'all';
let currentFutureFilter = 'all';
let allMatches = [];
let allFeeds = [];
let allFuture = [];
let favorites = [];
let yesterdaySummary = null;
let voiceEnabled = false;

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllCachedData();
  setupTabSwitching();
  setupLiveFilters();
  setupNewsFilters();
  setupFutureFilters();
  setupHistorySearch();
  setupRefresh();
  setupSettings();
  setupVoiceToggle();
  setupSummaryTab();
  setupStorageListener();
  setupCardClicks();
  loadFavorites();
  loadVoiceState();
  loadYesterdaySummary();
});

// ============================================================
// 加载缓存数据
// ============================================================
async function loadAllCachedData() {
  const data = await chrome.storage.local.get([
    'liveMatches', 'lastUpdate',
    'contentFeeds', 'contentLastUpdate',
    'futureEvents', 'futureLastUpdate'
  ]);
  allMatches = data.liveMatches || [];
  allFeeds = data.contentFeeds || [];
  allFuture = data.futureEvents || [];

  updateTime(data.lastUpdate);
  renderLiveMatches();
  renderNewsFeeds();
  renderFutureEvents();
}

// ============================================================
// Tab 切换
// ============================================================
function setupTabSwitching() {
  document.querySelectorAll('.main-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${currentTab}`).classList.add('active');

      updateFooterInfo();
    });
  });
}

// ============================================================
// 实时赛事筛选
// ============================================================
function setupLiveFilters() {
  document.querySelectorAll('#tab-live .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLiveFilter = btn.dataset.sport;
      document.querySelectorAll('#tab-live .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLiveMatches();
    });
  });
}

function renderLiveMatches() {
  const list = document.getElementById('liveScoreList');
  let filtered = allMatches;

  if (currentLiveFilter !== 'all') {
    if (currentLiveFilter === 'other') {
      filtered = allMatches.filter(m => m.sport && !['football', 'basketball', 'esports'].includes(m.sport));
    } else {
      filtered = allMatches.filter(m => m.sport === currentLiveFilter);
    }
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无赛事数据</div><div class="empty-hint">数据每30秒自动刷新，或点击 ↻ 手动刷新</div></div>';
    updateFooterInfo();
    return;
  }

  list.innerHTML = filtered.map(m => renderMatchCard(m)).join('');
  updateFooterInfo();
}

function renderMatchCard(m) {
  const gameTag = m.game ? `<span class="game-tag">${m.game}</span>` : '';
  const isLive = m.status === '进行中' || m.status === 'Live' || (m.status && m.status.includes('H') && !m.status.includes('FT'));
  const isFinished = m.status === '已结束' || m.status === 'FT' || m.status === 'Finished';
  const isFuture = m.type === 'future' || m.status === '未开始' || m.status === 'Not Started';
  const statusClass = isLive ? 'live' : (isFinished ? 'ft' : 'upcoming');
  const statusLabel = isLive ? 'LIVE' : (isFinished ? '完赛' : (m.status || '未开始'));
  const cardClass = isLive ? 'live' : (isFinished ? 'finished' : (isFuture ? 'future' : ''));
  const isFav = favorites.includes(m.leagueId || '');

  return `
    <div class="match-card ${cardClass}" data-url="${m.detailUrl || '#'}">
      <div class="match-header">
        <span class="league">${gameTag}${m.league || '未知赛事'}</span>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="match-body">
        <span class="team home">${m.home || '--'}</span>
        <span class="score ${isLive ? 'live' : ''}">${m.score || 'vs'}</span>
        <span class="team away">${m.away || '--'}</span>
      </div>
      <div class="match-footer">
        <span>${m.time || ''} · <span class="source-tag">${m.source || ''}</span></span>
        <a class="detail-link" href="#">查看详情 →</a>
      </div>
    </div>`;
}

// ============================================================
// 中文资讯筛选
// ============================================================
function setupNewsFilters() {
  document.querySelectorAll('#tab-news .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentNewsFilter = btn.dataset.source;
      document.querySelectorAll('#tab-news .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderNewsFeeds();
    });
  });
}

function renderNewsFeeds() {
  const list = document.getElementById('newsFeedList');
  let filtered = allFeeds;
  if (currentNewsFilter !== 'all') {
    filtered = allFeeds.filter(f => f.source === currentNewsFilter);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><div class="empty-text">暂无中文资讯</div><div class="empty-hint">数据每10分钟自动刷新</div></div>';
    return;
  }

  list.innerHTML = filtered.map(f => `
    <div class="news-card" data-url="${f.url || '#'}">
      <div class="news-title">${f.title}</div>
      <div class="news-meta">
        <span class="news-source">${f.sourceIcon || ''} ${f.source}</span>
        <span>${f.hot ? '热度 ' + f.hot : formatTime(f.time)}</span>
      </div>
    </div>
  `).join('');
}

// ============================================================
// 未来赛程
// ============================================================
function setupFutureFilters() {
  document.querySelectorAll('#tab-future .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFutureFilter = btn.dataset.sport;
      document.querySelectorAll('#tab-future .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFutureEvents();
    });
  });
}

function renderFutureEvents() {
  const list = document.getElementById('futureEventList');
  let filtered = allFuture;
  if (currentFutureFilter !== 'all') {
    filtered = allFuture.filter(m => m.sport === currentFutureFilter);
  }

  // 按时间排序
  filtered.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">暂无未来赛程</div><div class="empty-hint">数据每30分钟自动刷新</div></div>';
    return;
  }

  list.innerHTML = filtered.map(m => {
    const gameTag = m.game ? `<span class="game-tag">${m.game}</span>` : '';
    return `
      <div class="match-card future" data-url="${m.detailUrl || '#'}">
        <div class="match-header">
          <span class="league">${gameTag}${m.league || '未知赛事'}</span>
          <span class="status-badge upcoming">${m.time || '待定'}</span>
        </div>
        <div class="match-body">
          <span class="team home">${m.home || '--'}</span>
          <span class="score">vs</span>
          <span class="team away">${m.away || '--'}</span>
        </div>
        <div class="match-footer">
          <span>${m.source || ''}</span>
          <a class="detail-link" href="#">赛程详情 →</a>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// 历史搜索
// ============================================================
function setupHistorySearch() {
  document.getElementById('historySearchBtn').addEventListener('click', doHistorySearch);
  document.getElementById('historySearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doHistorySearch();
  });
  document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (confirm('确定清空所有历史记录？')) {
      chrome.runtime.sendMessage({ type: 'clearHistory' }, () => {
        document.getElementById('historyResultList').innerHTML = '<div class="empty-state"><div class="empty-icon">🗑️</div><div class="empty-text">历史记录已清空</div></div>';
        document.getElementById('historyCount').textContent = '';
      });
    }
  });
}

async function doHistorySearch() {
  const query = document.getElementById('historySearchInput').value.trim();
  const days = parseInt(document.getElementById('historyRange').value);
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const list = document.getElementById('historyResultList');
  list.innerHTML = '<div class="loading">搜索中</div>';

  chrome.runtime.sendMessage(
    { type: 'searchHistory', query, startDate, endDate },
    (resp) => {
      if (!resp || !resp.results) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">未找到匹配结果</div></div>';
        return;
      }

      const { results, total } = resp;
      document.getElementById('historyCount').textContent = `共 ${total} 条记录`;

      if (results.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">未找到匹配结果</div><div class="empty-hint">尝试更换关键词或扩大时间范围</div></div>';
        return;
      }

      list.innerHTML = results.map(m => {
        const gameTag = m.game ? `<span class="game-tag">${m.game}</span>` : '';
        return `
          <div class="match-card finished" data-url="${m.detailUrl || '#'}">
            <div class="match-header">
              <span class="league">${gameTag}${m.league || '未知赛事'}</span>
              <span class="status-badge ft">${m.score}</span>
            </div>
            <div class="match-body">
              <span class="team home">${m.home || '--'}</span>
              <span class="score">${m.score}</span>
              <span class="team away">${m.away || '--'}</span>
            </div>
            <div class="match-footer">
              <span>${m.savedDate || ''} · ${m.source || ''}</span>
              <a class="detail-link" href="#">查看详情 →</a>
            </div>
          </div>
        `;
      }).join('');
    }
  );
}

// ============================================================
// 收藏
// ============================================================
async function loadFavorites() {
  chrome.runtime.sendMessage({ type: 'getFavorites' }, (resp) => {
    favorites = resp?.favorites || [];
    renderFavorites();
  });
}

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  if (favorites.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-text">暂无收藏赛事</div><div class="empty-hint">在设置页面中勾选联赛后，点击收藏即可跟踪赛程</div></div>';
    return;
  }

  list.innerHTML = favorites.map(id => {
    const league = findLeague(id);
    if (!league) return '';
    return `
      <div class="fav-card">
        <div class="fav-info">
          <div class="fav-name">${league.name}</div>
          <div class="fav-meta">${league.game ? league.game + ' · ' : ''}${league.region || ''}</div>
        </div>
        <button class="fav-btn" data-id="${id}">取消收藏</button>
      </div>
    `;
  }).join('');

  // 取消收藏按钮
  list.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'toggleFavorite', leagueId: btn.dataset.id }, (resp) => {
        favorites = resp.favorites;
        renderFavorites();
      });
    });
  });
}

// ============================================================
// 刷新 & 设置
// ============================================================
function setupRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const activeTab = document.querySelector('.tab-content.active');
    const list = activeTab?.querySelector('div:last-child');
    if (list) list.innerHTML = '<div class="loading">刷新中</div>';

    chrome.runtime.sendMessage({ type: 'refreshNow' }, () => {
      setTimeout(() => loadAllCachedData(), 1500);
    });
  });
}

function setupSettings() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// ============================================================
// Storage 监听
// ============================================================
function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.liveMatches) {
        allMatches = changes.liveMatches.newValue || [];
        if (currentTab === 'live') renderLiveMatches();
      }
      if (changes.contentFeeds) {
        allFeeds = changes.contentFeeds.newValue || [];
        if (currentTab === 'news') renderNewsFeeds();
      }
      if (changes.futureEvents) {
        allFuture = changes.futureEvents.newValue || [];
        if (currentTab === 'future') renderFutureEvents();
      }
      if (changes.lastUpdate) updateTime(changes.lastUpdate.newValue);
      if (changes.yesterdaySummary) {
        yesterdaySummary = changes.yesterdaySummary.newValue || null;
        if (currentTab === 'summary') renderYesterdaySummary();
      }
    }
  });
}

// ============================================================
// 卡片点击 → 跳转详情页
// ============================================================
function setupCardClicks() {
  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('[data-url]');
    if (card && card.dataset.url && card.dataset.url !== '#') {
      e.preventDefault();
      chrome.tabs.create({ url: card.dataset.url, active: false });
    }
  });
}

// ============================================================
// 工具函数
// ============================================================
function updateTime(timestamp) {
  const el = document.getElementById('updateTime');
  if (timestamp) {
    el.textContent = new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else {
    el.textContent = '--';
  }
}

function updateFooterInfo() {
  const el = document.getElementById('footerInfo');
  let count = 0;
  let label = '';

  switch (currentTab) {
    case 'live':
      let filtered = allMatches;
      if (currentLiveFilter !== 'all') {
        if (currentLiveFilter === 'other') {
          filtered = allMatches.filter(m => m.sport && !['football', 'basketball', 'esports'].includes(m.sport));
        } else {
          filtered = allMatches.filter(m => m.sport === currentLiveFilter);
        }
      }
      count = filtered.length;
      label = '场赛事';
      break;
    case 'news':
      let feedFiltered = allFeeds;
      if (currentNewsFilter !== 'all') feedFiltered = allFeeds.filter(f => f.source === currentNewsFilter);
      count = feedFiltered.length;
      label = '条资讯';
      break;
    case 'future':
      let futFiltered = allFuture;
      if (currentFutureFilter !== 'all') futFiltered = allFuture.filter(m => m.sport === currentFutureFilter);
      count = futFiltered.length;
      label = '场未来赛程';
      break;
    case 'history':
      el.textContent = '';
      return;
    case 'favs':
      count = favorites.length;
      label = '个收藏';
      break;
    case 'summary':
      count = yesterdaySummary ? yesterdaySummary.total : 0;
      label = '场昨日比赛';
      break;
  }
  el.textContent = `${count} ${label}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString('zh-CN');
}

// ============================================================
// 语音播报
// ============================================================
function setupVoiceToggle() {
  document.getElementById('voiceBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'toggleVoice' }, (resp) => {
      voiceEnabled = resp?.voiceAnnounce || false;
      updateVoiceIcon();
    });
  });
}

async function loadVoiceState() {
  const { settings } = await chrome.storage.sync.get('settings');
  voiceEnabled = settings?.voiceAnnounce || false;
  updateVoiceIcon();
}

function updateVoiceIcon() {
  const btn = document.getElementById('voiceBtn');
  btn.textContent = voiceEnabled ? '🔊' : '🔇';
  btn.title = voiceEnabled ? '语音播报：开' : '语音播报：关';
  btn.style.opacity = voiceEnabled ? '1' : '0.5';
}

// ============================================================
// 昨日总结
// ============================================================
function setupSummaryTab() {
  document.getElementById('refreshSummaryBtn').addEventListener('click', async () => {
    const content = document.getElementById('summaryContent');
    content.innerHTML = '<div class="loading">生成总结中</div>';
    chrome.runtime.sendMessage({ type: 'getYesterdaySummary' }, (resp) => {
      yesterdaySummary = resp?.summary || null;
      renderYesterdaySummary();
    });
  });
}

async function loadYesterdaySummary() {
  chrome.runtime.sendMessage({ type: 'getYesterdaySummary' }, (resp) => {
    yesterdaySummary = resp?.summary || null;
    if (currentTab === 'summary') renderYesterdaySummary();
  });
}

function renderYesterdaySummary() {
  const content = document.getElementById('summaryContent');
  const dateEl = document.getElementById('summaryDate');

  if (!yesterdaySummary) {
    dateEl.textContent = '';
    content.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">暂无昨日总结</div><div class="empty-hint">每日早上8点自动生成，或点击刷新总结</div></div>';
    return;
  }

  dateEl.textContent = yesterdaySummary.dateDisplay || yesterdaySummary.date;

  if (yesterdaySummary.total === 0) {
    content.innerHTML = `
      <div class="summary-card">
        <div class="summary-title">${yesterdaySummary.topText}</div>
        <div class="summary-empty">昨日没有赛事数据记录</div>
      </div>`;
    return;
  }

  let html = `<div class="summary-card">
    <div class="summary-title">${yesterdaySummary.topText}</div>`;

  if (yesterdaySummary.bySport && Object.keys(yesterdaySummary.bySport).length > 0) {
    html += '<div class="summary-stats">';
    const sportNames = { football: '足球', basketball: '篮球', esports: '电竞' };
    Object.entries(yesterdaySummary.bySport).forEach(([sport, data]) => {
      const name = sportNames[sport] || sport;
      html += `<div class="summary-stat-item"><span class="stat-num">${data.count}</span><span class="stat-label">${name}</span></div>`;
    });
    html += '</div>';
  }

  if (yesterdaySummary.highlights && yesterdaySummary.highlights.length > 0) {
    html += '<div class="summary-highlights"><h3>🔥 高光比赛</h3>';
    yesterdaySummary.highlights.forEach(h => {
      html += `<div class="highlight-item">
        <span class="highlight-match">${h.match}</span>
        <span class="highlight-league">${h.league}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (yesterdaySummary.byLeague && Object.keys(yesterdaySummary.byLeague).length > 0) {
    html += '<div class="summary-leagues"><h3>📋 联赛统计</h3>';
    const sorted = Object.entries(yesterdaySummary.byLeague)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
    sorted.forEach(([league, data]) => {
      html += `<div class="league-stat-row">
        <span class="league-name">${league}</span>
        <span class="league-count">${data.count}场</span>
      </div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  content.innerHTML = html;
}