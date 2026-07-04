// ============================================================
// 赛事实时播报 v2.1.0 - 扩展版
// 60+赛事 · 热度排名 · 赛果结论读取
// ============================================================

let currentTab = 'hot';
let currentLiveFilter = 'all';
let currentHotFilter = 'all';
let currentNewsFilter = 'all';
let currentFutureFilter = 'all';
let allMatches = [];
let allFeeds = [];
let allFuture = [];
let hotRanking = null;
let favorites = [];
let yesterdaySummary = null;
let voiceEnabled = false;
let allLeagues = [];

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupStorageListener();
  setupTabSwitching();
  setupHotFilters();
  setupLiveFilters();
  setupNewsFilters();
  setupFutureFilters();
  setupHistorySearch();
  setupRefresh();
  setupSettings();
  setupVoiceToggle();
  setupSummaryTab();
  setupCardClicks();

  loadLeagues();
  await loadAllCachedData();
  loadFavorites();
  loadVoiceState();
  loadYesterdaySummary();
  loadHotRanking();
});

// ============================================================
// 加载缓存数据
// ============================================================
async function loadAllCachedData() {
  const data = await chrome.storage.local.get([
    'liveMatches', 'lastUpdate',
    'contentFeeds', 'contentLastUpdate',
    'futureEvents', 'futureLastUpdate',
    'hotRanking',
  ]);
  allMatches = data.liveMatches || [];
  allFeeds = data.contentFeeds || [];
  allFuture = data.futureEvents || [];
  hotRanking = data.hotRanking || null;

  updateTime(data.lastUpdate);

  if (allMatches.length === 0 && allFeeds.length === 0 && allFuture.length === 0) {
    showLoading('hot');
    showLoading('live');
    showLoading('news');
    showLoading('future');
    chrome.runtime.sendMessage({ type: 'refreshNow' });
    pollForData(0);
  } else {
    renderHotRanking();
    renderLiveMatches();
    renderNewsFeeds();
    renderFutureEvents();
  }
}

function pollForData(attempt) {
  if (attempt >= 8) {
    ['hotRankingList', 'liveScoreList', 'newsFeedList', 'futureEventList'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.querySelector('.loading')) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">数据加载超时</div><div class="empty-hint">请检查网络连接后 <button class="retry-btn" id="retryBtn">点击重试</button></div></div>';
      }
    });
    setTimeout(() => {
      const btn = document.getElementById('retryBtn');
      if (btn) btn.addEventListener('click', () => {
        showLoading('hot'); showLoading('live'); showLoading('news'); showLoading('future');
        chrome.runtime.sendMessage({ type: 'refreshNow' });
        pollForData(0);
      });
    }, 100);
    return;
  }

  setTimeout(async () => {
    if (allMatches.length > 0 || allFeeds.length > 0 || allFuture.length > 0) return;

    const data = await chrome.storage.local.get(['liveMatches', 'contentFeeds', 'futureEvents', 'lastUpdate', 'hotRanking']);
    allMatches = data.liveMatches || [];
    allFeeds = data.contentFeeds || [];
    allFuture = data.futureEvents || [];
    hotRanking = data.hotRanking || null;
    updateTime(data.lastUpdate);

    if (allMatches.length > 0 || allFeeds.length > 0 || allFuture.length > 0) {
      renderHotRanking();
      renderLiveMatches();
      renderNewsFeeds();
      renderFutureEvents();
    } else {
      pollForData(attempt + 1);
    }
  }, 2000);
}

function showLoading(tab) {
  const map = { hot: 'hotRankingList', live: 'liveScoreList', news: 'newsFeedList', future: 'futureEventList' };
  const el = document.getElementById(map[tab]);
  if (el) el.innerHTML = '<div class="loading">正在获取赛事数据</div>';
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
// 热度排名
// ============================================================
function setupHotFilters() {
  document.querySelectorAll('#tab-hot .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentHotFilter = btn.dataset.hot;
      document.querySelectorAll('#tab-hot .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHotRanking();
    });
  });
}

function loadHotRanking() {
  chrome.runtime.sendMessage({ type: 'getHotRanking' }, (resp) => {
    if (resp?.top20) {
      hotRanking = resp;
      if (currentTab === 'hot') renderHotRanking();
    }
  });
}

function renderHotRanking() {
  const list = document.getElementById('hotRankingList');
  let items = [];

  if (hotRanking?.top20) {
    if (currentHotFilter === 'all') {
      items = hotRanking.top20;
    } else {
      items = (hotRanking.bySport?.[currentHotFilter]) || [];
    }
  }

  // 如果没有缓存的排名数据，从 allMatches 生成
  if (items.length === 0 && allMatches.length > 0) {
    let filtered = allMatches;
    if (currentHotFilter !== 'all') {
      filtered = allMatches.filter(m => m.sport === currentHotFilter);
    }
    items = [...filtered].sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0)).slice(0, 20);
  }

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔥</div><div class="empty-text">暂无热度数据</div><div class="empty-hint">数据每5分钟更新，赛事进行时热度更高</div></div>';
    updateFooterInfo();
    return;
  }

  list.innerHTML = items.map((m, idx) => renderHotCard(m, idx + 1)).join('');
  updateFooterInfo();
}

function renderHotCard(m, rank) {
  const gameTag = m.game ? `<span class="game-tag">${m.game}</span>` : '';
  const isLive = m.status === '进行中' || m.status === 'Live' || (m.status && m.status.includes('H') && !m.status.includes('FT'));
  const isFinished = m.status === '已结束' || m.status === 'FT' || m.status === 'Finished';
  const isFuture = m.type === 'future' || m.status === '未开始' || m.status === 'Not Started' || m.status === '即将开始';
  const statusClass = isLive ? 'live' : (isFinished ? 'ft' : 'upcoming');
  const statusLabel = isLive ? 'LIVE' : (isFinished ? '完赛' : (m.status || '未开始'));
  const cardClass = isLive ? 'live' : (isFinished ? 'finished' : (isFuture ? 'future' : ''));

  // 热度条颜色
  const hot = m.hotScore || 0;
  let hotColor = '#3fb950';
  if (hot >= 90) hotColor = '#f85149';
  else if (hot >= 75) hotColor = '#d29922';
  else if (hot >= 60) hotColor = '#58a6ff';

  // 排名徽章
  let rankBadge = '';
  if (rank <= 3) {
    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    rankBadge = `<span class="rank-badge top${rank}">${medalEmoji}</span>`;
  } else {
    rankBadge = `<span class="rank-badge">${rank}</span>`;
  }

  return `
    <div class="match-card hot-card ${cardClass}" data-url="${m.detailUrl || '#'}">
      ${rankBadge}
      <div class="hot-score-bar" style="background: ${hotColor}22;">
        <div class="hot-score-fill" style="width: ${hot}%; background: ${hotColor};"></div>
      </div>
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
        <span class="hot-score-text" style="color:${hotColor}">🔥 ${hot}</span>
      </div>
    </div>`;
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
    filtered = allMatches.filter(m => m.sport === currentLiveFilter);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无赛事数据</div><div class="empty-hint">数据每2分钟自动刷新，或点击 ↻ 手动刷新</div></div>';
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
  const isFuture = m.type === 'future' || m.status === '未开始' || m.status === 'Not Started' || m.status === '即将开始';
  const statusClass = isLive ? 'live' : (isFinished ? 'ft' : 'upcoming');
  const statusLabel = isLive ? 'LIVE' : (isFinished ? '完赛' : (m.status || '未开始'));
  const cardClass = isLive ? 'live' : (isFinished ? 'finished' : (isFuture ? 'future' : ''));
  const isFav = favorites.includes(m.leagueId || '');

  // 热度显示
  const hot = m.hotScore || 0;
  let hotBadge = '';
  if (hot >= 85) {
    hotBadge = `<span class="hot-badge hot-high">🔥</span>`;
  } else if (hot >= 70) {
    hotBadge = `<span class="hot-badge hot-mid">🔥</span>`;
  }

  return `
    <div class="match-card ${cardClass}" data-url="${m.detailUrl || '#'}">
      <div class="match-header">
        <span class="league">${gameTag}${m.league || '未知赛事'} ${hotBadge}</span>
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

  // 如果没有资讯数据，用赛事结果作为后备
  if (filtered.length === 0 && allMatches.length > 0) {
    const finished = allMatches.filter(m => m.score !== 'vs' && m.status === '已结束');
    if (finished.length > 0) {
      filtered = finished.slice(0, 20).map(m => ({
        id: `news-${m.id}`, title: `${m.league}：${m.home} ${m.score} ${m.away}`,
        url: m.detailUrl || '#', source: m.source, sourceIcon: getSportIcon(m.sport),
        time: m.time, type: 'news', hotScore: m.hotScore || 0,
      }));
    }
  }

  if (currentNewsFilter !== 'all') {
    filtered = filtered.filter(f => f.source === currentNewsFilter);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><div class="empty-text">暂无赛事资讯</div><div class="empty-hint">赛事结束后会自动记录赛果</div></div>';
    return;
  }

  list.innerHTML = filtered.map(f => `
    <div class="news-card" data-url="${f.url || '#'}">
      <div class="news-title">${f.title}</div>
      <div class="news-meta">
        <span class="news-source">${f.sourceIcon || ''} ${f.source}</span>
        <span>${f.hotScore ? '🔥 ' + f.hotScore : formatTime(f.time)}</span>
      </div>
    </div>
  `).join('');
}

function getSportIcon(sport) {
  const map = { football: '⚽', basketball: '🏀', motorsport: '🏎️', tennis: '🎾', tabletennis: '🏓', esports: '🎮' };
  return map[sport] || '📰';
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

  // 如果没有未来赛程数据，从 allMatches 中提取即将开始的赛事
  if (filtered.length === 0 && allMatches.length > 0) {
    filtered = allMatches.filter(m =>
      m.status === '即将开始' || m.status === '未开始' || m.type === 'future'
    );
  }

  if (currentFutureFilter !== 'all') {
    filtered = filtered.filter(m => m.sport === currentFutureFilter);
  }

  // 按热度排序
  filtered.sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0));

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">暂无未来赛程</div><div class="empty-hint">电竞大赛日程已内置，数据每分钟自动刷新</div></div>';
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

function loadLeagues() {
  chrome.runtime.sendMessage({ type: 'getLeagues' }, (resp) => {
    if (resp?.leagues) {
      allLeagues = [];
      Object.values(resp.leagues).forEach(arr => {
        if (Array.isArray(arr)) allLeagues.push(...arr);
      });
    }
  });
}

function findLeagueById(id) {
  return allLeagues.find(l => l.id === id) || null;
}

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  if (favorites.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-text">暂无收藏赛事</div><div class="empty-hint">在设置页面中勾选联赛后，点击收藏即可跟踪赛程</div></div>';
    return;
  }

  list.innerHTML = favorites.map(id => {
    const league = findLeagueById(id);
    if (!league) return '';
    const tierBadge = league.tier ? `<span class="tier-badge tier-${league.tier}">${league.tier}</span>` : '';
    return `
      <div class="fav-card">
        <div class="fav-info">
          <div class="fav-name">${league.name} ${tierBadge}</div>
          <div class="fav-meta">${league.game ? league.game + ' · ' : ''}热度 ${league.popularity || 50}</div>
        </div>
        <button class="fav-btn" data-id="${id}">取消收藏</button>
      </div>
    `;
  }).join('');

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
    const tabs = ['hotRankingList', 'liveScoreList', 'newsFeedList', 'futureEventList'];
    tabs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="loading">刷新中</div>';
    });

    chrome.runtime.sendMessage({ type: 'refreshNow' }, (resp) => {
      if (!resp || !resp.ok) {
        setTimeout(async () => {
          const data = await chrome.storage.local.get(['liveMatches', 'contentFeeds', 'futureEvents', 'lastUpdate', 'hotRanking']);
          allMatches = data.liveMatches || [];
          allFeeds = data.contentFeeds || [];
          allFuture = data.futureEvents || [];
          hotRanking = data.hotRanking || null;
          updateTime(data.lastUpdate);
          renderHotRanking();
          renderLiveMatches();
          renderNewsFeeds();
          renderFutureEvents();
        }, 2000);
      }
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
        if (currentTab === 'hot') renderHotRanking();
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
      if (changes.hotRanking) {
        hotRanking = changes.hotRanking.newValue || null;
        if (currentTab === 'hot') renderHotRanking();
      }
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
    case 'hot':
      let hotFiltered = hotRanking?.top20 || allMatches;
      if (currentHotFilter !== 'all' && hotRanking?.bySport) {
        hotFiltered = hotRanking.bySport[currentHotFilter] || [];
      } else if (currentHotFilter !== 'all') {
        hotFiltered = allMatches.filter(m => m.sport === currentHotFilter);
      }
      count = Array.isArray(hotFiltered) ? hotFiltered.length : 0;
      label = '场热门赛事';
      break;
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
    const sportNames = { football: '足球', basketball: '篮球', esports: '电竞', motorsport: '赛车', tennis: '网球', tabletennis: '乒乓球' };
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
