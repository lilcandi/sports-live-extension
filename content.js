// ============================================================
// 赛事实时播报 v2.0 - Content Script（网页浮层播报）
// 在浏览任意网页时右下角弹出比分更新和中文资讯
// ============================================================

let toastContainer = null;

// 监听 storage 变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.liveMatches) {
    const oldMatches = changes.liveMatches.oldValue || [];
    const newMatches = changes.liveMatches.newValue || [];

    const newChanges = newMatches.filter(m => {
      const old = oldMatches.find(o => o.id === m.id);
      return !old || old.score !== m.score || old.status !== m.status;
    }).filter(m => m.score !== 'vs');

    if (newChanges.length <= 3) {
      for (const match of newChanges) {
        showScoreToast(match);
      }
    }
  }

  // 中文资讯浮层
  if (area === 'local' && changes.contentFeeds) {
    const newFeeds = changes.contentFeeds.newValue || [];
    const oldFeeds = changes.contentFeeds.oldValue || [];
    const hotFeeds = newFeeds.filter(f => {
      return !oldFeeds.some(o => o.id === f.id);
    }).slice(0, 3);

    for (const feed of hotFeeds) {
      showNewsToast(feed);
    }
  }
});

function showScoreToast(match) {
  ensureContainer();

  const gameLabel = match.game ? `[${match.game}] ` : '';
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #161b22;
    color: #e6edf3;
    border: 1px solid #30363d;
    border-left: 3px solid #3fb950;
    border-radius: 8px;
    padding: 10px 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 13px;
    min-width: 220px;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    animation: sLiveSlideIn 0.3s ease-out;
    pointer-events: auto;
    cursor: pointer;
  `;
  toast.innerHTML = `
    <div style="font-size:11px;color:#8b949e;margin-bottom:4px">${gameLabel}${match.league || ''} · ${match.source || ''}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:600;font-size:13px">${match.home || '--'}</span>
      <span style="font-size:18px;font-weight:800;color:#3fb950;margin:0 8px">${match.score}</span>
      <span style="font-weight:600;font-size:13px">${match.away || '--'}</span>
    </div>
  `;

  toast.addEventListener('click', () => {
    if (match.detailUrl) window.open(match.detailUrl, '_blank');
  });

  toastContainer.appendChild(toast);
  autoRemove(toast, 5000);
}

function showNewsToast(feed) {
  ensureContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #161b22;
    color: #e6edf3;
    border: 1px solid #30363d;
    border-left: 3px solid #58a6ff;
    border-radius: 8px;
    padding: 10px 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 13px;
    min-width: 220px;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    animation: sLiveSlideIn 0.3s ease-out;
    pointer-events: auto;
    cursor: pointer;
  `;
  toast.innerHTML = `
    <div style="font-size:11px;color:#8b949e;margin-bottom:4px">${feed.sourceIcon || ''} ${feed.source}</div>
    <div style="font-weight:600;font-size:13px;line-height:1.4">${feed.title}</div>
  `;

  toast.addEventListener('click', () => {
    if (feed.url) window.open(feed.url, '_blank');
  });

  toastContainer.appendChild(toast);
  autoRemove(toast, 6000);
}

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
}

function autoRemove(el, delay) {
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'all 0.3s ease-in';
    setTimeout(() => el.remove(), 300);
  }, delay);
}

// 注入动画
const style = document.createElement('style');
style.textContent = `
  @keyframes sLiveSlideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);