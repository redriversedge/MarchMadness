// config.js -- Players, teams, bracket data, scoring rules
// Update TEAMS and DRAFT_ASSIGNMENTS after Selection Sunday and draft

var CONFIG = {
  year: 2026,
  roundPoints: [1, 2, 4, 8, 16, 32],
  roundNames: ['R64', 'R32', 'S16', 'E8', 'F4', 'Champ'],

  players: [
    { id: 'CB', name: 'Clifford', color: '#ef4444' },
    { id: 'MB', name: 'Michelle', color: '#3b82f6' },
    { id: 'CH', name: 'Caitlin',  color: '#22c55e' },
    { id: 'TH', name: 'Tom',      color: '#f59e0b' },
    { id: 'DH', name: 'Deneen',   color: '#a855f7' },
    { id: 'CL', name: 'Cami',     color: '#06b6d4' },
    { id: 'CK', name: 'Chuck',    color: '#f97316' }
  ]
};

// All 64 teams organized by region with seeds
// Update this after Selection Sunday bracket is announced
var REGIONS = ['East', 'West', 'South', 'Midwest'];

var TEAMS = {
  // === EAST ===
  'auburn':       { name: 'Auburn',       seed: 1,  region: 'East' },
  'alabama-st':   { name: 'Alabama St',   seed: 16, region: 'East' },
  'louisville':   { name: 'Louisville',    seed: 8,  region: 'East' },
  'creighton':    { name: 'Creighton',     seed: 9,  region: 'East' },
  'michigan':     { name: 'Michigan',      seed: 5,  region: 'East' },
  'uc-san-diego': { name: 'UC San Diego', seed: 12, region: 'East' },
  'texas-am':     { name: 'Texas A&M',    seed: 4,  region: 'East' },
  'yale':         { name: 'Yale',          seed: 13, region: 'East' },
  'ole-miss':     { name: 'Ole Miss',      seed: 6,  region: 'East' },
  'unc':          { name: 'North Carolina', seed: 11, region: 'East' },
  'iowa-st':      { name: 'Iowa State',    seed: 3,  region: 'East' },
  'lipscomb':     { name: 'Lipscomb',      seed: 14, region: 'East' },
  'marquette':    { name: 'Marquette',     seed: 7,  region: 'East' },
  'new-mexico':   { name: 'New Mexico',    seed: 10, region: 'East' },
  'michigan-st':  { name: 'Michigan St',   seed: 2,  region: 'East' },
  'bryant':       { name: 'Bryant',        seed: 15, region: 'East' },

  // === WEST ===
  'florida':      { name: 'Florida',       seed: 1,  region: 'West' },
  'norfolk-st':   { name: 'Norfolk St',    seed: 16, region: 'West' },
  'uconn':        { name: 'UConn',         seed: 8,  region: 'West' },
  'oklahoma':     { name: 'Oklahoma',      seed: 9,  region: 'West' },
  'memphis':      { name: 'Memphis',       seed: 5,  region: 'West' },
  'colorado-st':  { name: 'Colorado St',   seed: 12, region: 'West' },
  'maryland':     { name: 'Maryland',      seed: 4,  region: 'West' },
  'grand-canyon': { name: 'Grand Canyon',  seed: 13, region: 'West' },
  'missouri':     { name: 'Missouri',      seed: 6,  region: 'West' },
  'drake':        { name: 'Drake',         seed: 11, region: 'West' },
  'texas-tech':   { name: 'Texas Tech',    seed: 3,  region: 'West' },
  'unc-wilm':     { name: 'UNC Wilmington', seed: 14, region: 'West' },
  'kansas':       { name: 'Kansas',        seed: 7,  region: 'West' },
  'arkansas':     { name: 'Arkansas',      seed: 10, region: 'West' },
  'st-johns':     { name: "St. John's",    seed: 2,  region: 'West' },
  'omaha':        { name: 'Omaha',         seed: 15, region: 'West' },

  // === SOUTH ===
  'duke':         { name: 'Duke',          seed: 1,  region: 'South' },
  'mt-st-marys':  { name: "Mt St. Mary's", seed: 16, region: 'South' },
  'miss-st':      { name: 'Mississippi St', seed: 8,  region: 'South' },
  'baylor':       { name: 'Baylor',        seed: 9,  region: 'South' },
  'oregon':       { name: 'Oregon',        seed: 5,  region: 'South' },
  'liberty':      { name: 'Liberty',       seed: 12, region: 'South' },
  'arizona':      { name: 'Arizona',       seed: 4,  region: 'South' },
  'akron':        { name: 'Akron',         seed: 13, region: 'South' },
  'byu':          { name: 'BYU',           seed: 6,  region: 'South' },
  'vcu':          { name: 'VCU',           seed: 11, region: 'South' },
  'wisconsin':    { name: 'Wisconsin',     seed: 3,  region: 'South' },
  'montana':      { name: 'Montana',       seed: 14, region: 'South' },
  'saint-marys':  { name: "Saint Mary's",  seed: 7,  region: 'South' },
  'vanderbilt':   { name: 'Vanderbilt',    seed: 10, region: 'South' },
  'alabama':      { name: 'Alabama',       seed: 2,  region: 'South' },
  'robert-morris': { name: 'Robert Morris', seed: 15, region: 'South' },

  // === MIDWEST ===
  'houston':      { name: 'Houston',       seed: 1,  region: 'Midwest' },
  'siu-edw':      { name: 'SIU Edwardsville', seed: 16, region: 'Midwest' },
  'gonzaga':      { name: 'Gonzaga',       seed: 8,  region: 'Midwest' },
  'georgia':      { name: 'Georgia',       seed: 9,  region: 'Midwest' },
  'clemson':      { name: 'Clemson',       seed: 5,  region: 'Midwest' },
  'mcneese':      { name: 'McNeese',       seed: 12, region: 'Midwest' },
  'purdue':       { name: 'Purdue',        seed: 4,  region: 'Midwest' },
  'high-point':   { name: 'High Point',    seed: 13, region: 'Midwest' },
  'illinois':     { name: 'Illinois',      seed: 6,  region: 'Midwest' },
  'xavier':       { name: 'Xavier',        seed: 11, region: 'Midwest' },
  'kentucky':     { name: 'Kentucky',      seed: 3,  region: 'Midwest' },
  'troy':         { name: 'Troy',          seed: 14, region: 'Midwest' },
  'ucla':         { name: 'UCLA',          seed: 7,  region: 'Midwest' },
  'utah-st':      { name: 'Utah St',       seed: 10, region: 'Midwest' },
  'tennessee':    { name: 'Tennessee',     seed: 2,  region: 'Midwest' },
  'wofford':      { name: 'Wofford',       seed: 15, region: 'Midwest' }
};

// Draft assignments: team key -> player ID
// Loaded from localStorage if draft was done in-app, otherwise hardcoded here
var DRAFT_ASSIGNMENTS = (function() {
  try {
    var saved = localStorage.getItem('mm_draft');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return {};
})();

// Bracket structure: defines the 63 games
// Each game references two source slots (team keys or winner of previous game)
// Games numbered 1-63: R64 (1-32), R32 (33-48), S16 (49-56), E8 (57-60), F4 (61-62), Champ (63)
var BRACKET = (function() {
  var games = {};
  var gameId = 1;

  // Build R64 matchups by region (seeds 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
  var seedMatchups = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]];

  function getTeamBySeedAndRegion(seed, region) {
    var keys = Object.keys(TEAMS);
    for (var i = 0; i < keys.length; i++) {
      if (TEAMS[keys[i]].seed === seed && TEAMS[keys[i]].region === region) return keys[i];
    }
    return null;
  }

  // R64: 32 games (8 per region)
  REGIONS.forEach(function(region) {
    seedMatchups.forEach(function(seeds) {
      games[gameId] = {
        round: 1,
        region: region,
        team1: getTeamBySeedAndRegion(seeds[0], region),
        team2: getTeamBySeedAndRegion(seeds[1], region)
      };
      gameId++;
    });
  });

  // R32: 16 games (winners of consecutive R64 games)
  for (var i = 1; i <= 32; i += 2) {
    var r = games[i].region;
    games[gameId] = { round: 2, region: r, source1: i, source2: i + 1 };
    gameId++;
  }

  // S16: 8 games
  for (var i = 33; i <= 48; i += 2) {
    var r = games[i].region;
    games[gameId] = { round: 3, region: r, source1: i, source2: i + 1 };
    gameId++;
  }

  // E8: 4 games
  for (var i = 49; i <= 56; i += 2) {
    var r = games[i].region;
    games[gameId] = { round: 4, region: r, source1: i, source2: i + 1 };
    gameId++;
  }

  // F4: 2 games (East vs West, South vs Midwest)
  games[61] = { round: 5, region: 'Final Four', source1: 57, source2: 58 };
  games[62] = { round: 5, region: 'Final Four', source1: 59, source2: 60 };

  // Championship
  games[63] = { round: 6, region: 'Championship', source1: 61, source2: 62 };

  return games;
})();

// ESPN team ID to internal key mapping
// Used to match API results to our bracket data
var ESPN_TEAM_MAP = {
  // Populated after verifying ESPN team IDs during tournament
  // Format: espnTeamId: 'internal-key'
  // e.g., '2': 'auburn', '150': 'duke'
};

// Helper: get player color by ID
function getPlayerColor(playerId) {
  for (var i = 0; i < CONFIG.players.length; i++) {
    if (CONFIG.players[i].id === playerId) return CONFIG.players[i].color;
  }
  return '#666';
}

// Helper: get player by ID
function getPlayer(playerId) {
  for (var i = 0; i < CONFIG.players.length; i++) {
    if (CONFIG.players[i].id === playerId) return CONFIG.players[i];
  }
  return null;
}

// Helper: get team owner
function getTeamOwner(teamKey) {
  return DRAFT_ASSIGNMENTS[teamKey] || null;
}

// Helper: get all teams for a player
function getTeamsForPlayer(playerId) {
  var teams = [];
  var keys = Object.keys(DRAFT_ASSIGNMENTS);
  for (var i = 0; i < keys.length; i++) {
    if (DRAFT_ASSIGNMENTS[keys[i]] === playerId) {
      teams.push(keys[i]);
    }
  }
  return teams;
}
