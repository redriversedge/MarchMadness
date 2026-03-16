// dashboard.js -- Leaderboard, player cards, live ticker rendering

var Dashboard = (function() {
  var expandedPlayer = null;

  function render() {
    var container = document.getElementById('tab-dashboard');
    if (!container) return;

    var standings = Scoring.calculateStandings();
    var liveGames = Scoring.getLiveGames();

    var html = '';

    // Live ticker
    if (liveGames.length > 0) {
      html += renderLiveTicker(liveGames);
    }

    // Check if draft is done
    var draftDone = Object.keys(DRAFT_ASSIGNMENTS).length > 0;
    if (!draftDone) {
      html += '<div class="empty-state">';
      html += '<div class="empty-icon">&#127936;</div>';
      html += '<h3>No Draft Yet</h3>';
      html += '<p>Open the admin panel (gear icon) to run the snake draft and assign teams.</p>';
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    // Leaderboard
    html += '<div class="section-header">Standings</div>';
    html += '<div class="leaderboard">';
    for (var i = 0; i < standings.length; i++) {
      html += renderPlayerRow(standings[i], i + 1);
    }
    html += '</div>';

    // Expanded player card
    if (expandedPlayer) {
      var playerStanding = null;
      for (var i = 0; i < standings.length; i++) {
        if (standings[i].playerId === expandedPlayer) {
          playerStanding = standings[i];
          break;
        }
      }
      if (playerStanding) {
        html += renderPlayerCard(playerStanding);
      }
    }

    // Max possible
    html += '<div class="max-possible">';
    html += '<div class="max-label">Max Possible Points</div>';
    html += '<div class="max-values">';
    standings.sort(function(a, b) { return b.maxPossible - a.maxPossible; });
    for (var i = 0; i < standings.length; i++) {
      var s = standings[i];
      html += '<span class="max-item" style="color:' + s.color + '">';
      html += s.playerId + ': ' + s.maxPossible;
      html += '</span>';
    }
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  function renderLiveTicker(games) {
    var html = '<div class="live-ticker">';
    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      var t1 = TEAMS[g.team1];
      var t2 = TEAMS[g.team2];
      var c1 = getPlayerColor(getTeamOwner(g.team1));
      var c2 = getPlayerColor(getTeamOwner(g.team2));

      html += '<div class="ticker-game">';
      html += '<span class="ticker-live">LIVE</span>';
      html += '<span class="ticker-team" style="color:' + c1 + '">';
      html += '(' + (t1 ? t1.seed : '?') + ') ' + (t1 ? t1.name : 'TBD');
      html += '</span>';
      html += '<span class="ticker-score">' + (g.score1 || 0) + '</span>';
      html += '<span class="ticker-sep">-</span>';
      html += '<span class="ticker-score">' + (g.score2 || 0) + '</span>';
      html += '<span class="ticker-team" style="color:' + c2 + '">';
      html += '(' + (t2 ? t2.seed : '?') + ') ' + (t2 ? t2.name : 'TBD');
      html += '</span>';
      html += '</div>';
      if (i < games.length - 1) html += '<div class="ticker-divider"></div>';
    }
    html += '</div>';
    return html;
  }

  function renderPlayerRow(s, rank) {
    var rankClass = rank <= 3 ? ' rank-' + rank : '';
    var isExpanded = expandedPlayer === s.playerId;
    var html = '<div class="player-row' + rankClass + (isExpanded ? ' expanded' : '') + '" ';
    html += 'style="border-left-color:' + s.color + '" ';
    html += 'onclick="Dashboard.togglePlayer(\'' + s.playerId + '\')">';

    // Rank
    html += '<div class="player-rank">' + rank + '</div>';

    // Badge
    html += '<div class="player-badge" style="background:' + s.color + '">' + s.playerId + '</div>';

    // Name and teams alive
    html += '<div class="player-info">';
    html += '<div class="player-name">' + s.name + '</div>';
    html += '<div class="player-meta">' + s.teamsAlive + ' teams alive</div>';
    html += '</div>';

    // Score
    html += '<div class="player-score" style="color:' + s.color + '">';
    html += '<div class="score-num">' + s.total + '</div>';
    html += '<div class="score-label">pts</div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderPlayerCard(s) {
    var html = '<div class="player-card" style="border-color:' + s.color + '">';

    // Header
    html += '<div class="card-header" style="background:' + s.color + '">';
    html += '<span>' + s.name + ' (' + s.playerId + ')</span>';
    html += '<span>' + s.total + ' pts | ' + s.teamsAlive + '/' + s.teamsTotal + ' alive</span>';
    html += '</div>';

    // Round breakdown
    html += '<div class="card-rounds">';
    for (var i = 0; i < CONFIG.roundNames.length; i++) {
      html += '<div class="round-box">';
      html += '<div class="round-label">' + CONFIG.roundNames[i] + '</div>';
      html += '<div class="round-pts">' + s.byRound[i] + '</div>';
      html += '</div>';
    }
    html += '<div class="round-box round-total" style="background:' + s.color + '">';
    html += '<div class="round-label">Total</div>';
    html += '<div class="round-pts">' + s.total + '</div>';
    html += '</div>';
    html += '</div>';

    // Team roster
    html += '<div class="card-teams">';
    var teams = getTeamsForPlayer(s.playerId);
    teams.sort(function(a, b) {
      var elA = State.isTeamEliminated(a) ? 1 : 0;
      var elB = State.isTeamEliminated(b) ? 1 : 0;
      if (elA !== elB) return elA - elB;
      return (TEAMS[a] ? TEAMS[a].seed : 99) - (TEAMS[b] ? TEAMS[b].seed : 99);
    });
    for (var i = 0; i < teams.length; i++) {
      var t = TEAMS[teams[i]];
      if (!t) continue;
      var elim = State.isTeamEliminated(teams[i]);
      html += '<span class="team-badge' + (elim ? ' eliminated' : '') + '" ';
      html += 'style="border-color:' + s.color + '">';
      html += '(' + t.seed + ') ' + t.name;
      html += '</span>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  function togglePlayer(playerId) {
    expandedPlayer = (expandedPlayer === playerId) ? null : playerId;
    render();
  }

  return {
    render: render,
    togglePlayer: togglePlayer
  };
})();
