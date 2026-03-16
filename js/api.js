// api.js -- ESPN scoreboard fetch, response normalization, polling logic

var API = (function() {
  var pollTimer = null;
  var POLL_ACTIVE = 5 * 60 * 1000;   // 5 min during games
  var POLL_IDLE = 30 * 60 * 1000;    // 30 min otherwise
  var isFetching = false;

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    fetchScores();
    pollTimer = setInterval(function() {
      fetchScores();
    }, POLL_IDLE);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function fetchScores(callback) {
    if (isFetching) return;
    isFetching = true;

    updateStatus('Fetching...');

    // Get today's date and nearby dates for tournament coverage
    var dates = getTournamentDates();
    var completed = 0;
    var hasLive = false;

    dates.forEach(function(date) {
      var url = '/.netlify/functions/ncaa-proxy?date=' + date;

      fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.events) {
            var liveFound = processEvents(data.events);
            if (liveFound) hasLive = true;
          }
          completed++;
          if (completed >= dates.length) {
            isFetching = false;
            var state = State.get();
            state.cache.lastFetch = new Date().toISOString();
            State.save();
            updateStatus(hasLive ? 'Live' : 'Updated');
            adjustPollRate(hasLive);
            Dashboard.render();
            BracketView.render();
            if (callback) callback();
          }
        })
        .catch(function(err) {
          console.error('API fetch error:', err);
          completed++;
          if (completed >= dates.length) {
            isFetching = false;
            updateStatus('Error');
            if (callback) callback();
          }
        });
    });
  }

  function processEvents(events) {
    var hasLive = false;

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var competition = event.competitions && event.competitions[0];
      if (!competition) continue;

      // Match ESPN teams to our bracket
      var competitors = competition.competitors;
      if (!competitors || competitors.length !== 2) continue;

      var espnTeam1 = matchESPNTeam(competitors[0]);
      var espnTeam2 = matchESPNTeam(competitors[1]);
      if (!espnTeam1 && !espnTeam2) continue;

      // Find the matching game in our bracket
      var gameId = findGame(espnTeam1, espnTeam2);
      if (!gameId) continue;

      var statusType = event.status && event.status.type ? event.status.type.name : '';
      var score1 = parseInt(competitors[0].score) || 0;
      var score2 = parseInt(competitors[1].score) || 0;

      // Normalize to match our bracket's team order
      var teams = State.getGameTeams(gameId);
      var s1 = score1, s2 = score2;
      if (teams.team1 === espnTeam2) {
        s1 = score2;
        s2 = score1;
      }

      if (statusType === 'STATUS_FINAL') {
        var winner = s1 > s2 ? teams.team1 : teams.team2;
        State.setGameResult(gameId, winner, s1, s2, false);
      } else if (statusType === 'STATUS_IN_PROGRESS') {
        hasLive = true;
        State.setGameStatus(gameId, 'in_progress', s1, s2);
      }
    }

    return hasLive;
  }

  function matchESPNTeam(competitor) {
    var teamData = competitor.team;
    if (!teamData) return null;

    var espnId = teamData.id;
    if (ESPN_TEAM_MAP[espnId]) return ESPN_TEAM_MAP[espnId];

    // Fallback: try matching by name
    var name = (teamData.displayName || teamData.name || '').toLowerCase();
    var abbrev = (teamData.abbreviation || '').toLowerCase();
    var keys = Object.keys(TEAMS);

    for (var i = 0; i < keys.length; i++) {
      var t = TEAMS[keys[i]];
      var tName = t.name.toLowerCase();
      if (tName === name || keys[i] === abbrev || name.indexOf(tName) !== -1) {
        // Cache the mapping for future lookups
        ESPN_TEAM_MAP[espnId] = keys[i];
        return keys[i];
      }
    }

    return null;
  }

  function findGame(team1, team2) {
    if (!team1 && !team2) return null;
    var state = State.get();
    var gameKeys = Object.keys(BRACKET);

    for (var i = 0; i < gameKeys.length; i++) {
      var teams = State.getGameTeams(gameKeys[i]);
      if (!teams.team1 || !teams.team2) continue;

      if ((teams.team1 === team1 && teams.team2 === team2) ||
          (teams.team1 === team2 && teams.team2 === team1)) {
        return gameKeys[i];
      }
    }
    return null;
  }

  function getTournamentDates() {
    // Return today's date and yesterday's (to catch late games)
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return [formatDate(today), formatDate(yesterday)];
  }

  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + m + day;
  }

  function adjustPollRate(hasLive) {
    if (pollTimer) clearInterval(pollTimer);
    var rate = hasLive ? POLL_ACTIVE : POLL_IDLE;
    pollTimer = setInterval(function() {
      fetchScores();
    }, rate);
  }

  function updateStatus(text) {
    var el = document.getElementById('last-updated');
    if (el) {
      if (text === 'Live') {
        el.innerHTML = '<span class="status-live">LIVE</span>';
      } else if (text === 'Fetching...') {
        el.textContent = 'Updating...';
      } else if (text === 'Error') {
        el.textContent = 'Update failed';
      } else {
        var state = State.get();
        var last = state.cache.lastFetch;
        if (last) {
          var d = new Date(last);
          var mins = Math.floor((Date.now() - d.getTime()) / 60000);
          el.textContent = mins < 1 ? 'Just updated' : mins + ' min ago';
        }
      }
    }
  }

  return {
    startPolling: startPolling,
    stopPolling: stopPolling,
    fetchScores: fetchScores
  };
})();
