// bracket.js -- 64-team bracket visualization with color coding

var BracketView = (function() {
  var activeRegion = 'East';

  function render() {
    var container = document.getElementById('tab-bracket');
    if (!container) return;

    var draftDone = Object.keys(DRAFT_ASSIGNMENTS).length > 0;
    if (!draftDone) {
      container.innerHTML = '<div class="empty-state">' +
        '<div class="empty-icon">&#127942;</div>' +
        '<h3>No Draft Yet</h3>' +
        '<p>Complete the draft first to see the bracket with team colors.</p>' +
        '</div>';
      return;
    }

    var html = '';

    // Region tabs (for mobile, visible on desktop too)
    html += '<div class="region-tabs">';
    var tabs = ['East', 'West', 'South', 'Midwest', 'Final Four'];
    for (var i = 0; i < tabs.length; i++) {
      var active = activeRegion === tabs[i] ? ' active' : '';
      html += '<button class="region-tab' + active + '" ';
      html += 'onclick="BracketView.setRegion(\'' + tabs[i] + '\')">';
      html += tabs[i];
      html += '</button>';
    }
    html += '</div>';

    // Bracket content
    if (activeRegion === 'Final Four') {
      html += renderFinalFour();
    } else {
      html += renderRegion(activeRegion);
    }

    container.innerHTML = html;
  }

  function renderRegion(region) {
    var state = State.get();
    var html = '<div class="bracket-region">';

    // Get R64 games for this region
    var r64Games = [];
    var gameKeys = Object.keys(BRACKET);
    for (var i = 0; i < gameKeys.length; i++) {
      var g = BRACKET[gameKeys[i]];
      if (g.round === 1 && g.region === region) {
        r64Games.push({ id: gameKeys[i], game: g });
      }
    }

    // Sort by game ID to maintain bracket order
    r64Games.sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });

    // Build rounds for this region
    // R64: 8 games, R32: 4 games, S16: 2 games, E8: 1 game
    var rounds = [[], [], [], []];

    // R64
    for (var i = 0; i < r64Games.length; i++) {
      rounds[0].push(r64Games[i]);
    }

    // Find R32 games for this region
    for (var i = 0; i < gameKeys.length; i++) {
      var g = BRACKET[gameKeys[i]];
      if (g.round === 2 && g.region === region) {
        rounds[1].push({ id: gameKeys[i], game: g });
      }
    }
    rounds[1].sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });

    // S16
    for (var i = 0; i < gameKeys.length; i++) {
      var g = BRACKET[gameKeys[i]];
      if (g.round === 3 && g.region === region) {
        rounds[2].push({ id: gameKeys[i], game: g });
      }
    }
    rounds[2].sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });

    // E8
    for (var i = 0; i < gameKeys.length; i++) {
      var g = BRACKET[gameKeys[i]];
      if (g.round === 4 && g.region === region) {
        rounds[3].push({ id: gameKeys[i], game: g });
      }
    }

    // Render each round
    var roundLabels = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8'];
    html += '<div class="bracket-rounds">';

    for (var r = 0; r < rounds.length; r++) {
      html += '<div class="bracket-round" data-round="' + (r + 1) + '">';
      html += '<div class="round-header">' + roundLabels[r] + '</div>';
      for (var g = 0; g < rounds[r].length; g++) {
        html += renderMatchup(rounds[r][g].id, state);
      }
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderFinalFour() {
    var state = State.get();
    var html = '<div class="bracket-final-four">';

    // Semi 1 (game 61)
    html += '<div class="ff-section">';
    html += '<div class="round-header">Semifinal 1</div>';
    html += renderMatchup('61', state);
    html += '</div>';

    // Semi 2 (game 62)
    html += '<div class="ff-section">';
    html += '<div class="round-header">Semifinal 2</div>';
    html += renderMatchup('62', state);
    html += '</div>';

    // Championship (game 63)
    html += '<div class="ff-section ff-championship">';
    html += '<div class="round-header">Championship</div>';
    html += renderMatchup('63', state);
    html += '</div>';

    // Champion display
    var champGame = state.games['63'];
    if (champGame && champGame.winner) {
      var champTeam = TEAMS[champGame.winner];
      var champOwner = getTeamOwner(champGame.winner);
      var champColor = getPlayerColor(champOwner);
      html += '<div class="champion-banner" style="border-color:' + champColor + '">';
      html += '<div class="champion-label">National Champion</div>';
      html += '<div class="champion-team" style="color:' + champColor + '">';
      html += (champTeam ? champTeam.name : champGame.winner);
      html += '</div>';
      if (champOwner) {
        var p = getPlayer(champOwner);
        html += '<div class="champion-owner">' + (p ? p.name : champOwner) + '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderMatchup(gameId, state) {
    var teams = State.getGameTeams(gameId);
    var g = state.games[gameId];
    var status = g ? g.status : 'scheduled';
    var winner = g ? g.winner : null;

    var html = '<div class="matchup' + (status === 'in_progress' ? ' live' : '') + '">';

    // Team 1
    html += renderTeamSlot(teams.team1, winner, g ? g.score1 : null, status);

    // Team 2
    html += renderTeamSlot(teams.team2, winner, g ? g.score2 : null, status);

    html += '</div>';
    return html;
  }

  function renderTeamSlot(teamKey, winner, score, status) {
    if (!teamKey) {
      return '<div class="team-slot tbd"><span class="team-name">TBD</span></div>';
    }

    var team = TEAMS[teamKey];
    var owner = getTeamOwner(teamKey);
    var color = getPlayerColor(owner);
    var isWinner = winner === teamKey;
    var isLoser = winner && winner !== teamKey;
    var eliminated = State.isTeamEliminated(teamKey);

    var classes = 'team-slot';
    if (isWinner) classes += ' winner';
    if (isLoser || eliminated) classes += ' eliminated';
    if (status === 'in_progress') classes += ' live';

    var bgColor = color + '26'; // 15% opacity hex
    if (isLoser || eliminated) bgColor = '#33333340';

    var html = '<div class="' + classes + '" style="background:' + bgColor + ';border-left-color:' + color + '">';
    html += '<span class="team-seed">(' + (team ? team.seed : '?') + ')</span>';
    html += '<span class="team-name">' + (team ? team.name : teamKey) + '</span>';
    if (owner) {
      html += '<span class="team-owner-badge" style="background:' + color + '">' + owner + '</span>';
    }
    if (score !== null && score !== undefined) {
      html += '<span class="team-score">' + score + '</span>';
    }
    html += '</div>';
    return html;
  }

  function setRegion(region) {
    activeRegion = region;
    render();
  }

  return {
    render: render,
    setRegion: setRegion
  };
})();
