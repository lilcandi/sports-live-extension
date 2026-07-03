// ============================================================
// 赛事/联赛定义 - 所有体育 + 电竞项目
// ============================================================

const LEAGUES = {
  // ========== 传统体育 ==========
  football: [
    { id: 'premier-league',  name: '英超',         keywords: ['英超', 'Premier League', 'English Premier League'], source: 'thesportsdb' },
    { id: 'la-liga',         name: '西甲',         keywords: ['西甲', 'La Liga', 'Spanish La Liga'], source: 'thesportsdb' },
    { id: 'serie-a',         name: '意甲',         keywords: ['意甲', 'Serie A', 'Italian Serie A'], source: 'thesportsdb' },
    { id: 'bundesliga',      name: '德甲',         keywords: ['德甲', 'Bundesliga', 'German Bundesliga'], source: 'thesportsdb' },
    { id: 'ligue-1',         name: '法甲',         keywords: ['法甲', 'Ligue 1', 'French Ligue 1'], source: 'thesportsdb' },
    { id: 'csl',             name: '中超',         keywords: ['中超', 'CSL', 'Chinese Super League'], source: '500.com' },
    { id: 'j-league',        name: 'J联赛',        keywords: ['J联赛', 'J.League', 'J1 League'], source: 'thesportsdb' },
    { id: 'k-league',        name: 'K联赛',        keywords: ['K联赛', 'K League'], source: 'thesportsdb' },
    { id: 'ucl',             name: '欧冠',         keywords: ['欧冠', 'Champions League', 'UEFA Champions'], source: 'thesportsdb' },
    { id: 'afc-cl',          name: '亚冠',         keywords: ['亚冠', 'AFC Champions'], source: 'thesportsdb' },
    { id: 'eredivisie',      name: '荷甲',         keywords: ['荷甲', 'Eredivisie'], source: 'thesportsdb' },
    { id: 'primeira',        name: '葡超',         keywords: ['葡超', 'Primeira Liga'], source: 'thesportsdb' },
    { id: 'world-cup',       name: '世界杯',       keywords: ['世界杯', 'World Cup', 'FIFA World Cup'], source: 'thesportsdb' },
    { id: 'euro-cup',        name: '欧洲杯',       keywords: ['欧洲杯', 'Euro', 'UEFA Euro'], source: 'thesportsdb' },
    { id: 'copa-america',    name: '美洲杯',       keywords: ['美洲杯', 'Copa America'], source: 'thesportsdb' },
    { id: 'fa-cup',          name: '足总杯',       keywords: ['足总杯', 'FA Cup'], source: 'thesportsdb' },
    { id: 'copa-del-rey',    name: '国王杯',       keywords: ['国王杯', 'Copa del Rey'], source: 'thesportsdb' },
  ],
  basketball: [
    { id: 'nba',             name: 'NBA',          keywords: ['NBA'], source: 'thesportsdb' },
    { id: 'cba',             name: 'CBA',          keywords: ['CBA'], source: '500.com' },
    { id: 'euroleague',      name: '欧洲篮球联赛', keywords: ['Euroleague', 'EuroLeague'], source: 'thesportsdb' },
    { id: 'ncaa-bb',         name: 'NCAA篮球',     keywords: ['NCAA', 'March Madness'], source: 'thesportsdb' },
    { id: 'fiba-wc',         name: '篮球世界杯',   keywords: ['FIBA', 'Basketball World Cup'], source: 'thesportsdb' },
  ],
  other_sports: [
    { id: 'nfl',             name: 'NFL',          keywords: ['NFL', 'National Football League'], source: 'thesportsdb' },
    { id: 'mlb',             name: 'MLB',          keywords: ['MLB', 'Major League Baseball'], source: 'thesportsdb' },
    { id: 'nhl',             name: 'NHL',          keywords: ['NHL', 'National Hockey League'], source: 'thesportsdb' },
    { id: 'f1',              name: 'F1',           keywords: ['F1', 'Formula 1', 'Formula One'], source: 'thesportsdb' },
    { id: 'tennis-atp',      name: 'ATP网球',     keywords: ['ATP', 'Tennis', 'Grand Slam', 'Wimbledon', 'US Open', 'French Open', 'Australian Open'], source: 'thesportsdb' },
    { id: 'motogp',          name: 'MotoGP',       keywords: ['MotoGP', 'Moto GP'], source: 'thesportsdb' },
    { id: 'ufc',             name: 'UFC',          keywords: ['UFC', 'MMA', 'Ultimate Fighting'], source: 'thesportsdb' },
    { id: 'boxing',          name: '拳击',         keywords: ['Boxing', 'WBC', 'WBA', 'IBF'], source: 'thesportsdb' },
  ],

  // ========== 超大赛事 ==========
  mega_events: [
    { id: 'fifa-world-cup',    name: 'FIFA世界杯',     keywords: ['世界杯', 'World Cup', 'FIFA World Cup'], source: 'thesportsdb', category: 'mega' },
    { id: 'olympics-summer',   name: '夏季奥运会',     keywords: ['奥运会', 'Olympic Games', 'Summer Olympics', 'Olympics', '奥运'], source: 'thesportsdb', category: 'mega' },
    { id: 'olympics-winter',   name: '冬季奥运会',     keywords: ['冬奥会', 'Winter Olympics', '冬奥', 'Winter Games'], source: 'thesportsdb', category: 'mega' },
    { id: 'asian-games',       name: '亚运会',         keywords: ['亚运会', 'Asian Games', 'Asiad', '亚运'], source: 'thesportsdb', category: 'mega' },
    { id: 'uefa-euro-mega',    name: '欧洲杯',         keywords: ['欧洲杯', 'Euro', 'UEFA Euro', 'European Championship'], source: 'thesportsdb', category: 'mega' },
    { id: 'copa-america-mega', name: '美洲杯',         keywords: ['美洲杯', 'Copa America'], source: 'thesportsdb', category: 'mega' },
    { id: 'afc-asian-cup',     name: '亚洲杯',         keywords: ['亚洲杯', 'AFC Asian Cup'], source: 'thesportsdb', category: 'mega' },
    { id: 'afcon',             name: '非洲杯',         keywords: ['非洲杯', 'AFCON', 'Africa Cup of Nations'], source: 'thesportsdb', category: 'mega' },
    { id: 'uefa-nations',      name: '欧国联',         keywords: ['欧国联', 'UEFA Nations League'], source: 'thesportsdb', category: 'mega' },
    { id: 'fiba-world-cup-m',  name: '篮球世界杯',     keywords: ['篮球世界杯', 'FIBA World Cup', 'FIBA Basketball'], source: 'thesportsdb', category: 'mega' },
    { id: 'rugby-world-cup',   name: '橄榄球世界杯',   keywords: ['Rugby World Cup', '橄榄球世界杯'], source: 'thesportsdb', category: 'mega' },
    { id: 'cricket-world-cup', name: '板球世界杯',     keywords: ['Cricket World Cup', '板球世界杯'], source: 'thesportsdb', category: 'mega' },
    { id: 'commonwealth',      name: '英联邦运动会',   keywords: ['Commonwealth Games', '英联邦运动会'], source: 'thesportsdb', category: 'mega' },
    { id: 'pan-american',      name: '泛美运动会',     keywords: ['Pan American Games', '泛美运动会'], source: 'thesportsdb', category: 'mega' },
    { id: 'uefa-cl-mega',      name: '欧冠决赛',       keywords: ['欧冠决赛', 'Champions League Final', 'UCL Final'], source: 'thesportsdb', category: 'mega' },
    { id: 'copa-libertadores', name: '南美解放者杯',   keywords: ['解放者杯', 'Copa Libertadores'], source: 'thesportsdb', category: 'mega' },
  ],

  // ========== 电竞 ==========
  esports: [
    // --- 英雄联盟 ---
    { id: 'lol-lpl',         name: 'LPL',             game: 'LOL',     keywords: ['LPL', '英雄联盟职业联赛', 'LPL春季赛', 'LPL夏季赛'], source: 'liquipedia', region: 'CN' },
    { id: 'lol-lck',         name: 'LCK',             game: 'LOL',     keywords: ['LCK', 'LCK春季赛', 'LCK夏季赛'], source: 'liquipedia', region: 'KR' },
    { id: 'lol-lec',         name: 'LEC',             game: 'LOL',     keywords: ['LEC', 'LEC春季赛', 'LEC夏季赛'], source: 'liquipedia', region: 'EU' },
    { id: 'lol-lcs',         name: 'LCS',             game: 'LOL',     keywords: ['LCS', 'LCS春季赛', 'LCS夏季赛'], source: 'liquipedia', region: 'NA' },
    { id: 'lol-msi',         name: 'MSI季中冠军赛',   game: 'LOL',     keywords: ['MSI', '季中冠军赛', 'Mid-Season Invitational'], source: 'liquipedia' },
    { id: 'lol-worlds',      name: 'S赛/全球总决赛',  game: 'LOL',     keywords: ['Worlds', '全球总决赛', 'World Championship', 'S赛', 'S13', 'S14', 'S15', 'S16'], source: 'liquipedia' },
    { id: 'lol-democup',     name: '德玛西亚杯',     game: 'LOL',     keywords: ['德玛西亚杯', 'Demacia Cup'], source: 'liquipedia', region: 'CN' },
    { id: 'lol-allstar',     name: '全明星赛',       game: 'LOL',     keywords: ['All-Star', '全明星'], source: 'liquipedia' },
    // --- 王者荣耀 ---
    { id: 'kpl',             name: 'KPL',            game: '王者荣耀', keywords: ['KPL', '王者荣耀职业联赛', 'KPL春季赛', 'KPL夏季赛'], source: 'pandascore', region: 'CN' },
    { id: 'honor-world',     name: '王者荣耀世界冠军杯', game: '王者荣耀', keywords: ['世界冠军杯', 'Honor of Kings'], source: 'pandascore' },
    // --- CS2 ---
    { id: 'cs2-major',       name: 'CS2 Major',      game: 'CS2',     keywords: ['CS2 Major', 'PGL Major', 'IEM Major', 'BLAST Major', 'CS:GO Major'], source: 'hltv' },
    { id: 'cs2-iem',         name: 'IEM',            game: 'CS2',     keywords: ['IEM', 'Intel Extreme Masters', 'IEM Katowice', 'IEM Cologne', 'IEM科隆'], source: 'hltv' },
    { id: 'cs2-blast',       name: 'BLAST',          game: 'CS2',     keywords: ['BLAST', 'BLAST Premier', 'BLAST Spring', 'BLAST Fall'], source: 'hltv' },
    { id: 'cs2-esl',         name: 'ESL Pro League', game: 'CS2',     keywords: ['ESL Pro League', 'EPL'], source: 'hltv' },
    // --- Valorant ---
    { id: 'val-vct-cn',      name: 'VCT CN',         game: 'Valorant', keywords: ['VCT CN', '无畏契约冠军巡回赛', 'VCT中国'], source: 'vlrgg', region: 'CN' },
    { id: 'val-vct-pacific', name: 'VCT Pacific',    game: 'Valorant', keywords: ['VCT Pacific', 'VCT太平洋'], source: 'vlrgg', region: 'APAC' },
    { id: 'val-vct-americas',name: 'VCT Americas',   game: 'Valorant', keywords: ['VCT Americas', 'VCT美洲'], source: 'vlrgg', region: 'AMER' },
    { id: 'val-vct-emea',    name: 'VCT EMEA',       game: 'Valorant', keywords: ['VCT EMEA', 'VCT欧洲'], source: 'vlrgg', region: 'EMEA' },
    { id: 'val-champions',   name: 'Valorant全球冠军赛', game: 'Valorant', keywords: ['Valorant Champions', '无畏契约全球冠军赛', 'VCT Champions'], source: 'vlrgg' },
    { id: 'val-masters',     name: 'Valorant大师赛', game: 'Valorant', keywords: ['Valorant Masters', 'VCT Masters', '无畏契约大师赛'], source: 'vlrgg' },
    // --- Dota 2 ---
    { id: 'dota2-ti',        name: 'Dota2国际邀请赛',game: 'Dota2',   keywords: ['The International', 'TI', 'TI13', 'TI14', 'TI15', 'Dota2国际邀请赛'], source: 'liquipedia' },
    { id: 'dota2-major',     name: 'Dota2 Major',    game: 'Dota2',   keywords: ['Dota2 Major', 'DPC Major'], source: 'liquipedia' },
    // --- Overwatch ---
    { id: 'ow-owl',          name: '守望先锋联赛',  game: 'Overwatch', keywords: ['OWL', 'Overwatch League', '守望先锋联赛'], source: 'liquipedia' },
    { id: 'ow-worldcup',     name: '守望先锋世界杯',game: 'Overwatch', keywords: ['Overwatch World Cup', '守望先锋世界杯'], source: 'liquipedia' },
    // --- Rainbow Six ---
    { id: 'r6-invitational', name: '彩虹六号国际邀请赛', game: 'R6', keywords: ['Six Invitational', '彩虹六号邀请赛', 'R6 Invitational'], source: 'liquipedia' },
    // --- 综合 ---
    { id: 'esports-asian',   name: '亚运会电竞项目', game: '综合',    keywords: ['亚运会电竞', 'Asian Games Esports', '杭州亚运电竞'], source: 'liquipedia' },
    { id: 'esports-oly',     name: '电竞奥运会',     game: '综合',    keywords: ['电竞奥运会', 'Olympic Esports', 'Esports Olympics'], source: 'liquipedia' },
  ],
};

// 按游戏类别分组，方便UI展示
const GAME_CATEGORIES = {
  'LOL':       { name: '英雄联盟',     icon: '🏆', leagues: ['lol-lpl', 'lol-lck', 'lol-lec', 'lol-lcs', 'lol-msi', 'lol-worlds', 'lol-democup', 'lol-allstar'] },
  '王者荣耀':   { name: '王者荣耀',     icon: '👑', leagues: ['kpl', 'honor-world'] },
  'CS2':       { name: 'CS2',          icon: '🔫', leagues: ['cs2-major', 'cs2-iem', 'cs2-blast', 'cs2-esl'] },
  'Valorant':  { name: '无畏契约',     icon: '⚡', leagues: ['val-vct-cn', 'val-vct-pacific', 'val-vct-americas', 'val-vct-emea', 'val-champions', 'val-masters'] },
  'Dota2':     { name: 'Dota2',        icon: '🗡️', leagues: ['dota2-ti', 'dota2-major'] },
  'Overwatch': { name: '守望先锋',     icon: '🛡️', leagues: ['ow-owl', 'ow-worldcup'] },
  'R6':        { name: '彩虹六号',     icon: '💣', leagues: ['r6-invitational'] },
  '综合':       { name: '综合赛事',     icon: '🌍', leagues: ['esports-asian', 'esports-oly'] },
  'mega':      { name: '超大赛事',     icon: '🏅', leagues: ['fifa-world-cup', 'olympics-summer', 'olympics-winter', 'asian-games', 'uefa-euro-mega', 'copa-america-mega', 'afc-asian-cup', 'afcon', 'uefa-nations', 'fiba-world-cup-m', 'rugby-world-cup', 'cricket-world-cup', 'commonwealth', 'pan-american', 'uefa-cl-mega', 'copa-libertadores'] },
};

// 获取所有联赛扁平列表
function getAllLeagues() {
  return [
    ...LEAGUES.football,
    ...LEAGUES.basketball,
    ...LEAGUES.other_sports,
    ...LEAGUES.mega_events,
    ...LEAGUES.esports,
  ];
}

// 根据ID查找联赛
function findLeague(id) {
  for (const cat of Object.values(LEAGUES)) {
    const found = cat.find(l => l.id === id);
    if (found) return found;
  }
  return null;
}

// 按运动类型获取联赛
function getLeaguesBySport(sport) {
  return LEAGUES[sport] || [];
}