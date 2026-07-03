// ============================================================
// 赛事定义 v2.0.5 - 精简版
// 仅保留：世界杯 / NBA / LPL / MSI / S赛 / 瓦罗兰特世界赛 / CS2世界赛 / F1
// ============================================================

const LEAGUES = {
  football: [
    { id: 'world-cup', name: '世界杯', keywords: ['世界杯', 'World Cup', 'FIFA'], source: '500.com', sport: 'football' },
  ],
  basketball: [
    { id: 'nba', name: 'NBA', keywords: ['NBA', 'National Basketball'], source: '500.com', sport: 'basketball' },
  ],
  motorsport: [
    { id: 'f1', name: 'F1', keywords: ['F1', 'Formula 1', 'Formula One', 'Grand Prix'], source: 'thesportsdb', sport: 'motorsport' },
  ],
  esports: [
    { id: 'lol-lpl',   name: 'LPL',             game: '英雄联盟', keywords: ['LPL'], source: 'static', sport: 'esports' },
    { id: 'lol-msi',   name: 'MSI季中冠军赛',   game: '英雄联盟', keywords: ['MSI', '季中冠军赛'], source: 'static', sport: 'esports' },
    { id: 'lol-worlds',name: 'S赛/全球总决赛',  game: '英雄联盟', keywords: ['Worlds', '全球总决赛', 'S赛'], source: 'static', sport: 'esports' },
    { id: 'val-champs',name: '瓦罗兰特全球冠军赛', game: '无畏契约', keywords: ['Valorant Champions', 'VCT Champions', '瓦罗兰特'], source: 'static', sport: 'esports' },
    { id: 'cs2-major', name: 'CS2 Major',       game: 'CS2', keywords: ['CS2 Major', 'PGL Major', 'CS2'], source: 'static', sport: 'esports' },
  ],
};

// 联赛分组（用于UI展示）
const GAME_CATEGORIES = {
  'football':   { name: '足球',  icon: '⚽', leagues: ['world-cup'] },
  'basketball': { name: '篮球',  icon: '🏀', leagues: ['nba'] },
  'motorsport': { name: 'F1',    icon: '🏎️', leagues: ['f1'] },
  '英雄联盟':   { name: '英雄联盟', icon: '🏆', leagues: ['lol-lpl', 'lol-msi', 'lol-worlds'] },
  '无畏契约':   { name: '无畏契约', icon: '⚡', leagues: ['val-champs'] },
  'CS2':        { name: 'CS2',   icon: '🔫', leagues: ['cs2-major'] },
};

function getAllLeagues() {
  return [...LEAGUES.football, ...LEAGUES.basketball, ...LEAGUES.motorsport, ...LEAGUES.esports];
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