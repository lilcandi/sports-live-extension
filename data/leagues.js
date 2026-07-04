// ============================================================
// 赛事定义 v2.1.0 - 扩展版
// 足球：世界杯/中超/英超/西甲/意甲/德甲/法甲/欧冠/亚冠/欧洲杯/美洲杯/亚洲杯
// 篮球：NBA/CBA/欧冠篮球
// 赛车：F1/MotoGP/WEC
// 网球：四大满贯/ATP大师赛
// 乒乓球：世乒赛/世界杯/奥运会
// 电竞：LOL/DOTA2/CS2/Valorant/王者荣耀/和平精英/守望先锋/星际争霸
// ============================================================

const LEAGUES = {
  football: [
    // ===== 国家队赛事 =====
    { id: 'world-cup',      name: '世界杯',        keywords: ['世界杯', 'World Cup', 'FIFA'],      source: '500.com', sport: 'football', popularity: 100, tier: 'S+' },
    { id: 'euro-cup',       name: '欧洲杯',        keywords: ['欧洲杯', 'Euro', 'European Championship'], source: '500.com', sport: 'football', popularity: 95, tier: 'S+' },
    { id: 'copa-america',   name: '美洲杯',        keywords: ['美洲杯', 'Copa America'],          source: '500.com', sport: 'football', popularity: 85, tier: 'S' },
    { id: 'asian-cup',      name: '亚洲杯',        keywords: ['亚洲杯', 'Asian Cup'],              source: '500.com', sport: 'football', popularity: 80, tier: 'S' },
    { id: 'african-cup',    name: '非洲杯',        keywords: ['非洲杯', 'African Cup', 'AFCON'],   source: '500.com', sport: 'football', popularity: 60, tier: 'A' },
    // ===== 俱乐部赛事 =====
    { id: 'champions-league', name: '欧冠',        keywords: ['欧冠', 'Champions League', '冠军杯'], source: '500.com', sport: 'football', popularity: 98, tier: 'S+' },
    { id: 'europa-league',  name: '欧联杯',        keywords: ['欧联', 'Europa League', '欧罗巴'],  source: '500.com', sport: 'football', popularity: 75, tier: 'A' },
    { id: 'afc-champions',  name: '亚冠',          keywords: ['亚冠', 'AFC Champions'],            source: '500.com', sport: 'football', popularity: 78, tier: 'A' },
    // ===== 联赛 =====
    { id: 'premier-league', name: '英超',          keywords: ['英超', 'Premier League'],           source: '500.com', sport: 'football', popularity: 95, tier: 'S+' },
    { id: 'laliga',         name: '西甲',          keywords: ['西甲', 'La Liga', '西甲联赛'],      source: '500.com', sport: 'football', popularity: 92, tier: 'S' },
    { id: 'serie-a',        name: '意甲',          keywords: ['意甲', 'Serie A'],                  source: '500.com', sport: 'football', popularity: 88, tier: 'S' },
    { id: 'bundesliga',     name: '德甲',          keywords: ['德甲', 'Bundesliga'],               source: '500.com', sport: 'football', popularity: 85, tier: 'S' },
    { id: 'ligue-1',        name: '法甲',          keywords: ['法甲', 'Ligue 1'],                  source: '500.com', sport: 'football', popularity: 75, tier: 'A' },
    { id: 'csl',            name: '中超',          keywords: ['中超', '中超联赛', 'CSL'],          source: '500.com', sport: 'football', popularity: 90, tier: 'S' },
    { id: 'j-league',       name: 'J联赛',         keywords: ['J联赛', 'J League', '日职'],        source: '500.com', sport: 'football', popularity: 65, tier: 'A' },
    { id: 'k-league',       name: 'K联赛',         keywords: ['K联赛', 'K League', '韩职'],        source: '500.com', sport: 'football', popularity: 60, tier: 'A' },
    { id: 'mls',            name: '美职联',        keywords: ['美职联', 'MLS', '美国大联盟'],      source: '500.com', sport: 'football', popularity: 55, tier: 'B' },
    { id: 'eredivisie',     name: '荷甲',          keywords: ['荷甲', 'Eredivisie'],               source: '500.com', sport: 'football', popularity: 55, tier: 'B' },
    { id: 'primeira-liga',  name: '葡超',          keywords: ['葡超', 'Primeira Liga'],            source: '500.com', sport: 'football', popularity: 55, tier: 'B' },
  ],

  basketball: [
    { id: 'nba',            name: 'NBA',           keywords: ['NBA', 'National Basketball'],       source: '500.com', sport: 'basketball', popularity: 98, tier: 'S+' },
    { id: 'cba',            name: 'CBA',           keywords: ['CBA', '中国男篮', '中职篮'],        source: '500.com', sport: 'basketball', popularity: 90, tier: 'S' },
    { id: 'euroleague',     name: '欧冠篮球',      keywords: ['欧冠篮球', 'EuroLeague'],           source: '500.com', sport: 'basketball', popularity: 65, tier: 'A' },
    { id: 'ncaa',           name: 'NCAA',          keywords: ['NCAA', '美国大学篮球'],             source: '500.com', sport: 'basketball', popularity: 70, tier: 'A' },
    { id: 'fibawc',         name: '男篮世界杯',    keywords: ['男篮世界杯', 'FIBA World Cup'],     source: '500.com', sport: 'basketball', popularity: 85, tier: 'S' },
  ],

  motorsport: [
    { id: 'f1',             name: 'F1',            keywords: ['F1', 'Formula 1', 'Formula One', 'Grand Prix'], source: 'thesportsdb', sport: 'motorsport', popularity: 90, tier: 'S+' },
    { id: 'motogp',         name: 'MotoGP',        keywords: ['MotoGP', 'Moto GP', '摩托车大奖赛'], source: 'thesportsdb', sport: 'motorsport', popularity: 70, tier: 'A' },
    { id: 'wec',            name: 'WEC世界耐力锦标赛', keywords: ['WEC', 'World Endurance', '勒芒'], source: 'static', sport: 'motorsport', popularity: 55, tier: 'B' },
    { id: 'rally',          name: 'WRC拉力赛',     keywords: ['WRC', 'World Rally', '拉力赛'],     source: 'static', sport: 'motorsport', popularity: 50, tier: 'B' },
  ],

  tennis: [
    { id: 'ao',             name: '澳网',          keywords: ['澳网', 'Australian Open'],          source: 'thesportsdb', sport: 'tennis', popularity: 80, tier: 'S' },
    { id: 'fo',             name: '法网',          keywords: ['法网', 'French Open', '罗兰加洛斯'], source: 'thesportsdb', sport: 'tennis', popularity: 80, tier: 'S' },
    { id: 'wimbledon',      name: '温网',          keywords: ['温网', 'Wimbledon', '温布尔登'],    source: 'thesportsdb', sport: 'tennis', popularity: 82, tier: 'S' },
    { id: 'uso',            name: '美网',          keywords: ['美网', 'US Open'],                  source: 'thesportsdb', sport: 'tennis', popularity: 78, tier: 'S' },
    { id: 'atp-masters',    name: 'ATP大师赛',     keywords: ['ATP大师赛', 'ATP Masters'],         source: 'thesportsdb', sport: 'tennis', popularity: 65, tier: 'A' },
    { id: 'atp-finals',     name: 'ATP年终总决赛', keywords: ['ATP年终总决赛', 'ATP Finals'],      source: 'thesportsdb', sport: 'tennis', popularity: 70, tier: 'A' },
  ],

  tabletennis: [
    { id: 'tt-worlds',      name: '世乒赛',        keywords: ['世乒赛', 'World Table Tennis'],     source: 'static', sport: 'tabletennis', popularity: 75, tier: 'S' },
    { id: 'tt-worldcup',    name: '乒乓球世界杯',  keywords: ['乒乓球世界杯', '乒乓世界杯'],       source: 'static', sport: 'tabletennis', popularity: 70, tier: 'A' },
    { id: 'tt-olympic',     name: '奥运乒乓球',    keywords: ['奥运乒乓球', '奥运会乒乓'],         source: 'static', sport: 'tabletennis', popularity: 85, tier: 'S' },
    { id: 'tt-wtt',         name: 'WTT大满贯',     keywords: ['WTT', 'WTT大满贯'],                 source: 'static', sport: 'tabletennis', popularity: 65, tier: 'A' },
  ],

  esports: [
    // ===== 英雄联盟 =====
    { id: 'lol-lpl',        name: 'LPL',             game: '英雄联盟', keywords: ['LPL'],                     source: 'static', sport: 'esports', popularity: 95, tier: 'S+' },
    { id: 'lol-lck',        name: 'LCK',             game: '英雄联盟', keywords: ['LCK'],                     source: 'static', sport: 'esports', popularity: 75, tier: 'A' },
    { id: 'lol-lec',        name: 'LEC',             game: '英雄联盟', keywords: ['LEC'],                     source: 'static', sport: 'esports', popularity: 65, tier: 'A' },
    { id: 'lol-msi',        name: 'MSI季中冠军赛',   game: '英雄联盟', keywords: ['MSI', '季中冠军赛'],       source: 'static', sport: 'esports', popularity: 92, tier: 'S+' },
    { id: 'lol-worlds',     name: 'S赛/全球总决赛',  game: '英雄联盟', keywords: ['Worlds', '全球总决赛', 'S赛'], source: 'static', sport: 'esports', popularity: 100, tier: 'S+' },
    // ===== DOTA2 =====
    { id: 'dota2-ti',       name: 'DOTA2 TI国际邀请赛', game: 'DOTA2', keywords: ['TI', 'The International', '国际邀请赛'], source: 'static', sport: 'esports', popularity: 90, tier: 'S+' },
    { id: 'dota2-major',    name: 'DOTA2 Major',     game: 'DOTA2', keywords: ['DOTA2 Major', 'DPC Major'], source: 'static', sport: 'esports', popularity: 70, tier: 'A' },
    { id: 'dota2-dpc',      name: 'DPC中国联赛',     game: 'DOTA2', keywords: ['DPC', 'DOTA2职业巡回赛'],  source: 'static', sport: 'esports', popularity: 65, tier: 'A' },
    // ===== CS2 =====
    { id: 'cs2-major',      name: 'CS2 Major',       game: 'CS2',   keywords: ['CS2 Major', 'PGL Major', 'CS2'], source: 'static', sport: 'esports', popularity: 88, tier: 'S' },
    { id: 'cs2-iem',        name: 'IEM科隆/卡托',    game: 'CS2',   keywords: ['IEM', 'Intel Extreme'],     source: 'static', sport: 'esports', popularity: 75, tier: 'A' },
    { id: 'cs2-blast',      name: 'BLAST Premier',   game: 'CS2',   keywords: ['BLAST Premier', 'BLAST'],   source: 'static', sport: 'esports', popularity: 65, tier: 'A' },
    // ===== 无畏契约 =====
    { id: 'val-champions',  name: '瓦罗兰特全球冠军赛', game: '无畏契约', keywords: ['Valorant Champions', 'VCT Champions', '瓦罗兰特'], source: 'static', sport: 'esports', popularity: 85, tier: 'S' },
    { id: 'val-masters',    name: 'VCT大师赛',       game: '无畏契约', keywords: ['VCT Masters', '大师赛'],    source: 'static', sport: 'esports', popularity: 70, tier: 'A' },
    { id: 'val-cn',         name: 'VCT CN联赛',      game: '无畏契约', keywords: ['VCT CN', '无畏契约联赛'],   source: 'static', sport: 'esports', popularity: 75, tier: 'A' },
    // ===== 王者荣耀 =====
    { id: 'kpl',            name: 'KPL王者荣耀职业联赛', game: '王者荣耀', keywords: ['KPL', '王者荣耀职业联赛'], source: 'static', sport: 'esports', popularity: 92, tier: 'S+' },
    { id: 'kpl-champions',  name: '王者荣耀冠军杯',   game: '王者荣耀', keywords: ['王者荣耀冠军杯', '王者冠军杯'], source: 'static', sport: 'esports', popularity: 80, tier: 'S' },
    { id: 'awc',            name: '王者荣耀世界冠军杯', game: '王者荣耀', keywords: ['AWC', '世界冠军杯', '世冠'], source: 'static', sport: 'esports', popularity: 85, tier: 'S' },
    // ===== 和平精英 =====
    { id: 'pel',            name: 'PEL和平精英职业联赛', game: '和平精英', keywords: ['PEL', '和平精英职业联赛'], source: 'static', sport: 'esports', popularity: 78, tier: 'A' },
    { id: 'pmgc',           name: 'PMGC全球总决赛',   game: '和平精英', keywords: ['PMGC', '和平精英全球总决赛'], source: 'static', sport: 'esports', popularity: 80, tier: 'S' },
    // ===== 守望先锋 =====
    { id: 'owl',            name: '守望先锋联赛',     game: '守望先锋', keywords: ['OWL', 'Overwatch League'], source: 'static', sport: 'esports', popularity: 55, tier: 'B' },
    { id: 'owwc',           name: '守望先锋世界杯',   game: '守望先锋', keywords: ['守望先锋世界杯', 'OWWC'],  source: 'static', sport: 'esports', popularity: 60, tier: 'B' },
    // ===== 星际争霸 =====
    { id: 'sc2-gsl',        name: 'GSL星际争霸联赛',  game: '星际争霸2', keywords: ['GSL', 'Global StarCraft'], source: 'static', sport: 'esports', popularity: 50, tier: 'B' },
    { id: 'sc2-esl',        name: 'IEM卡托维兹SC2',   game: '星际争霸2', keywords: ['IEM SC2', '星际争霸2'],    source: 'static', sport: 'esports', popularity: 55, tier: 'B' },
  ],
};

// 联赛分组（用于UI展示）
const GAME_CATEGORIES = {
  '足球':        { name: '足球',      icon: '⚽', leagues: ['world-cup', 'euro-cup', 'champions-league', 'premier-league', 'laliga', 'serie-a', 'bundesliga', 'csl', 'europa-league', 'afc-champions', 'asian-cup', 'copa-america', 'ligue-1', 'j-league', 'k-league', 'mls', 'eredivisie', 'primeira-liga', 'african-cup'] },
  '篮球':        { name: '篮球',      icon: '🏀', leagues: ['nba', 'cba', 'fibawc', 'euroleague', 'ncaa'] },
  '赛车':        { name: '赛车',      icon: '🏎️', leagues: ['f1', 'motogp', 'wec', 'rally'] },
  '网球':        { name: '网球',      icon: '🎾', leagues: ['wimbledon', 'ao', 'fo', 'uso', 'atp-masters', 'atp-finals'] },
  '乒乓球':      { name: '乒乓球',    icon: '🏓', leagues: ['tt-worlds', 'tt-olympic', 'tt-worldcup', 'tt-wtt'] },
  '英雄联盟':    { name: '英雄联盟',  icon: '🏆', leagues: ['lol-lpl', 'lol-msi', 'lol-worlds', 'lol-lck', 'lol-lec'] },
  'DOTA2':       { name: 'DOTA2',     icon: '⚔️', leagues: ['dota2-ti', 'dota2-major', 'dota2-dpc'] },
  'CS2':         { name: 'CS2',       icon: '🔫', leagues: ['cs2-major', 'cs2-iem', 'cs2-blast'] },
  '无畏契约':    { name: '无畏契约',  icon: '⚡', leagues: ['val-champions', 'val-cn', 'val-masters'] },
  '王者荣耀':    { name: '王者荣耀',  icon: '👑', leagues: ['kpl', 'awc', 'kpl-champions'] },
  '和平精英':    { name: '和平精英',  icon: '🎯', leagues: ['pmgc', 'pel'] },
  '守望先锋':    { name: '守望先锋',  icon: '🛡️', leagues: ['owl', 'owwc'] },
  '星际争霸2':   { name: '星际争霸2', icon: '🚀', leagues: ['sc2-gsl', 'sc2-esl'] },
};

// 热度等级对应的基础分
const TIER_SCORES = {
  'S+': 100,
  'S':  80,
  'A':  60,
  'B':  40,
  'C':  20,
};

function getAllLeagues() {
  return [...LEAGUES.football, ...LEAGUES.basketball, ...LEAGUES.motorsport, ...LEAGUES.tennis, ...LEAGUES.tabletennis, ...LEAGUES.esports];
}

function findLeague(id) {
  for (const cat of Object.values(LEAGUES)) {
    const found = cat.find(l => l.id === id);
    if (found) return found;
  }
  return null;
}

function getLeaguesBySport(sport) {
  return LEAGUES[sport] || [];
}

// 根据联赛名获取热度基础分
function getLeagueBasePopularity(leagueName) {
  const all = getAllLeagues();
  for (const l of all) {
    if (l.keywords.some(kw => leagueName.includes(kw))) {
      return l.popularity || 50;
    }
  }
  return 40; // 默认热度
}
