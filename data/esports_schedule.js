// ============================================================
// 电竞大赛日程 - 扩展版
// 电竞数据源(Liquipedia/HLTV/vlr.gg)均被Cloudflare封禁，
// 此文件为手动维护的赛程，定期更新
// 最后更新: 2026-07-04
// ============================================================

const ESPORTS_SCHEDULE = [
  // === 英雄联盟 ===
  { id: 'lpl-summer-2026', league: 'LPL夏季赛', game: '英雄联盟', status: '进行中', startDate: '2026-06-01', endDate: '2026-08-15', info: '常规赛阶段，每周三至周日', detailUrl: 'https://lpl.qq.com/' },
  { id: 'lck-summer-2026', league: 'LCK夏季赛', game: '英雄联盟', status: '进行中', startDate: '2026-06-12', endDate: '2026-08-18', info: '韩国LCK联赛夏季赛', detailUrl: 'https://lolesports.com/' },
  { id: 'lec-summer-2026', league: 'LEC夏季赛', game: '英雄联盟', status: '进行中', startDate: '2026-06-15', endDate: '2026-08-20', info: '欧洲LEC联赛夏季赛', detailUrl: 'https://lolesports.com/' },
  { id: 'msi-2026', league: 'MSI季中冠军赛', game: '英雄联盟', status: '已结束', startDate: '2026-05-01', endDate: '2026-05-18', info: '2026季中冠军赛已结束', detailUrl: 'https://lolesports.com/' },
  { id: 'worlds-2026', league: 'S赛/全球总决赛', game: '英雄联盟', status: '即将开始', startDate: '2026-09-25', endDate: '2026-11-07', info: '入围赛9月25日开始，决赛11月7日', detailUrl: 'https://lolesports.com/' },

  // === DOTA2 ===
  { id: 'dota2-ti15', league: 'DOTA2 TI15国际邀请赛', game: 'DOTA2', status: '即将开始', startDate: '2026-09-01', endDate: '2026-09-15', info: '第15届DOTA2国际邀请赛', detailUrl: 'https://www.dota2.com/international' },
  { id: 'dota2-major-summer', league: 'DOTA2夏季Major', game: 'DOTA2', status: '即将开始', startDate: '2026-07-15', endDate: '2026-07-28', info: 'DPC夏季Major赛事', detailUrl: 'https://www.dota2.com/esports/dpc' },
  { id: 'dota2-dpc-cn', league: 'DPC中国联赛', game: 'DOTA2', status: '进行中', startDate: '2026-06-01', endDate: '2026-07-10', info: 'DPC中国联赛第三赛季', detailUrl: 'https://www.dota2.com/esports/dpc' },

  // === CS2 ===
  { id: 'cs2-major-winter', league: 'CS2 Major冬季赛', game: 'CS2', status: '即将开始', startDate: '2026-11-24', endDate: '2026-12-07', info: '24支队伍参赛', detailUrl: 'https://www.hltv.org/' },
  { id: 'iem-cologne-2026', league: 'IEM科隆', game: 'CS2', status: '即将开始', startDate: '2026-08-10', endDate: '2026-08-17', info: '顶级S级赛事', detailUrl: 'https://www.hltv.org/' },
  { id: 'blast-premier-fall', league: 'BLAST Premier秋季赛', game: 'CS2', status: '即将开始', startDate: '2026-09-10', endDate: '2026-09-20', info: 'BLAST Premier秋季小组赛', detailUrl: 'https://blast.tv/' },
  { id: 'blast-premier-spring', league: 'BLAST Premier春季决赛', game: 'CS2', status: '已结束', startDate: '2026-01-10', endDate: '2026-01-20', info: '春季决赛已结束', detailUrl: 'https://blast.tv/' },

  // === 无畏契约 ===
  { id: 'val-champions-2026', league: '瓦罗兰特全球冠军赛', game: '无畏契约', status: '即将开始', startDate: '2026-08-01', endDate: '2026-08-24', info: '16支队伍争夺世界冠军', detailUrl: 'https://valorantesports.com/' },
  { id: 'val-masters-shanghai', league: 'VCT上海大师赛', game: '无畏契约', status: '已结束', startDate: '2026-05-15', endDate: '2026-05-26', info: '上海大师赛已结束', detailUrl: 'https://valorantesports.com/' },
  { id: 'val-cn-summer', league: 'VCT CN联赛', game: '无畏契约', status: '进行中', startDate: '2026-06-01', endDate: '2026-07-20', info: 'VCT CN联赛夏季赛', detailUrl: 'https://valorantesports.com/' },

  // === 王者荣耀 ===
  { id: 'kpl-summer-2026', league: 'KPL夏季赛', game: '王者荣耀', status: '进行中', startDate: '2026-06-01', endDate: '2026-08-30', info: 'KPL夏季赛常规赛', detailUrl: 'https://www.kpl.qq.com/' },
  { id: 'awc-2026', league: '王者荣耀世界冠军杯', game: '王者荣耀', status: '即将开始', startDate: '2026-11-10', endDate: '2026-12-15', info: '王者荣耀最高级别赛事', detailUrl: 'https://www.kpl.qq.com/' },
  { id: 'kpl-champions-cup', league: '王者荣耀冠军杯', game: '王者荣耀', status: '已结束', startDate: '2026-01-15', endDate: '2026-02-10', info: '2026冠军杯已结束', detailUrl: 'https://www.kpl.qq.com/' },

  // === 和平精英 ===
  { id: 'pel-summer-2026', league: 'PEL夏季赛', game: '和平精英', status: '进行中', startDate: '2026-06-01', endDate: '2026-08-10', info: 'PEL夏季赛常规赛', detailUrl: 'https://pel.qq.com/' },
  { id: 'pmgc-2026', league: 'PMGC全球总决赛', game: '和平精英', status: '即将开始', startDate: '2026-12-01', endDate: '2026-12-20', info: '和平精英全球总决赛', detailUrl: 'https://pel.qq.com/' },

  // === 守望先锋 ===
  { id: 'owl-2026', league: '守望先锋联赛', game: '守望先锋', status: '进行中', startDate: '2026-05-01', endDate: '2026-09-30', info: 'OWL 2026赛季', detailUrl: 'https://overwatchleague.com/' },
  { id: 'owwc-2026', league: '守望先锋世界杯', game: '守望先锋', status: '即将开始', startDate: '2026-10-01', endDate: '2026-10-15', info: '守望先锋世界杯', detailUrl: 'https://overwatchleague.com/' },

  // === 星际争霸2 ===
  { id: 'sc2-gsl-summer', league: 'GSL星际争霸2联赛', game: '星际争霸2', status: '进行中', startDate: '2026-06-01', endDate: '2026-07-30', info: 'GSL Code S夏季赛', detailUrl: 'https://www.afreecatv.com/' },
  { id: 'sc2-iem-katowice', league: 'IEM卡托维兹SC2', game: '星际争霸2', status: '即将开始', startDate: '2027-01-25', endDate: '2027-02-02', info: 'IEM卡托维兹星际争霸2', detailUrl: 'https://www.esl-faceit.com/' },
];

// 获取当前活跃的电竞赛事
function getActiveEsportsEvents() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return ESPORTS_SCHEDULE.filter(evt => {
    // 进行中：今天在开始和结束之间
    if (today >= evt.startDate && today <= evt.endDate) return true;
    // 即将开始：未来60天内
    const startDate = new Date(evt.startDate);
    const diff = (startDate - now) / 86400000;
    if (diff > 0 && diff <= 60) return true;
    // 刚结束：15天内
    const endDate = new Date(evt.endDate);
    const endDiff = (now - endDate) / 86400000;
    if (endDiff >= 0 && endDiff <= 15) return true;
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
