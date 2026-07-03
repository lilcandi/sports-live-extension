// ============================================================
// 赛事实时播报 - Content Script（网页浮层播报，可选）
// 在当前浏览的网页右下角显示比分更新浮层
// ============================================================

let toastContainer = null;

// 监听 storage 变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.liveMatches) {
    const oldMatches = changes.liveMatches.oldValue || [];
    const newMatches = changes.liveMatches.newValue || [];

    // 检测新增的比分变化
    const newChanges = newMatches.filter(m => {
      const old = oldMatches.find(o => o.id === m.id);
      return !old || old.score !== m.score || old.status !== m.status;
    }).filter(m => m.score !== 'vs');

    for (const match of newChanges) {
      showToast(match);
    }
  }
});

function showToast(match) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'sports-live-toast-container';
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

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #161b22;
    color: #e6edf3;
    border: 1px solid #30363d;
    border-left: 3px solid #3fb950;
    border-radius: 8px;
    padding: 10px 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    min-width: 220px;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
    cursor: pointer;
  `;
  toast.innerHTML = `
    <div style="font-size:11px;color:#8b949e;margin-bottom:4px">${match.league || ''}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:600">${match.home || '--'}</span>
      <span style="font-size:18px;font-weight:800;color:#3fb950;margin:0 8px">${match.score}</span>
      <span style="font-weight:600">${match.away || '--'}</span>
    </div>
  `;

  toast.addEventListener('click', () => {
    if (match.detailUrl) {
      window.open(match.detailUrl, '_blank');
    }
  });

  toastContainer.appendChild(toast);

  // 5 秒后自动消失
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// 注入动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);