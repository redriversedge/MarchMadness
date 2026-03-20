// app.js -- Init, tab navigation, admin overlay, shared state sync, rules

var App = (function() {
  var activeTab = 'dashboard';
  var adminOpen = false;
  var fontSize = 'normal';
  var reassignUnlocked = false;

  function init() {
    State.init();
    Draft.init();
    loadFontSize();

    renderNav();
    switchTab('dashboard');
    loadSharedState();
    API.startPolling();

    setInterval(function() {
      var el = document.getElementById('last-updated');
      if (el) {
        var state = State.get();
        var last = state.cache.lastFetch;
        if (last) {
          var mins = Math.floor((Date.now() - new Date(last).getTime()) / 60000);
          el.textContent = mins < 1 ? 'Just updated' : mins + ' min ago';
        }
      }
    }, 60000);
  }

  function loadSharedState() {
    fetch('/shared-state.json?t=' + Date.now())
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data) return;

        if (data.draft && Object.keys(data.draft).length > 0) {
          var existing = Object.keys(DRAFT_ASSIGNMENTS);
          for (var i = 0; i < existing.length; i++) delete DRAFT_ASSIGNMENTS[existing[i]];
          var keys = Object.keys(data.draft);
          for (var i = 0; i < keys.length; i++) DRAFT_ASSIGNMENTS[keys[i]] = data.draft[keys[i]];
          // Also save to localStorage so it persists locally
          try { localStorage.setItem('mm_draft', JSON.stringify(DRAFT_ASSIGNMENTS)); } catch(e) {}
          Draft.init();
        }

        if (data.games && Object.keys(data.games).length > 0) {
          var state = State.get();
          var gameKeys = Object.keys(data.games);
          for (var i = 0; i < gameKeys.length; i++) {
            if (state.games[gameKeys[i]]) {
              var sg = data.games[gameKeys[i]];
              state.games[gameKeys[i]].winner = sg.winner;
              state.games[gameKeys[i]].score1 = sg.score1;
              state.games[gameKeys[i]].score2 = sg.score2;
              state.games[gameKeys[i]].status = sg.status;
              state.games[gameKeys[i]].manualOverride = sg.manualOverride;
            }
          }
          State.save();
        }

        switchTab(activeTab);
      })
      .catch(function(err) {
        console.log('Could not load shared state:', err.message);
      });
  }

  function publishState() {
    var state = State.get();
    var statusEl = document.getElementById('publish-status');

    var exportData = {
      draft: DRAFT_ASSIGNMENTS,
      games: state.games,
      meta: { lastPublished: new Date().toISOString(), publishedBy: 'admin' }
    };

    var json = JSON.stringify(exportData, null, 2);

    // Download as shared-state.json
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'shared-state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (statusEl) {
      statusEl.innerHTML = 'Downloaded! Drop this file in the MarchMadness repo root (replace the existing shared-state.json), then commit and push to make it live for everyone.';
    }
  }

  function renderNav() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.innerHTML =
      '<button class="nav-btn active" data-tab="dashboard" onclick="App.switchTab(\'dashboard\')">' +
        '<span class="nav-icon">&#127942;</span><span class="nav-label">Dashboard</span></button>' +
      '<button class="nav-btn" data-tab="bracket" onclick="App.switchTab(\'bracket\')">' +
        '<span class="nav-icon">&#127936;</span><span class="nav-label">Bracket</span></button>' +
      '<button class="nav-btn" data-tab="scores" onclick="App.switchTab(\'scores\')">' +
        '<span class="nav-icon">&#9917;</span><span class="nav-label">Scores</span></button>' +
      '<button class="nav-btn" data-tab="rules" onclick="App.switchTab(\'rules\')">' +
        '<span class="nav-icon">&#128220;</span><span class="nav-label">Rules</span></button>';
  }

  function switchTab(tab) {
    activeTab = tab;

    var buttons = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].className = buttons[i].getAttribute('data-tab') === tab ? 'nav-btn active' : 'nav-btn';
    }

    var tabs = ['dashboard', 'bracket', 'scores', 'rules'];
    for (var i = 0; i < tabs.length; i++) {
      var el = document.getElementById('tab-' + tabs[i]);
      if (el) el.style.display = tabs[i] === tab ? 'block' : 'none';
    }

    if (tab === 'dashboard') Dashboard.render();
    else if (tab === 'bracket') BracketView.render();
    else if (tab === 'scores') renderScores();
    else if (tab === 'rules') renderRules();
  }

  // === RULES PAGE ===
  function renderRules() {
    var container = document.getElementById('tab-rules');
    if (!container) return;

    var html = '<div class="rules-page">';
    html += '<h2 class="rules-title">Scoring</h2>';

    html += '<p style="margin-bottom:12px;">Each time one of your teams wins a game, you earn points based on the round:</p>';
    html += '<table class="rules-table">';
    html += '<tr><th>Round</th><th>Dates</th><th>Points</th></tr>';
    for (var i = 0; i < CONFIG.roundPoints.length; i++) {
      html += '<tr><td>' + CONFIG.roundFullNames[i] + '</td><td>' + CONFIG.roundDates[i] + '</td><td>' + CONFIG.roundPoints[i] + '</td></tr>';
    }
    html += '<tr class="rules-total"><td>Max per team</td><td></td><td>' + CONFIG.roundPoints.reduce(function(a,b){return a+b;}, 0) + '</td></tr>';
    html += '</table>';

    html += '<p style="margin-top:16px;">Most total points at the end of the tournament wins.</p>';

    html += '</div>';
    container.innerHTML = html;
  }

  // === ADMIN ===
  function toggleAdmin() {
    adminOpen = !adminOpen;
    var overlay = document.getElementById('admin-overlay');
    if (overlay) {
      overlay.style.display = adminOpen ? 'flex' : 'none';
      if (adminOpen) renderAdmin();
    }
  }

  function renderAdmin() {
    var content = document.getElementById('admin-content');
    if (!content) return;

    var html = '';
    html += '<div class="admin-tabs">';
    html += '<button class="admin-tab active" onclick="App.showAdminSection(\'draft\', this)">Draft</button>';
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'reassign\', this)">Reassign</button>';
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'results\', this)">Results</button>';
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'settings\', this)">Settings</button>';
    html += '</div>';

    html += '<div id="admin-draft" class="admin-section"><div id="draft-content"></div></div>';

    html += '<div id="admin-reassign" class="admin-section" style="display:none;">';
    html += renderReassign();
    html += '</div>';

    html += '<div id="admin-results" class="admin-section" style="display:none;">';
    html += renderResultsEntry();
    html += '</div>';

    // Settings
    html += '<div id="admin-settings" class="admin-section" style="display:none;">';
    html += '<h3 style="margin-bottom:8px;">Share with Everyone</h3>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:8px;">Export your draft and results as a file. Drop it in the repo and push to make it live.</p>';
    html += '<button class="btn btn-primary" onclick="App.publishState()">Export State File</button>';
    html += '<button class="btn btn-secondary" onclick="App.loadSharedState()">Reload Shared State</button>';
    html += '<div id="publish-status" style="font-size:12px;color:#22c55e;margin-top:6px;"></div>';

    html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #333;">';
    html += '<h3 style="margin-bottom:8px;">Display</h3>';
    html += '<div style="display:flex;gap:6px;margin-bottom:12px;">';
    html += '<button class="btn ' + (fontSize === 'normal' ? 'btn-primary' : 'btn-secondary') + '" onclick="App.setFontSize(\'normal\')">Normal</button>';
    html += '<button class="btn ' + (fontSize === 'large' ? 'btn-primary' : 'btn-secondary') + '" onclick="App.setFontSize(\'large\')">Large</button>';
    html += '<button class="btn ' + (fontSize === 'xlarge' ? 'btn-primary' : 'btn-secondary') + '" onclick="App.setFontSize(\'xlarge\')">X-Large</button>';
    html += '</div></div>';

    html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #333;">';
    html += '<h3 style="margin-bottom:8px;">Scores</h3>';
    html += '<button class="btn btn-secondary" onclick="API.fetchScores()">Force Refresh from ESPN</button>';
    html += '</div>';

    html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #333;">';
    html += '<h3 style="margin-bottom:8px;color:#ef4444;">Danger Zone</h3>';
    html += '<button class="btn btn-danger" onclick="App.confirmResetDraft()">Reset Draft Only</button>';
    html += '<p style="font-size:11px;color:#888;margin:4px 0 12px;">Clears all team assignments.</p>';
    html += '<button class="btn btn-danger" onclick="App.confirmResetAll()">Reset Everything</button>';
    html += '<p style="font-size:11px;color:#888;margin:4px 0 0;">Clears draft AND all game results.</p>';
    html += '</div></div>';

    content.innerHTML = html;
    Draft.render();
  }

  function showAdminSection(section, btn) {
    var sections = document.querySelectorAll('.admin-section');
    for (var i = 0; i < sections.length; i++) sections[i].style.display = 'none';
    var tabs = document.querySelectorAll('.admin-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].className = 'admin-tab';
    var el = document.getElementById('admin-' + section);
    if (el) el.style.display = 'block';
    if (btn) btn.className = 'admin-tab active';
    if (section === 'draft') Draft.render();
  }

  // === RESULTS ENTRY (PIN-protected, ESPN auto-corrects) ===
  var resultsUnlocked = false;

  function renderResultsEntry() {
    var state = State.get();
    var html = '';

    if (!resultsUnlocked) {
      html += '<div class="results-lock">';
      html += '<h3>Manual Results Entry</h3>';
      html += '<p style="font-size:12px;color:#888;margin-bottom:12px;">Enter PIN to make changes. ESPN will auto-correct any mistakes when official results are available.</p>';
      html += '<div style="display:flex;gap:8px;align-items:center;">';
      html += '<input type="password" id="results-pin" placeholder="Enter PIN" class="pin-input" onkeydown="if(event.key===\'Enter\')App.unlockResults()">';
      html += '<button class="btn btn-primary" onclick="App.unlockResults()">Unlock</button>';
      html += '</div>';
      html += '<div id="pin-error" style="font-size:12px;color:#ef4444;margin-top:6px;"></div>';
      html += '</div>';
      return html;
    }

    html += '<h3>Manual Results Entry</h3>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:4px;">ESPN auto-corrects results when official scores are available.</p>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:12px;">Click the winning team. Click "Undo" to clear a result.</p>';

    var gameKeys = Object.keys(BRACKET);
    gameKeys.sort(function(a, b) { return parseInt(a) - parseInt(b); });

    for (var i = 0; i < gameKeys.length; i++) {
      var gId = gameKeys[i];
      var g = state.games[gId];
      var teams = State.getGameTeams(gId);
      if (!teams.team1 || !teams.team2) continue;

      var t1 = TEAMS[teams.team1];
      var t2 = TEAMS[teams.team2];
      var roundName = CONFIG.roundNames[BRACKET[gId].round - 1];
      var region = BRACKET[gId].region;
      var statusClass = g.status === 'final' ? 'result-final' : 'result-pending';

      var score1Str = g.score1 !== null ? ' (' + g.score1 + ')' : '';
      var score2Str = g.score2 !== null ? ' (' + g.score2 + ')' : '';

      html += '<div class="result-row ' + statusClass + '">';
      html += '<div class="result-meta">';
      html += roundName + ' - ' + region;
      if (g.status === 'final') {
        html += '<button class="undo-btn" onclick="App.undoResult(\'' + gId + '\')">Undo</button>';
      }
      html += '</div>';
      html += '<div class="result-matchup">';

      var w1Class = g.winner === teams.team1 ? ' winner-btn' : '';
      html += '<button class="result-team' + w1Class + '" ';
      html += 'onclick="App.setWinner(\'' + gId + '\', \'' + teams.team1 + '\')">';
      html += '(' + (t1 ? t1.seed : '?') + ') ' + (t1 ? t1.name : teams.team1) + score1Str;
      html += '</button>';

      html += '<span class="result-vs">vs</span>';

      var w2Class = g.winner === teams.team2 ? ' winner-btn' : '';
      html += '<button class="result-team' + w2Class + '" ';
      html += 'onclick="App.setWinner(\'' + gId + '\', \'' + teams.team2 + '\')">';
      html += '(' + (t2 ? t2.seed : '?') + ') ' + (t2 ? t2.name : teams.team2) + score2Str;
      html += '</button>';

      html += '</div>';
      html += '</div>';
    }

    return html;
  }

  function unlockResults() {
    var pinEl = document.getElementById('results-pin');
    var errEl = document.getElementById('pin-error');
    if (!pinEl) return;
    if (pinEl.value === '1126') {
      resultsUnlocked = true;
      renderAdmin();
      showAdminSection('results', document.querySelectorAll('.admin-tab')[1]);
    } else {
      if (errEl) errEl.textContent = 'Incorrect PIN';
    }
  }

  function setWinner(gameId, teamKey) {
    if (!resultsUnlocked) return;
    State.setGameResult(gameId, teamKey, null, null, true);
    renderAdmin();
    showAdminSection('results', document.querySelectorAll('.admin-tab')[1]);
    if (activeTab === 'dashboard') Dashboard.render();
    if (activeTab === 'bracket') BracketView.render();
  }

  function undoResult(gameId) {
    if (!resultsUnlocked) return;
    State.clearGameResult(gameId);
    renderAdmin();
    showAdminSection('results', document.querySelectorAll('.admin-tab')[1]);
    if (activeTab === 'dashboard') Dashboard.render();
    if (activeTab === 'bracket') BracketView.render();
  }

  // === TEAM REASSIGNMENT (PIN-protected) ===
  function renderReassign() {
    var html = '';

    if (!reassignUnlocked) {
      html += '<div class="results-lock">';
      html += '<h3>Team Reassignment</h3>';
      html += '<p style="font-size:12px;color:#888;margin-bottom:12px;">Reassign teams to different players after the draft. Enter PIN to unlock.</p>';
      html += '<div style="display:flex;gap:8px;align-items:center;">';
      html += '<input type="password" id="reassign-pin" placeholder="Enter PIN" class="pin-input" onkeydown="if(event.key===\'Enter\')App.unlockReassign()">';
      html += '<button class="btn btn-primary" onclick="App.unlockReassign()">Unlock</button>';
      html += '</div>';
      html += '<div id="reassign-pin-error" style="font-size:12px;color:#ef4444;margin-top:6px;"></div>';
      html += '</div>';
      return html;
    }

    html += '<h3>Team Reassignment</h3>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:12px;">Change team owners below, then click Save to apply.</p>';

    // Build a temp copy of assignments for editing
    REGIONS.forEach(function(region) {
      html += '<h4 style="font-size:13px;color:var(--text-dim);text-transform:uppercase;margin:16px 0 8px;">' + region + '</h4>';
      var teamKeys = Object.keys(TEAMS);
      teamKeys.sort(function(a, b) {
        if (TEAMS[a].region !== TEAMS[b].region) return TEAMS[a].region.localeCompare(TEAMS[b].region);
        return TEAMS[a].seed - TEAMS[b].seed;
      });
      for (var i = 0; i < teamKeys.length; i++) {
        var tk = teamKeys[i];
        var t = TEAMS[tk];
        if (t.region !== region) continue;
        var currentOwner = DRAFT_ASSIGNMENTS[tk] || '';

        html += '<div class="reassign-row">';
        html += '<span class="reassign-team">(' + t.seed + ') ' + t.name + '</span>';
        html += '<select class="reassign-select" id="reassign-' + tk + '" data-team="' + tk + '">';
        html += '<option value="">Unassigned</option>';
        for (var j = 0; j < CONFIG.players.length; j++) {
          var p = CONFIG.players[j];
          var sel = (currentOwner === p.id) ? ' selected' : '';
          html += '<option value="' + p.id + '"' + sel + '>' + p.name + ' (' + p.id + ')</option>';
        }
        html += '</select>';
        html += '</div>';
      }
    });

    html += '<div style="margin-top:16px;display:flex;gap:8px;">';
    html += '<button class="btn btn-primary" onclick="App.saveReassignments()">Save Assignments</button>';
    html += '</div>';
    html += '<div id="reassign-status" style="font-size:12px;color:#22c55e;margin-top:6px;"></div>';

    return html;
  }

  function unlockReassign() {
    var pinEl = document.getElementById('reassign-pin');
    var errEl = document.getElementById('reassign-pin-error');
    if (!pinEl) return;
    if (pinEl.value === '1126') {
      reassignUnlocked = true;
      renderAdmin();
      showAdminSection('reassign', document.querySelectorAll('.admin-tab')[1]);
    } else {
      if (errEl) errEl.textContent = 'Incorrect PIN';
    }
  }

  function saveReassignments() {
    var selects = document.querySelectorAll('.reassign-select');
    var newAssignments = {};
    for (var i = 0; i < selects.length; i++) {
      var tk = selects[i].getAttribute('data-team');
      var val = selects[i].value;
      if (val) {
        newAssignments[tk] = val;
      }
    }

    // Clear and repopulate DRAFT_ASSIGNMENTS
    var existing = Object.keys(DRAFT_ASSIGNMENTS);
    for (var i = 0; i < existing.length; i++) {
      delete DRAFT_ASSIGNMENTS[existing[i]];
    }
    var keys = Object.keys(newAssignments);
    for (var i = 0; i < keys.length; i++) {
      DRAFT_ASSIGNMENTS[keys[i]] = newAssignments[keys[i]];
    }

    // Save to localStorage
    try {
      localStorage.setItem('mm_draft', JSON.stringify(DRAFT_ASSIGNMENTS));
    } catch(e) {}

    // Re-init draft so it sees the new assignments
    Draft.init();

    var statusEl = document.getElementById('reassign-status');
    if (statusEl) statusEl.textContent = 'Assignments saved! Publish to server to share with everyone.';

    // Refresh views
    switchTab(activeTab);
  }

  // === SCORES/SCHEDULE PAGE ===
  var scoresFilter = 'all'; // 'all' or player ID like 'TH'

  function setScoresFilter(filter) {
    scoresFilter = filter;
    renderScores();
  }

  function gameMatchesFilter(gId) {
    if (scoresFilter === 'all') return true;
    var teams = State.getGameTeams(gId);
    var owner1 = teams.team1 ? getTeamOwner(teams.team1) : null;
    var owner2 = teams.team2 ? getTeamOwner(teams.team2) : null;
    return owner1 === scoresFilter || owner2 === scoresFilter;
  }

  function formatGameTime(isoString) {
    if (!isoString) return '';
    try {
      var d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      var options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
      return d.toLocaleString('en-US', options);
    } catch(e) { return ''; }
  }

  function renderScoreGame(gId, g, teams, roundLabel, showRegion) {
    var t1 = teams.team1 ? TEAMS[teams.team1] : null;
    var t2 = teams.team2 ? TEAMS[teams.team2] : null;
    if (!t1 && !t2) return '';

    var region = BRACKET[gId] ? BRACKET[gId].region : '';
    var statusClass = '';

    if (g.status === 'final') {
      statusClass = 'score-game-final';
    } else if (g.status === 'in_progress') {
      statusClass = 'score-game-live';
    } else {
      statusClass = 'score-game-scheduled';
    }

    var owner1 = teams.team1 ? getTeamOwner(teams.team1) : null;
    var owner2 = teams.team2 ? getTeamOwner(teams.team2) : null;
    var color1 = owner1 ? getPlayerColor(owner1) : '#666';
    var color2 = owner2 ? getPlayerColor(owner2) : '#666';

    var html = '<div class="score-game ' + statusClass + '">';

    // Status badge with time
    if (g.status === 'in_progress') {
      var detail = g.statusDetail || 'LIVE';
      html += '<div class="score-status"><span class="ticker-live">' + detail + '</span></div>';
    } else if (g.status === 'final') {
      html += '<div class="score-status"><span class="score-final-badge">FINAL</span></div>';
    } else {
      var timeStr = formatGameTime(g.startTime);
      if (timeStr) {
        html += '<div class="score-status"><span class="score-scheduled-badge">' + timeStr + '</span></div>';
      } else {
        html += '<div class="score-status"><span class="score-scheduled-badge">' + (roundLabel || 'TBD') + '</span></div>';
      }
    }

    // Region
    if (showRegion && region) {
      html += '<div class="score-region">' + region + '</div>';
    }

    // Team 1
    var t1Loser = g.winner && g.winner !== teams.team1;
    html += '<div class="score-team-row' + (t1Loser ? ' score-loser' : '') + '">';
    html += '<span class="score-team-seed">' + (t1 ? t1.seed : '?') + '</span>';
    html += '<span class="score-team-name" style="border-left:3px solid ' + color1 + ';padding-left:8px;">' + (t1 ? getTeamDisplayName(teams.team1) : 'TBD') + '</span>';
    if (owner1) {
      html += '<span class="team-owner-badge" style="background:' + color1 + '">' + owner1 + '</span>';
    }
    html += '<span class="score-team-score">' + (g.score1 !== null ? g.score1 : '') + '</span>';
    html += '</div>';

    // Team 2
    var t2Loser = g.winner && g.winner !== teams.team2;
    html += '<div class="score-team-row' + (t2Loser ? ' score-loser' : '') + '">';
    html += '<span class="score-team-seed">' + (t2 ? t2.seed : '?') + '</span>';
    html += '<span class="score-team-name" style="border-left:3px solid ' + color2 + ';padding-left:8px;">' + (t2 ? getTeamDisplayName(teams.team2) : 'TBD') + '</span>';
    if (owner2) {
      html += '<span class="team-owner-badge" style="background:' + color2 + '">' + owner2 + '</span>';
    }
    html += '<span class="score-team-score">' + (g.score2 !== null ? g.score2 : '') + '</span>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderScores() {
    var container = document.getElementById('tab-scores');
    if (!container) return;

    var state = State.get();
    var html = '<div class="scores-page">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
    html += '<h2 class="rules-title" style="margin-bottom:0;">Scores & Schedule</h2>';
    html += '<button class="btn btn-secondary" style="padding:6px 14px;font-size:12px;" onclick="App.refreshFromESPN()">Refresh</button>';
    html += '</div>';

    // Player filter pills
    html += '<div class="scores-filter" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">';
    var allActive = scoresFilter === 'all' ? ' scores-filter-active' : '';
    html += '<button class="scores-filter-btn' + allActive + '" onclick="App.setScoresFilter(\'all\')" style="font-size:11px;padding:4px 10px;border-radius:12px;border:1px solid #444;background:' + (scoresFilter === 'all' ? '#fff' : 'transparent') + ';color:' + (scoresFilter === 'all' ? '#000' : '#ccc') + ';cursor:pointer;">All</button>';
    for (var pi = 0; pi < CONFIG.players.length; pi++) {
      var p = CONFIG.players[pi];
      var isActive = scoresFilter === p.id;
      html += '<button class="scores-filter-btn" onclick="App.setScoresFilter(\'' + p.id + '\')" style="font-size:11px;padding:4px 10px;border-radius:12px;border:1px solid ' + (isActive ? p.color : '#444') + ';background:' + (isActive ? p.color : 'transparent') + ';color:' + (isActive ? '#000' : p.color) + ';cursor:pointer;">' + p.name + '</button>';
    }
    html += '</div>';

    // Play-in games (First Four) section -- only show final games to filter out women's/unmatched
    var allPlayIn = state.playInGames || [];
    var playInGames = [];
    for (var pi = 0; pi < allPlayIn.length; pi++) {
      if (allPlayIn[pi].status === 'final') playInGames.push(allPlayIn[pi]);
    }
    var allPlayInFinal = playInGames.length > 0;

    function renderFirstFourSection() {
      if (playInGames.length === 0) return '';
      var ffHtml = '<div class="scores-round">';
      ffHtml += '<div class="scores-round-header">';
      ffHtml += '<span>First Four</span>';
      ffHtml += '<span class="scores-round-date">Mar 17-18</span>';
      ffHtml += '</div>';
      for (var p = 0; p < playInGames.length; p++) {
        var pg = playInGames[p];
        var statusClass = '';
        if (pg.status === 'final') statusClass = 'score-game-final';
        else if (pg.status === 'in_progress') statusClass = 'score-game-live';
        else statusClass = 'score-game-scheduled';

        ffHtml += '<div class="score-game ' + statusClass + '">';
        if (pg.status === 'in_progress') {
          ffHtml += '<div class="score-status"><span class="ticker-live">' + (pg.statusDetail || 'LIVE') + '</span></div>';
        } else if (pg.status === 'final') {
          ffHtml += '<div class="score-status"><span class="score-final-badge">FINAL</span></div>';
        } else {
          var piTime = formatGameTime(pg.startTime);
          ffHtml += '<div class="score-status"><span class="score-scheduled-badge">' + (piTime || 'TBD') + '</span></div>';
        }
        ffHtml += '<div class="score-team-row' + (pg.winner && pg.winner !== 1 ? ' score-loser' : '') + '">';
        ffHtml += '<span class="score-team-seed">' + (pg.seed1 || '?') + '</span>';
        ffHtml += '<span class="score-team-name" style="border-left:3px solid #666;padding-left:8px;">' + pg.team1Name + '</span>';
        ffHtml += '<span class="score-team-score">' + (pg.score1 !== null && pg.score1 !== undefined ? pg.score1 : '') + '</span>';
        ffHtml += '</div>';
        ffHtml += '<div class="score-team-row' + (pg.winner && pg.winner !== 2 ? ' score-loser' : '') + '">';
        ffHtml += '<span class="score-team-seed">' + (pg.seed2 || '?') + '</span>';
        ffHtml += '<span class="score-team-name" style="border-left:3px solid #666;padding-left:8px;">' + pg.team2Name + '</span>';
        ffHtml += '<span class="score-team-score">' + (pg.score2 !== null && pg.score2 !== undefined ? pg.score2 : '') + '</span>';
        ffHtml += '</div>';
        ffHtml += '</div>';
      }
      ffHtml += '</div>';
      return ffHtml;
    }

    // Show First Four at top if not all final
    if (!allPlayInFinal) {
      html += renderFirstFourSection();
    }

    // Regular rounds -- sort completed rounds to the bottom
    var roundOrder = [];
    for (var r = 0; r < CONFIG.roundNames.length; r++) {
      roundOrder.push(r);
    }
    // Partition: incomplete rounds first (in original order), then completed rounds (in original order)
    var incompleteRounds = [];
    var completedRounds = [];
    for (var r = 0; r < roundOrder.length; r++) {
      var roundNum = r + 1;
      var allFinal = true;
      var hasAnyGame = false;
      var gameKeys = Object.keys(BRACKET);
      for (var i = 0; i < gameKeys.length; i++) {
        if (BRACKET[gameKeys[i]].round !== roundNum) continue;
        hasAnyGame = true;
        if (state.games[gameKeys[i]].status !== 'final') { allFinal = false; break; }
      }
      if (allFinal && hasAnyGame) {
        completedRounds.push(r);
      } else {
        incompleteRounds.push(r);
      }
    }
    var sortedRounds = incompleteRounds.concat(completedRounds);

    for (var ri = 0; ri < sortedRounds.length; ri++) {
      var r = sortedRounds[ri];
      var roundNum = r + 1;
      html += '<div class="scores-round">';
      html += '<div class="scores-round-header">';
      html += '<span>' + CONFIG.roundFullNames[r] + '</span>';
      html += '<span class="scores-round-date">' + CONFIG.roundDates[r] + '</span>';
      html += '</div>';

      var gameKeys = Object.keys(BRACKET);
      // Collect games for this round
      var roundGames = [];
      for (var i = 0; i < gameKeys.length; i++) {
        var gId = gameKeys[i];
        if (BRACKET[gId].round !== roundNum) continue;
        roundGames.push(gId);
      }
      // Sort: live first, then scheduled (by start time), then final
      roundGames.sort(function(a, b) {
        var ga = state.games[a];
        var gb = state.games[b];
        var orderA = ga.status === 'in_progress' ? 0 : (ga.status === 'scheduled' ? 1 : 2);
        var orderB = gb.status === 'in_progress' ? 0 : (gb.status === 'scheduled' ? 1 : 2);
        if (orderA !== orderB) return orderA - orderB;
        // Within scheduled games, sort by start time
        if (ga.status === 'scheduled' && gb.status === 'scheduled') {
          var ta = ga.startTime ? new Date(ga.startTime).getTime() : Infinity;
          var tb = gb.startTime ? new Date(gb.startTime).getTime() : Infinity;
          if (ta !== tb) return ta - tb;
        }
        return parseInt(a) - parseInt(b);
      });

      var hasGames = false;
      for (var i = 0; i < roundGames.length; i++) {
        var gId = roundGames[i];
        if (!gameMatchesFilter(gId)) continue;
        var g = state.games[gId];
        var teams = State.getGameTeams(gId);
        var rendered = renderScoreGame(gId, g, teams, CONFIG.roundDates[r], roundNum <= 4);
        if (rendered) hasGames = true;
        html += rendered;
      }

      if (!hasGames) {
        html += '<p style="color:var(--text-muted);font-size:12px;padding:8px 0;">Games TBD</p>';
      }

      html += '</div>';
    }

    // Show First Four at bottom if all final
    if (allPlayInFinal) {
      html += renderFirstFourSection();
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function refreshScores() {
    if (activeTab === 'scores') renderScores();
  }

  function refreshFromESPN() {
    API.fetchScores();
  }

  function confirmResetDraft() {
    if (confirm('Reset the draft? All team assignments will be cleared.')) {
      Draft.resetDraft();
      renderAdmin();
      switchTab(activeTab);
    }
  }

  function confirmResetAll() {
    if (confirm('Reset EVERYTHING? Draft and all game results will be cleared.')) {
      State.resetAll();
      Draft.resetDraft();
      renderAdmin();
      switchTab(activeTab);
    }
  }

  function setFontSize(size) {
    fontSize = size;
    document.documentElement.setAttribute('data-fontsize', size);
    try { localStorage.setItem('mm_fontsize', size); } catch(e) {}
    renderAdmin();
  }

  function loadFontSize() {
    try {
      var saved = localStorage.getItem('mm_fontsize');
      if (saved) {
        fontSize = saved;
        document.documentElement.setAttribute('data-fontsize', saved);
      }
    } catch(e) {}
  }

  return {
    init: init,
    switchTab: switchTab,
    toggleAdmin: toggleAdmin,
    showAdminSection: showAdminSection,
    setWinner: setWinner,
    undoResult: undoResult,
    unlockResults: unlockResults,
    unlockReassign: unlockReassign,
    saveReassignments: saveReassignments,
    confirmResetDraft: confirmResetDraft,
    confirmResetAll: confirmResetAll,
    publishState: publishState,
    loadSharedState: loadSharedState,
    setFontSize: setFontSize,
    refreshScores: refreshScores,
    refreshFromESPN: refreshFromESPN,
    setScoresFilter: setScoresFilter
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
