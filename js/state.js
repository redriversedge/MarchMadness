// state.js -- State management with localStorage persistence

var STORAGE_KEY = 'mm_state';

var State = (function() {
  var state = null;
  var saveTimeout = null;

  function init() {
    state = load();
    return state;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.year === CONFIG.year) return parsed;
      }
    } catch(e) {
      console.error('Failed to load state:', e);
    }
    return createDefault();
  }

  function createDefault() {
    var games = {};
    var keys = Object.keys(BRACKET);
    for (var i = 0; i < keys.length; i++) {
      var g = BRACKET[keys[i]];
      games[keys[i]] = {
        winner: null,
        score1: null,
        score2: null,
        status: 'scheduled',
        manualOverride: false
      };
    }
    return {
      year: CONFIG.year,
      games: games,
      cache: { lastFetch: null }
    };
  }

  function save() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch(e) {
        console.error('Failed to save state:', e);
      }
    }, 300);
  }

  function get() {
    if (!state) init();
    return state;
  }

  function setGameResult(gameId, winner, score1, score2, isManual) {
    var g = state.games[gameId];
    if (!g) return;
    // ESPN final results always take priority over manual entries
    // Manual entries are placeholders until ESPN data arrives
    g.winner = winner;
    g.score1 = score1 || g.score1 || null;
    g.score2 = score2 || g.score2 || null;
    g.status = 'final';
    g.manualOverride = isManual && !score1; // only flag manual if no ESPN scores yet
    save();
  }

  function setGameStatus(gameId, status, score1, score2) {
    var g = state.games[gameId];
    if (!g) return;
    g.status = status;
    if (score1 !== null && score1 !== undefined) g.score1 = score1;
    if (score2 !== null && score2 !== undefined) g.score2 = score2;
    save();
  }

  function clearGameResult(gameId) {
    var g = state.games[gameId];
    if (!g) return;
    g.winner = null;
    g.score1 = null;
    g.score2 = null;
    g.status = 'scheduled';
    g.manualOverride = false;
    save();
  }

  function reset() {
    state = createDefault();
    save();
  }

  function resetDraft() {
    try {
      localStorage.removeItem('mm_draft');
    } catch(e) {}
    // Clear the live DRAFT_ASSIGNMENTS object
    var keys = Object.keys(DRAFT_ASSIGNMENTS);
    for (var i = 0; i < keys.length; i++) {
      delete DRAFT_ASSIGNMENTS[keys[i]];
    }
  }

  function resetAll() {
    resetDraft();
    reset();
  }

  function getGameTeams(gameId) {
    var game = BRACKET[gameId];
    if (!game) return { team1: null, team2: null };

    var team1 = game.team1 || null;
    var team2 = game.team2 || null;

    // For later rounds, get winner of source game
    if (game.source1 && state.games[game.source1]) {
      team1 = state.games[game.source1].winner || null;
    }
    if (game.source2 && state.games[game.source2]) {
      team2 = state.games[game.source2].winner || null;
    }

    return { team1: team1, team2: team2 };
  }

  function isTeamEliminated(teamKey) {
    var gameKeys = Object.keys(state.games);
    for (var i = 0; i < gameKeys.length; i++) {
      var g = state.games[gameKeys[i]];
      if (g.status !== 'final' || !g.winner) continue;
      var teams = getGameTeams(gameKeys[i]);
      if ((teams.team1 === teamKey || teams.team2 === teamKey) && g.winner !== teamKey) {
        return true;
      }
    }
    return false;
  }

  return {
    init: init,
    get: get,
    save: save,
    setGameResult: setGameResult,
    setGameStatus: setGameStatus,
    reset: reset,
    resetDraft: resetDraft,
    resetAll: resetAll,
    clearGameResult: clearGameResult,
    getGameTeams: getGameTeams,
    isTeamEliminated: isTeamEliminated
  };
})();
