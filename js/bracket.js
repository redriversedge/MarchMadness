// bracket.js -- 64-team bracket visualization (CBS Sports inspired)
// Desktop: horizontal bracket with rounds flowing left-to-right per region
// Mobile: region tabs with vertical bracket
// Final Four: proper bracket layout with semis feeding into championship

var BracketView = (function() {
  var activeRegion = 'East';
  var viewMode = 'region'; // 'region' or 'full'

  function render() {
    var container = document.getElementById('tab-bracket');
    if (!container) return;

    var draftDone = Object.keys(DRAFT_ASSIGNMENTS).length > 0;

    var html = '';

    // View toggle + region tabs
    html += '<div class="bracket-controls">';
    html += '<div class="view-toggle">';
    html += '<button class="view-btn' + (viewMode === 'region' ? ' active' : '') + '" onclick="BracketView.setView(\'region\')">By Region</button>';
    html += '<button class="view-btn' + (viewMode === 'full' ? ' active' : '') + '" onclick="BracketView.setView(\'full\')">Full Bracket</button>';
    html += '</div>';

    if (viewMode === 'region') {
      html += '<div class="region-tabs">';
      var tabs = ['East', 'West', 'South', 'Midwest', 'Final Four'];
      for (var i = 0; i < tabs.length; i++) {
        var active = activeRegion === tabs[i] ? ' active' : '';
        html += '<button class="region-tab' + active + '" onclick="BracketView.setRegion(\'' + tabs[i] + '\')">' + tabs[i] + '</button>';
      }
      html += '</div>';
    }
    html += '</div>';

    if (!draftDone) {
      html += '<div class="empty-state">';
      html += '<div class="empty-icon">&#127942;</div>';
      html += '<h3>No Draft Yet</h3>';
      html += '<p>Complete the draft first to see the bracket with team colors.</p>';
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    if (viewMode === 'full') {
      html += renderFullBracket();
    } else if (activeRegion === 'Final Four') {
      html += renderFinalFour();
    } else {
      html += renderRegion(activeRegion);
    }

    container.innerHTML = html;
  }

  function renderRegion(region) {
    var state = State.get();
    var rounds = getRegionRounds(region);

    var html = '<div class="bracket-region">';
    html += '<div class="bracket-horizontal">';

    for (var r = 0; r < rounds.length; r++) {
      html += '<div class="bracket-col" data-round="' + (r + 1) + '">';
      html += '<div class="round-header">' + CONFIG.roundFullNames[r] + '<div class="round-date">' + CONFIG.roundDates[r] + '</div></div>';
      html += '<div class="bracket-col-games">';
      for (var g = 0; g < rounds[r].length; g++) {
        html += '<div class="bracket-game-wrap">';
        html += renderMatchup(rounds[r][g].id, state);
        html += '</div>';
      }
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderFullBracket() {
    var state = State.get();
    var html = '<div class="full-bracket">';

    // Left side: East and West (rounds flow left to right toward center)
    html += '<div class="full-bracket-half left-half">';
    html += renderFullRegion('East', state, 'left');
    html += renderFullRegion('West', state, 'left');
    html += '</div>';

    // Center: Final Four
    html += '<div class="full-bracket-center">';
    html += renderFinalFourCompact(state);
    html += '</div>';

    // Right side: South and Midwest (rounds flow right to left toward center)
    html += '<div class="full-bracket-half right-half">';
    html += renderFullRegion('South', state, 'right');
    html += renderFullRegion('Midwest', state, 'right');
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderFullRegion(region, state, side) {
    var rounds = getRegionRounds(region);
    var html = '<div class="full-region">';
    html += '<div class="full-region-label">' + region + '</div>';
    html += '<div class="full-region-bracket ' + side + '">';

    var cols = side === 'right' ? rounds.slice().reverse() : rounds;

    for (var r = 0; r < cols.length; r++) {
      var actualRound = side === 'right' ? (rounds.length - r) : (r + 1);
      html += '<div class="bracket-col-sm" data-round="' + actualRound + '">';
      for (var g = 0; g < cols[r].length; g++) {
        html += '<div class="bracket-game-wrap-sm">';
        html += renderMatchupCompact(cols[r][g].id, state);
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderFinalFourCompact(state) {
    var html = '<div class="ff-bracket">';

    // Semi 1 (East vs West winner)
    html += '<div class="ff-semi ff-semi-left">';
    html += '<div class="ff-label">Semifinal</div>';
    html += renderMatchupCompact('61', state);
    html += '</div>';

    // Championship
    html += '<div class="ff-champ">';
    html += '<div class="ff-label ff-champ-label">Championship</div>';
    html += renderMatchupCompact('63', state);
    var champGame = state.games['63'];
    if (champGame && champGame.winner) {
      var champTeam = TEAMS[champGame.winner];
      var champOwner = getTeamOwner(champGame.winner);
      var champColor = getPlayerColor(champOwner);
      html += '<div class="ff-champion" style="border-color:' + champColor + '">';
      html += '<div class="champion-crown">Champion</div>';
      html += '<div style="color:' + champColor + ';font-weight:800;">' + (champTeam ? champTeam.name : '') + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Semi 2 (South vs Midwest winner)
    html += '<div class="ff-semi ff-semi-right">';
    html += '<div class="ff-label">Semifinal</div>';
    html += renderMatchupCompact('62', state);
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderFinalFour() {
    var state = State.get();
    var html = '<div class="final-four-view">';

    // Bracket layout: two semis on sides, championship in center
    html += '<div class="ff-bracket-layout">';

    // Left semi
    html += '<div class="ff-side">';
    html += '<div class="ff-side-label">Semifinal<div class="round-date">' + CONFIG.roundDates[4] + '</div></div>';
    html += renderMatchup('61', state);
    html += '</div>';

    // Center - championship
    html += '<div class="ff-center">';
    html += '<div class="ff-center-label">National Championship<div class="round-date">' + CONFIG.roundDates[5] + '</div></div>';
    html += renderMatchup('63', state);

    // Champion banner
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

    // Right semi
    html += '<div class="ff-side">';
    html += '<div class="ff-side-label">Semifinal<div class="round-date">' + CONFIG.roundDates[4] + '</div></div>';
    html += renderMatchup('62', state);
    html += '</div>';

    html += '</div>';
    html += '</div>';
    return html;
  }

  function getRegionRounds(region) {
    var gameKeys = Object.keys(BRACKET);
    var rounds = [[], [], [], []];

    for (var i = 0; i < gameKeys.length; i++) {
      var g = BRACKET[gameKeys[i]];
      if (g.region !== region) continue;
      if (g.round >= 1 && g.round <= 4) {
        rounds[g.round - 1].push({ id: gameKeys[i], game: g });
      }
    }

    // Sort each round by game ID
    for (var r = 0; r < rounds.length; r++) {
      rounds[r].sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });
    }

    return rounds;
  }

  function renderMatchup(gameId, state) {
    var teams = State.getGameTeams(gameId);
    var g = state.games[gameId];
    var status = g ? g.status : 'scheduled';
    var winner = g ? g.winner : null;

    var html = '<div class="matchup' + (status === 'in_progress' ? ' live' : '') + '">';
    html += renderTeamSlot(teams.team1, winner, g ? g.score1 : null, status);
    html += renderTeamSlot(teams.team2, winner, g ? g.score2 : null, status);
    html += '</div>';
    return html;
  }

  function renderMatchupCompact(gameId, state) {
    var teams = State.getGameTeams(gameId);
    var g = state.games[gameId];
    var status = g ? g.status : 'scheduled';
    var winner = g ? g.winner : null;

    var html = '<div class="matchup-sm' + (status === 'in_progress' ? ' live' : '') + '">';
    html += renderTeamSlotCompact(teams.team1, winner, g ? g.score1 : null);
    html += renderTeamSlotCompact(teams.team2, winner, g ? g.score2 : null);
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

    var classes = 'team-slot';
    if (isWinner) classes += ' winner';
    if (isLoser) classes += ' eliminated';
    if (status === 'in_progress') classes += ' live';

    var bgColor = owner ? (color + '26') : 'transparent';
    if (isLoser) bgColor = '#33333340';

    var html = '<div class="' + classes + '" style="background:' + bgColor + ';border-left-color:' + (owner ? color : '#555') + '">';
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

  function renderTeamSlotCompact(teamKey, winner, score) {
    if (!teamKey) {
      return '<div class="team-slot-sm tbd">TBD</div>';
    }

    var team = TEAMS[teamKey];
    var owner = getTeamOwner(teamKey);
    var color = getPlayerColor(owner);
    var isWinner = winner === teamKey;
    var isLoser = winner && winner !== teamKey;

    var classes = 'team-slot-sm';
    if (isWinner) classes += ' winner';
    if (isLoser) classes += ' eliminated';

    var bgColor = owner ? (color + '20') : 'transparent';
    if (isLoser) bgColor = '#33333340';

    var html = '<div class="' + classes + '" style="background:' + bgColor + ';border-left:2px solid ' + (owner ? color : '#555') + '">';
    html += '<span class="seed-sm">' + (team ? team.seed : '?') + '</span>';
    html += '<span class="name-sm">' + (team ? team.name : '') + '</span>';
    if (score !== null && score !== undefined) {
      html += '<span class="score-sm">' + score + '</span>';
    }
    html += '</div>';
    return html;
  }

  function setRegion(region) {
    activeRegion = region;
    render();
  }

  function setView(mode) {
    viewMode = mode;
    render();
  }

  return {
    render: render,
    setRegion: setRegion,
    setView: setView
  };
})();
