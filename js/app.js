// app.js -- Init, tab navigation, admin overlay, shared state sync, rules

var App = (function() {
  var activeTab = 'dashboard';
  var adminOpen = false;
  var fontSize = 'normal';

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
    fetch('/.netlify/functions/load-state')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data) return;

        if (data.draft && Object.keys(data.draft).length > 0) {
          var existing = Object.keys(DRAFT_ASSIGNMENTS);
          for (var i = 0; i < existing.length; i++) delete DRAFT_ASSIGNMENTS[existing[i]];
          var keys = Object.keys(data.draft);
          for (var i = 0; i < keys.length; i++) DRAFT_ASSIGNMENTS[keys[i]] = data.draft[keys[i]];
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
    var pin = prompt('Enter admin PIN to publish:');
    if (!pin) return;

    var state = State.get();
    var statusEl = document.getElementById('publish-status');
    if (statusEl) statusEl.textContent = 'Publishing...';

    fetch('/.netlify/functions/save-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: pin,
        draft: DRAFT_ASSIGNMENTS,
        games: state.games
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        if (statusEl) statusEl.textContent = 'Published! Everyone will see the latest data.';
        setTimeout(function() { if (statusEl) statusEl.textContent = ''; }, 5000);
      } else {
        if (statusEl) statusEl.textContent = 'Error: ' + (data.error || 'Unknown error');
      }
    })
    .catch(function(err) {
      if (statusEl) statusEl.textContent = 'Error: ' + err.message;
    });
  }

  function renderNav() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.innerHTML =
      '<button class="nav-btn active" data-tab="dashboard" onclick="App.switchTab(\'dashboard\')">' +
        '<span class="nav-icon">&#127942;</span><span class="nav-label">Dashboard</span></button>' +
      '<button class="nav-btn" data-tab="bracket" onclick="App.switchTab(\'bracket\')">' +
        '<span class="nav-icon">&#127936;</span><span class="nav-label">Bracket</span></button>' +
      '<button class="nav-btn" data-tab="rules" onclick="App.switchTab(\'rules\')">' +
        '<span class="nav-icon">&#128220;</span><span class="nav-label">Rules</span></button>';
  }

  function switchTab(tab) {
    activeTab = tab;

    var buttons = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].className = buttons[i].getAttribute('data-tab') === tab ? 'nav-btn active' : 'nav-btn';
    }

    var tabs = ['dashboard', 'bracket', 'rules'];
    for (var i = 0; i < tabs.length; i++) {
      var el = document.getElementById('tab-' + tabs[i]);
      if (el) el.style.display = tabs[i] === tab ? 'block' : 'none';
    }

    if (tab === 'dashboard') Dashboard.render();
    else if (tab === 'bracket') BracketView.render();
    else if (tab === 'rules') renderRules();
  }

  // === RULES PAGE ===
  function renderRules() {
    var container = document.getElementById('tab-rules');
    if (!container) return;

    var html = '<div class="rules-page">';
    html += '<h2 class="rules-title">Contest Rules</h2>';

    // Draft
    html += '<div class="rules-section">';
    html += '<h3>The Draft</h3>';
    html += '<ul>';
    html += '<li>All 64 NCAA tournament teams are distributed among ' + CONFIG.players.length + ' players via a <strong>snake draft</strong>.</li>';
    html += '<li>Draft order is randomized before the draft begins.</li>';
    html += '<li>Snake format: Round 1 goes 1-7, Round 2 goes 7-1, Round 3 goes 1-7, and so on.</li>';
    html += '<li>The first drafter gets 10 teams. Everyone else gets 9 teams.</li>';
    html += '</ul>';
    html += '</div>';

    // Scoring
    html += '<div class="rules-section">';
    html += '<h3>Scoring</h3>';
    html += '<p>Each time one of your teams wins a game, you earn points based on the round:</p>';
    html += '<table class="rules-table">';
    html += '<tr><th>Round</th><th>Points Per Win</th></tr>';
    var roundFullNames = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];
    for (var i = 0; i < CONFIG.roundPoints.length; i++) {
      html += '<tr><td>' + roundFullNames[i] + '</td><td>' + CONFIG.roundPoints[i] + '</td></tr>';
    }
    html += '<tr class="rules-total"><td>Max per team (wins it all)</td><td>' + CONFIG.roundPoints.reduce(function(a,b){return a+b;}, 0) + '</td></tr>';
    html += '</table>';
    html += '</div>';

    // Winner
    html += '<div class="rules-section">';
    html += '<h3>Winning</h3>';
    html += '<ul>';
    html += '<li>The player with the <strong>most total points</strong> at the end of the tournament wins.</li>';
    html += '<li>Tiebreaker: the player with more teams still alive at the end of the tournament. If still tied, the player whose team went furthest wins.</li>';
    html += '</ul>';
    html += '</div>';

    // Teams alive
    html += '<div class="rules-section">';
    html += '<h3>Teams Alive</h3>';
    html += '<ul>';
    html += '<li>When your team loses, they are eliminated and shown with a strikethrough.</li>';
    html += '<li>Your "teams alive" count tracks how many of your drafted teams are still in the tournament.</li>';
    html += '<li>"Max Possible" shows the theoretical maximum points you could earn if all your remaining teams win every game.</li>';
    html += '</ul>';
    html += '</div>';

    // Players
    html += '<div class="rules-section">';
    html += '<h3>Players</h3>';
    html += '<div class="rules-players">';
    for (var i = 0; i < CONFIG.players.length; i++) {
      var p = CONFIG.players[i];
      var teamCount = getTeamsForPlayer(p.id).length;
      html += '<div class="rules-player-row">';
      html += '<span class="player-badge" style="background:' + p.color + '">' + p.id + '</span>';
      html += '<span>' + p.name + '</span>';
      if (teamCount > 0) {
        html += '<span style="color:#888;font-size:12px;">' + teamCount + ' teams</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

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
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'results\', this)">Results</button>';
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'settings\', this)">Settings</button>';
    html += '</div>';

    html += '<div id="admin-draft" class="admin-section"><div id="draft-content"></div></div>';

    html += '<div id="admin-results" class="admin-section" style="display:none;">';
    html += renderResultsEntry();
    html += '</div>';

    // Settings
    html += '<div id="admin-settings" class="admin-section" style="display:none;">';
    html += '<h3 style="margin-bottom:8px;">Share with Everyone</h3>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:8px;">Publish your draft and results so everyone sees the same data.</p>';
    html += '<button class="btn btn-primary" onclick="App.publishState()">Publish to Server</button>';
    html += '<button class="btn btn-secondary" onclick="App.loadSharedState()">Pull Latest from Server</button>';
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

  // === RESULTS ENTRY (fallback - scores come from ESPN API) ===
  function renderResultsEntry() {
    var state = State.get();
    var html = '<h3>Manual Results Entry</h3>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:4px;">Scores pull automatically from ESPN. Use this only if a game result is missing.</p>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:12px;">Click the winning team to set the result. Publish after updating.</p>';

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

      // Show score if available
      var score1Str = g.score1 !== null ? ' (' + g.score1 + ')' : '';
      var score2Str = g.score2 !== null ? ' (' + g.score2 + ')' : '';

      html += '<div class="result-row ' + statusClass + '">';
      html += '<div class="result-meta">' + roundName + ' - ' + region + '</div>';
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

  function setWinner(gameId, teamKey) {
    State.setGameResult(gameId, teamKey, null, null, true);
    renderAdmin();
    if (activeTab === 'dashboard') Dashboard.render();
    if (activeTab === 'bracket') BracketView.render();
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
    confirmResetDraft: confirmResetDraft,
    confirmResetAll: confirmResetAll,
    publishState: publishState,
    loadSharedState: loadSharedState,
    setFontSize: setFontSize
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
