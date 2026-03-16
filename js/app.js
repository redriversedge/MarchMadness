// app.js -- Init, tab navigation, admin overlay, auto-refresh

var App = (function() {
  var activeTab = 'dashboard';
  var adminOpen = false;

  function init() {
    State.init();
    Draft.init();

    // Set up tab navigation
    renderNav();
    switchTab('dashboard');

    // Start API polling
    API.startPolling();

    // Update timestamps periodically
    setInterval(function() {
      API.updateStatus && API.updateStatus('tick');
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

  function renderNav() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.innerHTML = '<button class="nav-btn active" data-tab="dashboard" onclick="App.switchTab(\'dashboard\')">' +
      '<span class="nav-icon">&#127942;</span>' +
      '<span class="nav-label">Dashboard</span>' +
      '</button>' +
      '<button class="nav-btn" data-tab="bracket" onclick="App.switchTab(\'bracket\')">' +
      '<span class="nav-icon">&#127936;</span>' +
      '<span class="nav-label">Bracket</span>' +
      '</button>';
  }

  function switchTab(tab) {
    activeTab = tab;

    // Update nav buttons
    var buttons = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].className = buttons[i].getAttribute('data-tab') === tab ?
        'nav-btn active' : 'nav-btn';
    }

    // Show correct tab content
    var dashboard = document.getElementById('tab-dashboard');
    var bracket = document.getElementById('tab-bracket');
    if (dashboard) dashboard.style.display = tab === 'dashboard' ? 'block' : 'none';
    if (bracket) bracket.style.display = tab === 'bracket' ? 'block' : 'none';

    // Render active tab
    if (tab === 'dashboard') Dashboard.render();
    else if (tab === 'bracket') BracketView.render();
  }

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

    // Tabs within admin
    html += '<div class="admin-tabs">';
    html += '<button class="admin-tab active" onclick="App.showAdminSection(\'draft\', this)">Draft</button>';
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'results\', this)">Results</button>';
    html += '<button class="admin-tab" onclick="App.showAdminSection(\'settings\', this)">Settings</button>';
    html += '</div>';

    // Draft section
    html += '<div id="admin-draft" class="admin-section">';
    html += '<div id="draft-content"></div>';
    html += '</div>';

    // Results section
    html += '<div id="admin-results" class="admin-section" style="display:none;">';
    html += renderResultsEntry();
    html += '</div>';

    // Settings section
    html += '<div id="admin-settings" class="admin-section" style="display:none;">';
    html += '<button class="btn btn-primary" onclick="API.fetchScores()">Force Refresh</button>';
    html += '<button class="btn btn-danger" onclick="App.confirmReset()">Reset All Data</button>';
    html += '</div>';

    content.innerHTML = html;
    Draft.render();
  }

  function showAdminSection(section, btn) {
    var sections = document.querySelectorAll('.admin-section');
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    var tabs = document.querySelectorAll('.admin-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].className = 'admin-tab';
    }
    var el = document.getElementById('admin-' + section);
    if (el) el.style.display = 'block';
    if (btn) btn.className = 'admin-tab active';

    if (section === 'draft') Draft.render();
  }

  function renderResultsEntry() {
    var state = State.get();
    var html = '<h3>Manual Results Entry</h3>';

    // List games that need results
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

      html += '<div class="result-row ' + statusClass + '">';
      html += '<div class="result-meta">' + roundName + ' - ' + region + '</div>';
      html += '<div class="result-matchup">';

      // Team 1 button
      var w1Class = g.winner === teams.team1 ? ' winner-btn' : '';
      html += '<button class="result-team' + w1Class + '" ';
      html += 'onclick="App.setWinner(\'' + gId + '\', \'' + teams.team1 + '\')">';
      html += '(' + (t1 ? t1.seed : '?') + ') ' + (t1 ? t1.name : teams.team1);
      html += '</button>';

      html += '<span class="result-vs">vs</span>';

      // Team 2 button
      var w2Class = g.winner === teams.team2 ? ' winner-btn' : '';
      html += '<button class="result-team' + w2Class + '" ';
      html += 'onclick="App.setWinner(\'' + gId + '\', \'' + teams.team2 + '\')">';
      html += '(' + (t2 ? t2.seed : '?') + ') ' + (t2 ? t2.name : teams.team2);
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

  function confirmReset() {
    if (confirm('Reset all game results? This cannot be undone.')) {
      State.reset();
      renderAdmin();
      switchTab(activeTab);
    }
  }

  return {
    init: init,
    switchTab: switchTab,
    toggleAdmin: toggleAdmin,
    showAdminSection: showAdminSection,
    setWinner: setWinner,
    confirmReset: confirmReset
  };
})();

// Init on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
