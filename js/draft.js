// draft.js -- Snake draft admin UI with randomizer

var Draft = (function() {
  var draftOrder = [];
  var picks = [];
  var isLocked = false;

  function init() {
    // Check if draft is already complete (assignments exist)
    var keys = Object.keys(DRAFT_ASSIGNMENTS);
    if (keys.length > 0) {
      isLocked = true;
    }
  }

  function randomizeOrder() {
    if (isLocked) return;
    draftOrder = CONFIG.players.map(function(p) { return p.id; });
    // Fisher-Yates shuffle
    for (var i = draftOrder.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = draftOrder[i];
      draftOrder[i] = draftOrder[j];
      draftOrder[j] = temp;
    }
    picks = [];
    render();
  }

  function getSnakeOrder() {
    // 64 picks, snake style through 7 players
    var order = [];
    var numTeams = Object.keys(TEAMS).length;
    var round = 0;
    var pick = 0;
    while (pick < numTeams) {
      var forward = (round % 2 === 0);
      for (var i = 0; i < draftOrder.length && pick < numTeams; i++) {
        var idx = forward ? i : (draftOrder.length - 1 - i);
        order.push(draftOrder[idx]);
        pick++;
      }
      round++;
    }
    return order;
  }

  function getCurrentPick() {
    return picks.length;
  }

  function getCurrentDrafter() {
    var order = getSnakeOrder();
    if (picks.length >= order.length) return null;
    return order[picks.length];
  }

  function getAvailableTeams() {
    var picked = {};
    for (var i = 0; i < picks.length; i++) {
      picked[picks[i].teamKey] = true;
    }
    var available = [];
    var keys = Object.keys(TEAMS);
    for (var i = 0; i < keys.length; i++) {
      if (!picked[keys[i]]) {
        available.push({ key: keys[i], team: TEAMS[keys[i]] });
      }
    }
    available.sort(function(a, b) {
      if (a.team.region !== b.team.region) return a.team.region.localeCompare(b.team.region);
      return a.team.seed - b.team.seed;
    });
    return available;
  }

  function makePick(teamKey) {
    if (isLocked) return;
    var drafter = getCurrentDrafter();
    if (!drafter) return;
    picks.push({ teamKey: teamKey, playerId: drafter });
    saveDraftToStorage();
    render();

    // Check if draft is complete
    if (picks.length >= Object.keys(TEAMS).length) {
      finalizeDraft();
    }
  }

  function undoPick() {
    if (isLocked || picks.length === 0) return;
    picks.pop();
    saveDraftToStorage();
    render();
  }

  function saveDraftToStorage() {
    var assignments = {};
    for (var i = 0; i < picks.length; i++) {
      assignments[picks[i].teamKey] = picks[i].playerId;
    }
    try {
      localStorage.setItem('mm_draft', JSON.stringify(assignments));
    } catch(e) {}
    // Update the live object so dashboard/bracket see changes immediately
    var keys = Object.keys(assignments);
    // Clear and repopulate DRAFT_ASSIGNMENTS
    var existing = Object.keys(DRAFT_ASSIGNMENTS);
    for (var i = 0; i < existing.length; i++) {
      delete DRAFT_ASSIGNMENTS[existing[i]];
    }
    for (var i = 0; i < keys.length; i++) {
      DRAFT_ASSIGNMENTS[keys[i]] = assignments[keys[i]];
    }
  }

  function finalizeDraft() {
    saveDraftToStorage();
    isLocked = true;
    exportDraft();
  }

  function exportDraft() {
    var assignments = {};
    for (var i = 0; i < picks.length; i++) {
      assignments[picks[i].teamKey] = picks[i].playerId;
    }

    // Build the export string
    var lines = ['var DRAFT_ASSIGNMENTS = {'];
    REGIONS.forEach(function(region) {
      lines.push('  // === ' + region.toUpperCase() + ' ===');
      var keys = Object.keys(assignments);
      for (var i = 0; i < keys.length; i++) {
        if (TEAMS[keys[i]] && TEAMS[keys[i]].region === region) {
          lines.push("  '" + keys[i] + "': '" + assignments[keys[i]] + "',");
        }
      }
    });
    lines.push('};');

    console.log('=== DRAFT EXPORT - Copy this into config.js ===');
    console.log(lines.join('\n'));

    // Also show in the UI
    var exportArea = document.getElementById('draft-export');
    if (exportArea) {
      exportArea.textContent = lines.join('\n');
      exportArea.style.display = 'block';
    }
  }

  function getPlayerPickCount(playerId) {
    var count = 0;
    for (var i = 0; i < picks.length; i++) {
      if (picks[i].playerId === playerId) count++;
    }
    return count;
  }

  function render() {
    var container = document.getElementById('draft-content');
    if (!container) return;

    if (isLocked) {
      renderCompletedDraft(container);
      return;
    }

    var html = '';

    // Draft order section
    if (draftOrder.length === 0) {
      html += '<div class="draft-section">';
      html += '<h3>Set Draft Order</h3>';
      html += '<button class="btn btn-primary" onclick="Draft.randomizeOrder()">Randomize Order</button>';
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    // Show current order
    html += '<div class="draft-section">';
    html += '<h3>Draft Order</h3>';
    html += '<div class="draft-order">';
    for (var i = 0; i < draftOrder.length; i++) {
      var p = getPlayer(draftOrder[i]);
      var count = getPlayerPickCount(draftOrder[i]);
      html += '<div class="draft-order-item" style="border-color:' + p.color + '">';
      html += '<span class="player-badge" style="background:' + p.color + '">' + p.id + '</span>';
      html += '<span>' + p.name + '</span>';
      html += '<span class="pick-count">' + count + ' teams</span>';
      html += '</div>';
    }
    html += '</div>';
    if (picks.length === 0) {
      html += '<button class="btn btn-secondary" onclick="Draft.randomizeOrder()">Re-shuffle</button>';
    }
    html += '</div>';

    // Current pick info
    var drafter = getCurrentDrafter();
    if (drafter) {
      var player = getPlayer(drafter);
      var pickNum = getCurrentPick() + 1;
      var snakeRound = Math.floor(getCurrentPick() / draftOrder.length) + 1;
      html += '<div class="draft-current" style="border-color:' + player.color + '">';
      html += '<div class="draft-pick-num">Pick #' + pickNum + ' (Round ' + snakeRound + ')</div>';
      html += '<div class="draft-drafter">';
      html += '<span class="player-badge-lg" style="background:' + player.color + '">' + player.id + '</span>';
      html += '<span>' + player.name + "'s pick</span>";
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div class="draft-complete-msg">Draft Complete!</div>';
    }

    // Undo button
    if (picks.length > 0) {
      html += '<button class="btn btn-secondary" onclick="Draft.undoPick()">Undo Last Pick</button>';
    }

    // Available teams by region
    var available = getAvailableTeams();
    var byRegion = {};
    for (var i = 0; i < available.length; i++) {
      var r = available[i].team.region;
      if (!byRegion[r]) byRegion[r] = [];
      byRegion[r].push(available[i]);
    }

    html += '<div class="draft-teams">';
    html += '<h3>Available Teams (' + available.length + ' remaining)</h3>';
    REGIONS.forEach(function(region) {
      if (!byRegion[region] || byRegion[region].length === 0) return;
      html += '<div class="draft-region">';
      html += '<h4>' + region + '</h4>';
      html += '<div class="team-grid">';
      for (var i = 0; i < byRegion[region].length; i++) {
        var t = byRegion[region][i];
        html += '<button class="team-pick-btn" onclick="Draft.makePick(\'' + t.key + '\')">';
        html += '<span class="team-seed">(' + t.team.seed + ')</span> ' + t.team.name;
        html += '</button>';
      }
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Export area
    html += '<pre id="draft-export" class="draft-export" style="display:none;"></pre>';

    container.innerHTML = html;
  }

  function renderCompletedDraft(container) {
    var html = '<div class="draft-section">';
    html += '<h3>Draft Complete</h3>';

    CONFIG.players.forEach(function(player) {
      var teams = getTeamsForPlayer(player.id);
      html += '<div class="draft-player-card" style="border-color:' + player.color + '">';
      html += '<div class="draft-player-header" style="background:' + player.color + '">';
      html += player.name + ' (' + player.id + ') -- ' + teams.length + ' teams';
      html += '</div>';
      html += '<div class="draft-player-teams">';
      teams.sort(function(a, b) {
        return (TEAMS[a] ? TEAMS[a].seed : 99) - (TEAMS[b] ? TEAMS[b].seed : 99);
      });
      for (var i = 0; i < teams.length; i++) {
        var t = TEAMS[teams[i]];
        if (!t) continue;
        var elim = State.isTeamEliminated(teams[i]);
        html += '<span class="team-badge' + (elim ? ' eliminated' : '') + '">';
        html += '(' + t.seed + ') ' + t.name;
        html += '</span>';
      }
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function resetDraft() {
    draftOrder = [];
    picks = [];
    isLocked = false;
    State.resetDraft();
    render();
  }

  return {
    init: init,
    randomizeOrder: randomizeOrder,
    makePick: makePick,
    undoPick: undoPick,
    resetDraft: resetDraft,
    render: render
  };
})();
