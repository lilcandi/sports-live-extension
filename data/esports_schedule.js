// ============================================================
// 电竞大赛日程 - 人工维护
// 电竞数据源(Liquipedia/HLTV/vlr.gg)均被Cloudflare封禁，
// 此文件为手动维护的赛程，定期更新
// 最后更新: 2026-07-03
// ============================================================

const ESPORTS_SCHEDULE = [
  // === 英雄联盟 ===
  { id: 'lpl-summer-2026', league: 'LPL夏季赛', game: '英雄联盟', status: '进行中', startDate: '2026-06-01', endDate: '2026-08-15', info: '常规赛阶段，每周三至周日', detailUrl: 'https://lpl.qq.com/' },
  { id: 'msi-2026', league: 'MSI季中冠军赛', game: '英雄联盟', status: '已结束', startDate: '2026-05-01', endDate: '2026-05-18', info: '冠军：待定', detailUrl: 'https://lolesports.com/' },
  { id: 'worlds-2026', league: 'S赛/全球总决赛', game: '英雄联盟', status: '即将开始', startDate: '2026-09-25', endDate: '2026-11-07', info: '入围赛9月25日开始，决赛11月7日', detailUrl: 'https://lolesports.com/' },

  // === 无畏契约 ===
  { id: 'val-champions-2026', league: '瓦罗兰特全球冠军赛', game: '无畏契约', status: '即将开始', startDate: '2026-08-01', endDate: '2026-08-24', info: '16支队伍争夺世界冠军', detailUrl: 'https://valorantesports.com/' },

  // === CS2 ===
  { id: 'cs2-major-winter', league: 'CS2 Major冬季赛', game: 'CS2', status: '即将开始', startDate: '2026-11-24', endDate: '2026-12-07', info: '24支队伍参赛', detailUrl: 'https://www.hltv.org/' },
  { id: 'iem-cologne-2026', league: 'IEM科隆', game: 'CS2', status: '即将开始', startDate: '2026-08-10', endDate: '2026-08-17', info: '顶级S级赛事', detailUrl: 'https://www.hltv.org/' },
];

// 获取当前活跃的电竞赛事
function getActiveEsportsEvents() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return ESPORTS_SCHEDULE.filter(evt => {
    // 进行中：今天在开始和结束之间
    if (today >= evt.startDate && today <= evt.endDate) return true;
    // 即将开始：未来30天内
    const startDate = new Date(evt.startDate);
    const diff = (startDate - now) / 86400000;
    if (diff > 0 && diff <= 30) return true;
    return false;
  });
}

// 获取未来电竞赛事
function getUpcomingEsportsEvents() {
  const now = new Date();
  return ESPORTS_SCHEDULE
    .filter(evt => new Date(evt.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

// 获取电竞历史赛事
function getPastEsportsEvents() {
  const now = new Date();
  return ESPORTS_SCHEDULE
    .filter(evt => new Date(evt.endDate) < now)
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
}