// ============================================================
// 赛事实时播报 - Popup 逻辑
// ============================================================

let currentFilter = 'all';
let allMatches = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 加载缓存数据
  await loadCachedData();

  // 监听实时更新
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.liveMatches) {
      allMatches = changes.liveMatches.newValue || [];
      updateTime(changes.lastUpdate?.newValue);
      renderMatches();
    }
  });

  // 刷新按钮
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    document.getElementById('scoreList').innerHTML = '<div class="loading">刷新中</div>';
    chrome.runtime.sendMessage({ type: 'refreshNow' }, (resp) => {
      if (resp?.ok) loadCachedData();
    });
  });

  // 设置按钮
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.sport;
      renderMatches();
    });
  });

  // 赛事卡片点击 → 跳转详情页
  document.getElementById('scoreList').addEventListener('click', (e) => {
    const card = e.target.closest('.match-card');
    if (card && card.dataset.url) {
      chrome.tabs.create({ url: card.dataset.url, active: false });
    }
  });
});

async function loadCachedData() {
  const { liveMatches, lastUpdate } = await chrome.storage.local.get(['liveMatches', 'lastUpdate']);
  allMatches = liveMatches || [];
  updateTime(lastUpdate);
  renderMatches();
}

function updateTime(timestamp) {
  const el = document.getElementById('updateTime');
  if (timestamp) {
    el.textContent = new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else {
    el.textContent = '--';
  }
}

function renderMatches() {
  const list = document.getElementById('scoreList');
  const count = document.getElementById('matchCount');

  let filtered = allMatches;
  if (currentFilter !== 'all') {
    if (currentFilter === 'other') {
      filtered = allMatches.filter(m => m.sport && !['football', 'basketball'].includes(m.sport));
    } else {
      filtered = allMatches.filter(m => m.sport === currentFilter);
    }
  }

  count.textContent = `${filtered.length} 场赛事`;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">${currentFilter === 'all' ? '暂无赛事数据' : '该分类暂无赛事'}</div>
        <div class="empty-hint">数据源每 30 秒自动刷新</div>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(m => {
    const isLive = m.status && (m.status.includes('1H') || m.status.includes('2H') || m.status.includes('Live') || m.status === '进行中');
    const isFinished = m.status === 'FT' || m.status === '已结束' || m.status === 'Finished';
    const statusClass = isLive ? 'live' : (isFinished ? 'ft' : 'upcoming');
    const statusLabel = isLive ? 'LIVE' : (isFinished ? '完赛' : (m.status || '未开始'));
    const cardClass = isLive ? 'live' : (isFinished ? 'finished' : '');

    return `
      <div class="match-card ${cardClass}" data-url="${m.detailUrl || '#'}">
        <div class="match-header">
          <span class="league">${m.league || '未知联赛'}</span>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="match-body">
          <span class="team home">${m.home || '--'}</span>
          <span class="score ${isLive ? 'live' : ''}">${m.score || 'vs'}</span>
          <span class="team away">${m.away || '--'}</span>
        </div>
        <div class="match-footer">
          <span>${m.time || ''}</span>
          <a class="detail-link" href="#">查看详情 →</a>
        </div>
      </div>
    `;
  }).join('');
}