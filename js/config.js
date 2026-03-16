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
  // === EAST (Washington DC) ===
  'duke':          { name: 'Duke',          seed: 1,  region: 'East' },
  'siena':         { name: 'Siena',         seed: 16, region: 'East' },
  'ohio-st':       { name: 'Ohio State',    seed: 8,  region: 'East' },
  'tcu':           { name: 'TCU',           seed: 9,  region: 'East' },
  'st-johns':      { name: "St. John's",    seed: 5,  region: 'East' },
  'northern-iowa': { name: 'Northern Iowa', seed: 12, region: 'East' },
  'kansas':        { name: 'Kansas',        seed: 4,  region: 'East' },
  'cal-baptist':   { name: 'Cal Baptist',   seed: 13, region: 'East' },
  'louisville':    { name: 'Louisville',    seed: 6,  region: 'East' },
  'south-florida': { name: 'South Florida', seed: 11, region: 'East' },
  'michigan-st':   { name: 'Michigan St',   seed: 3,  region: 'East' },
  'north-dakota-st': { name: 'North Dakota St', seed: 14, region: 'East' },
  'ucla':          { name: 'UCLA',          seed: 7,  region: 'East' },
  'ucf':           { name: 'UCF',           seed: 10, region: 'East' },
  'uconn':         { name: 'UConn',         seed: 2,  region: 'East' },
  'furman':        { name: 'Furman',        seed: 15, region: 'East' },

  // === WEST (San Jose) ===
  'arizona':       { name: 'Arizona',       seed: 1,  region: 'West' },
  'liu':           { name: 'LIU',           seed: 16, region: 'West' },
  'villanova':     { name: 'Villanova',     seed: 8,  region: 'West' },
  'utah-st':       { name: 'Utah State',    seed: 9,  region: 'West' },
  'wisconsin':     { name: 'Wisconsin',     seed: 5,  region: 'West' },
  'high-point':    { name: 'High Point',    seed: 12, region: 'West' },
  'arkansas':      { name: 'Arkansas',      seed: 4,  region: 'West' },
  'hawaii':        { name: 'Hawaii',        seed: 13, region: 'West' },
  'byu':           { name: 'BYU',           seed: 6,  region: 'West' },
  'texas-nc-st':   { name: 'Texas/NC State', seed: 11, region: 'West' },
  'gonzaga':       { name: 'Gonzaga',       seed: 3,  region: 'West' },
  'kennesaw-st':   { name: 'Kennesaw State', seed: 14, region: 'West' },
  'miami':         { name: 'Miami',         seed: 7,  region: 'West' },
  'missouri':      { name: 'Missouri',      seed: 10, region: 'West' },
  'purdue':        { name: 'Purdue',        seed: 2,  region: 'West' },
  'queens':        { name: 'Queens',        seed: 15, region: 'West' },

  // === SOUTH (Houston) ===
  'florida':       { name: 'Florida',       seed: 1,  region: 'South' },
  'prairie-view-lehigh': { name: 'Prairie View/Lehigh', seed: 16, region: 'South' },
  'clemson':       { name: 'Clemson',       seed: 8,  region: 'South' },
  'iowa':          { name: 'Iowa',          seed: 9,  region: 'South' },
  'vanderbilt':    { name: 'Vanderbilt',    seed: 5,  region: 'South' },
  'mcneese':       { name: 'McNeese',       seed: 12, region: 'South' },
  'nebraska':      { name: 'Nebraska',      seed: 4,  region: 'South' },
  'troy':          { name: 'Troy',          seed: 13, region: 'South' },
  'unc':           { name: 'North Carolina', seed: 6,  region: 'South' },
  'vcu':           { name: 'VCU',           seed: 11, region: 'South' },
  'illinois':      { name: 'Illinois',      seed: 3,  region: 'South' },
  'penn':          { name: 'Penn',          seed: 14, region: 'South' },
  'saint-marys':   { name: "Saint Mary's",  seed: 7,  region: 'South' },
  'texas-am':      { name: 'Texas A&M',     seed: 10, region: 'South' },
  'houston':       { name: 'Houston',       seed: 2,  region: 'South' },
  'idaho':         { name: 'Idaho',         seed: 15, region: 'South' },

  // === MIDWEST (Chicago) ===
  'michigan':      { name: 'Michigan',      seed: 1,  region: 'Midwest' },
  'umbc-howard':   { name: 'UMBC/Howard',   seed: 16, region: 'Midwest' },
  'georgia':       { name: 'Georgia',       seed: 8,  region: 'Midwest' },
  'st-louis':      { name: 'St. Louis',     seed: 9,  region: 'Midwest' },
  'texas-tech':    { name: 'Texas Tech',    seed: 5,  region: 'Midwest' },
  'akron':         { name: 'Akron',         seed: 12, region: 'Midwest' },
  'alabama':       { name: 'Alabama',       seed: 4,  region: 'Midwest' },
  'hofstra':       { name: 'Hofstra',       seed: 13, region: 'Midwest' },
  'tennessee':     { name: 'Tennessee',     seed: 6,  region: 'Midwest' },
  'miami-oh-smu':  { name: 'Miami OH/SMU',  seed: 11, region: 'Midwest' },
  'virginia':      { name: 'Virginia',      seed: 3,  region: 'Midwest' },
  'wright-st':     { name: 'Wright State',  seed: 14, region: 'Midwest' },
  'kentucky':      { name: 'Kentucky',      seed: 7,  region: 'Midwest' },
  'santa-clara':   { name: 'Santa Clara',   seed: 10, region: 'Midwest' },
  'iowa-st':       { name: 'Iowa State',    seed: 2,  region: 'Midwest' },
  'tennessee-st':  { name: 'Tennessee State', seed: 15, region: 'Midwest' }
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
