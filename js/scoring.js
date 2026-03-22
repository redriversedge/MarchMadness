// scoring.js -- Score calculation, standings, max possible points

var Scoring = (function() {

  function calculateStandings() {
    var state = State.get();
    var standings = CONFIG.players.map(function(player) {
      var owned = getTeamsForPlayer(player.id);
      var byRound = [0, 0, 0, 0, 0, 0];
      var teamsAlive = 0;
      var teamsEliminated = 0;

      // Count wins per round
      var gameKeys = Object.keys(state.games);
      for (var i = 0; i < gameKeys.length; i++) {
        var g = state.games[gameKeys[i]];
        if (g.status !== 'final' || !g.winner) continue;
        if (owned.indexOf(g.winner) !== -1) {
          var round = BRACKET[gameKeys[i]].round;
          byRound[round - 1] += CONFIG.roundPoints[round - 1];
        }
      }

      // Count alive vs eliminated
      for (var j = 0; j < owned.length; j++) {
        if (State.isTeamEliminated(owned[j])) {
          teamsEliminated++;
        } else {
          teamsAlive++;
        }
      }

      var total = 0;
      for (var k = 0; k < byRound.length; k++) total += byRound[k];

      return {
        playerId: player.id,
        name: player.name,
        color: player.color,
        total: total,
        byRound: byRound,
        teamsAlive: teamsAlive,
        teamsEliminated: teamsEliminated,
        teamsTotal: owned.length,
        maxPossible: calculateMaxPossible(owned, state)
      };
    });

    standings.sort(function(a, b) {
      return b.teamsAlive - a.teamsAlive;
    });

    return standings;
  }

  function calculateMaxPossible(ownedTeams, state) {
    var total = 0;

    // Current points
    var gameKeys = Object.keys(state.games);
    for (var i = 0; i < gameKeys.length; i++) {
      var g = state.games[gameKeys[i]];
      if (g.status !== 'final' || !g.winner) continue;
      if (ownedTeams.indexOf(g.winner) !== -1) {
        var round = BRACKET[gameKeys[i]].round;
        total += CONFIG.roundPoints[round - 1];
      }
    }

    // For each alive team, add max remaining points
    // Max = win every remaining game from current round to championship
    for (var j = 0; j < ownedTeams.length; j++) {
      if (State.isTeamEliminated(ownedTeams[j])) continue;
      var currentRound = getCurrentRound(ownedTeams[j], state);
      for (var r = currentRound; r <= 6; r++) {
        total += CONFIG.roundPoints[r - 1];
      }
    }

    return total;
  }

  function getCurrentRound(teamKey, state) {
    // Find the highest round this team has reached
    var maxRound = 1;
    var gameKeys = Object.keys(state.games);
    for (var i = 0; i < gameKeys.length; i++) {
      var g = state.games[gameKeys[i]];
      if (g.status !== 'final' || !g.winner) continue;
      if (g.winner === teamKey) {
        var round = BRACKET[gameKeys[i]].round;
        if (round + 1 > maxRound) maxRound = round + 1;
      }
    }
    return maxRound;
  }

  function getLiveGames() {
    var state = State.get();
    var live = [];
    var gameKeys = Object.keys(state.games);
    for (var i = 0; i < gameKeys.length; i++) {
      var g = state.games[gameKeys[i]];
      if (g.status === 'in_progress') {
        var teams = State.getGameTeams(gameKeys[i]);
        live.push({
          gameId: gameKeys[i],
          team1: teams.team1,
          team2: teams.team2,
          score1: g.score1,
          score2: g.score2,
          round: BRACKET[gameKeys[i]].round,
          region: BRACKET[gameKeys[i]].region
        });
      }
    }
    return live;
  }

  return {
    calculateStandings: calculateStandings,
    getLiveGames: getLiveGames
  };
})();
