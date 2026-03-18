// api.js -- ESPN scoreboard API fetch, team matching, polling

var API = (function() {
  var pollTimer = null;
  var POLL_ACTIVE = 3 * 60 * 1000;   // 3 min during live games
  var POLL_IDLE = 15 * 60 * 1000;    // 15 min otherwise
  var isFetching = false;

  // Comprehensive name/abbreviation mapping to our internal team keys
  // ESPN uses various formats: abbreviation, shortDisplayName, displayName, location
  var NAME_MAP = {
    // East
    'duke': 'duke', 'duk': 'duke', 'duke blue devils': 'duke',
    'siena': 'siena', 'sie': 'siena', 'siena saints': 'siena',
    'ohio state': 'ohio-st', 'osu': 'ohio-st', 'ohio st': 'ohio-st', 'ohio state buckeyes': 'ohio-st',
    'tcu': 'tcu', 'tcu horned frogs': 'tcu',
    "st. john's": 'st-johns', 'st johns': 'st-johns', 'sjn': 'st-johns', 'sju': 'st-johns', "saint john's": 'st-johns', "st. john's red storm": 'st-johns',
    'northern iowa': 'northern-iowa', 'uni': 'northern-iowa', 'northern iowa panthers': 'northern-iowa',
    'kansas': 'kansas', 'kan': 'kansas', 'ku': 'kansas', 'kansas jayhawks': 'kansas',
    'cal baptist': 'cal-baptist', 'cbu': 'cal-baptist', 'california baptist': 'cal-baptist', 'cal baptist lancers': 'cal-baptist',
    'louisville': 'louisville', 'lou': 'louisville', 'louisville cardinals': 'louisville',
    'south florida': 'south-florida', 'usf': 'south-florida', 'south florida bulls': 'south-florida',
    'michigan state': 'michigan-st', 'msu': 'michigan-st', 'mich st': 'michigan-st', 'michigan st': 'michigan-st', 'michigan state spartans': 'michigan-st',
    'north dakota state': 'north-dakota-st', 'ndsu': 'north-dakota-st', 'n dakota st': 'north-dakota-st', 'north dakota st': 'north-dakota-st',
    'ucla': 'ucla', 'ucla bruins': 'ucla',
    'ucf': 'ucf', 'ucf knights': 'ucf',
    'uconn': 'uconn', 'conn': 'uconn', 'connecticut': 'uconn', 'connecticut huskies': 'uconn',
    'furman': 'furman', 'fur': 'furman', 'furman paladins': 'furman',
    // West
    'arizona': 'arizona', 'ariz': 'arizona', 'ari': 'arizona', 'arizona wildcats': 'arizona',
    'liu': 'liu', 'long island': 'liu', 'long island university': 'liu',
    'villanova': 'villanova', 'vill': 'villanova', 'nova': 'villanova', 'villanova wildcats': 'villanova',
    'utah state': 'utah-st', 'usu': 'utah-st', 'utah st': 'utah-st', 'utah state aggies': 'utah-st',
    'wisconsin': 'wisconsin', 'wis': 'wisconsin', 'wisc': 'wisconsin', 'wisconsin badgers': 'wisconsin',
    'high point': 'high-point', 'hpu': 'high-point', 'high point panthers': 'high-point',
    'arkansas': 'arkansas', 'ark': 'arkansas', 'arkansas razorbacks': 'arkansas',
    'hawaii': 'hawaii', 'haw': 'hawaii', "hawai'i": 'hawaii', 'hawaii rainbow warriors': 'hawaii',
    'byu': 'byu', 'brigham young': 'byu', 'byu cougars': 'byu',
    'gonzaga': 'gonzaga', 'gonz': 'gonzaga', 'gon': 'gonzaga', 'gonzaga bulldogs': 'gonzaga',
    'kennesaw state': 'kennesaw-st', 'ksu': 'kennesaw-st', 'kennesaw st': 'kennesaw-st',
    'miami': 'miami', 'mia': 'miami', 'miami hurricanes': 'miami', 'miami (fl)': 'miami',
    'missouri': 'missouri', 'miz': 'missouri', 'mou': 'missouri', 'missouri tigers': 'missouri',
    'purdue': 'purdue', 'pur': 'purdue', 'purdue boilermakers': 'purdue',
    'queens': 'queens', 'que': 'queens', 'queens royals': 'queens',
    // South
    'florida': 'florida', 'fla': 'florida', 'florida gators': 'florida',
    'clemson': 'clemson', 'clem': 'clemson', 'clemson tigers': 'clemson',
    'iowa': 'iowa', 'iowa hawkeyes': 'iowa',
    'vanderbilt': 'vanderbilt', 'van': 'vanderbilt', 'vandy': 'vanderbilt', 'vanderbilt commodores': 'vanderbilt',
    'mcneese': 'mcneese', 'mcn': 'mcneese', 'mcneese state': 'mcneese', 'mcneese cowboys': 'mcneese',
    'nebraska': 'nebraska', 'neb': 'nebraska', 'nebraska cornhuskers': 'nebraska',
    'troy': 'troy', 'troy trojans': 'troy',
    'north carolina': 'unc', 'unc': 'unc', 'nc': 'unc', 'north carolina tar heels': 'unc',
    'vcu': 'vcu', 'virginia commonwealth': 'vcu', 'vcu rams': 'vcu',
    'illinois': 'illinois', 'ill': 'illinois', 'illinois fighting illini': 'illinois',
    'penn': 'penn', 'pennsylvania': 'penn', 'penn quakers': 'penn',
    "saint mary's": 'saint-marys', "st. mary's": 'saint-marys', 'smr': 'saint-marys', 'saint marys': 'saint-marys', "saint mary's gaels": 'saint-marys',
    'texas a&m': 'texas-am', 'tam': 'texas-am', 'texas am': 'texas-am', 'texas a&m aggies': 'texas-am',
    'houston': 'houston', 'hou': 'houston', 'houston cougars': 'houston',
    'idaho': 'idaho', 'ida': 'idaho', 'idaho vandals': 'idaho',
    // Midwest
    'michigan': 'michigan', 'mich': 'michigan', 'michigan wolverines': 'michigan',
    'georgia': 'georgia', 'uga': 'georgia', 'ga': 'georgia', 'georgia bulldogs': 'georgia',
    'st. louis': 'st-louis', 'slu': 'st-louis', 'saint louis': 'st-louis', 'st louis': 'st-louis', 'saint louis billikens': 'st-louis',
    'texas tech': 'texas-tech', 'ttu': 'texas-tech', 'texas tech red raiders': 'texas-tech',
    'akron': 'akron', 'akr': 'akron', 'akron zips': 'akron',
    'alabama': 'alabama', 'ala': 'alabama', 'bama': 'alabama', 'alabama crimson tide': 'alabama',
    'hofstra': 'hofstra', 'hof': 'hofstra', 'hofstra pride': 'hofstra',
    'tennessee': 'tennessee', 'tenn': 'tennessee', 'ten': 'tennessee', 'tennessee volunteers': 'tennessee',
    'virginia': 'virginia', 'uva': 'virginia', 'va': 'virginia', 'virginia cavaliers': 'virginia',
    'wright state': 'wright-st', 'wsu': 'wright-st', 'wright st': 'wright-st',
    'kentucky': 'kentucky', 'ken': 'kentucky', 'uk': 'kentucky', 'kentucky wildcats': 'kentucky',
    'santa clara': 'santa-clara', 'scu': 'santa-clara', 'santa clara broncos': 'santa-clara',
    'iowa state': 'iowa-st', 'isu': 'iowa-st', 'iowa st': 'iowa-st', 'iowa state cyclones': 'iowa-st',
    'tennessee state': 'tennessee-st', 'tsu': 'tennessee-st', 'tennessee st': 'tennessee-st',
    // First Four / play-in teams
    'texas': 'texas-nc-st', 'nc state': 'texas-nc-st', 'texas longhorns': 'texas-nc-st', 'nc state wolfpack': 'texas-nc-st',
    'prairie view': 'prairie-view-lehigh', 'lehigh': 'prairie-view-lehigh', 'prairie view a&m': 'prairie-view-lehigh',
    'umbc': 'umbc-howard', 'howard': 'umbc-howard', 'umbc retrievers': 'umbc-howard', 'howard bison': 'umbc-howard',
    'miami (oh)': 'miami-oh-smu', 'miami ohio': 'miami-oh-smu', 'smu': 'miami-oh-smu', 'miami redhawks': 'miami-oh-smu', 'smu mustangs': 'miami-oh-smu'
  };

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    fetchScores();
    pollTimer = setInterval(function() { fetchScores(); }, POLL_IDLE);
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function fetchScores(callback) {
    if (isFetching) return;
    isFetching = true;
    updateStatus('Fetching...');

    var dates = getTournamentDates();
    var completed = 0;
    var hasLive = false;

    for (var d = 0; d < dates.length; d++) {
      (function(date) {
        var url = '/.netlify/functions/ncaa-proxy?date=' + date;
        fetch(url)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.events) {
              var liveFound = processEvents(data.events);
              if (liveFound) hasLive = true;
            }
            completed++;
            if (completed >= dates.length) finishFetch(hasLive, callback);
          })
          .catch(function(err) {
            console.error('API fetch error for ' + date + ':', err);
            completed++;
            if (completed >= dates.length) finishFetch(hasLive, callback);
          });
      })(dates[d]);
    }
  }

  function finishFetch(hasLive, callback) {
    isFetching = false;
    var state = State.get();
    state.cache.lastFetch = new Date().toISOString();
    State.save();
    updateStatus(hasLive ? 'Live' : 'Updated');
    adjustPollRate(hasLive);
    Dashboard.render();
    BracketView.render();
    App.refreshScores();
    if (callback) callback();
  }

  function processEvents(events) {
    var hasLive = false;

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var competition = event.competitions && event.competitions[0];
      if (!competition) continue;

      var competitors = competition.competitors;
      if (!competitors || competitors.length !== 2) continue;

      // ESPN puts home team first (homeAway === 'home')
      var home = competitors[0].homeAway === 'home' ? competitors[0] : competitors[1];
      var away = competitors[0].homeAway === 'away' ? competitors[0] : competitors[1];

      var team1Key = matchESPNTeam(competitors[0]);
      var team2Key = matchESPNTeam(competitors[1]);

      if (!team1Key && !team2Key) {
        // Could be a play-in (First Four) game with teams not in our bracket
        var n1 = competitors[0].team ? (competitors[0].team.displayName || competitors[0].team.name || '') : '?';
        var n2 = competitors[1].team ? (competitors[1].team.displayName || competitors[1].team.name || '') : '?';
        var piStatus = event.status && event.status.type ? event.status.type.name : '';
        var piDetail = event.status && event.status.type ? (event.status.type.shortDetail || '') : '';
        var piStartTime = event.date || '';
        var piScore1 = parseInt(competitors[0].score) || 0;
        var piScore2 = parseInt(competitors[1].score) || 0;

        // Check if this looks like a tournament game (First Four)
        if (n1 !== '?' && n2 !== '?') {
          var piGame = {
            team1Name: n1, team2Name: n2,
            score1: piScore1, score2: piScore2,
            startTime: piStartTime, statusDetail: piDetail,
            status: piStatus === 'STATUS_FINAL' ? 'final' : (piStatus === 'STATUS_IN_PROGRESS' ? 'in_progress' : 'scheduled'),
            winner: null, seed1: '', seed2: ''
          };
          if (competitors[0].curatedRank) piGame.seed1 = competitors[0].curatedRank.current || '';
          if (competitors[1].curatedRank) piGame.seed2 = competitors[1].curatedRank.current || '';
          if (piStatus === 'STATUS_FINAL') {
            piGame.winner = piScore1 > piScore2 ? 1 : 2;
          }
          if (piStatus === 'STATUS_IN_PROGRESS') hasLive = true;
          addPlayInGame(piGame);
        }
        continue;
      }

      var gameId = findGame(team1Key, team2Key);
      if (!gameId) {
        // This matched one or both teams but didn't find a bracket game
        // Could be a First Four game for a play-in slot team
        var ffn1 = competitors[0].team ? (competitors[0].team.displayName || competitors[0].team.name || '') : '?';
        var ffn2 = competitors[1].team ? (competitors[1].team.displayName || competitors[1].team.name || '') : '?';
        var ffStatus = event.status && event.status.type ? event.status.type.name : '';
        var ffDetail = event.status && event.status.type ? (event.status.type.shortDetail || '') : '';
        var ffStartTime = event.date || '';
        var ffScore1 = parseInt(competitors[0].score) || 0;
        var ffScore2 = parseInt(competitors[1].score) || 0;

        var ffGame = {
          team1Name: ffn1, team2Name: ffn2,
          score1: ffScore1, score2: ffScore2,
          startTime: ffStartTime, statusDetail: ffDetail,
          status: ffStatus === 'STATUS_FINAL' ? 'final' : (ffStatus === 'STATUS_IN_PROGRESS' ? 'in_progress' : 'scheduled'),
          winner: null, seed1: '', seed2: ''
        };
        if (competitors[0].curatedRank) ffGame.seed1 = competitors[0].curatedRank.current || '';
        if (competitors[1].curatedRank) ffGame.seed2 = competitors[1].curatedRank.current || '';
        if (ffStatus === 'STATUS_FINAL') {
          ffGame.winner = ffScore1 > ffScore2 ? 1 : 2;
        }
        if (ffStatus === 'STATUS_IN_PROGRESS') hasLive = true;
        addPlayInGame(ffGame);
        continue;
      }

      var statusType = event.status && event.status.type ? event.status.type.name : '';
      var statusDetail = event.status && event.status.type ? (event.status.type.shortDetail || '') : '';
      var startTime = event.date || '';
      var score1 = parseInt(competitors[0].score) || 0;
      var score2 = parseInt(competitors[1].score) || 0;

      // Normalize scores to match our bracket's team order
      var bracketTeams = State.getGameTeams(gameId);
      var s1, s2;
      if (bracketTeams.team1 === team1Key) {
        s1 = score1; s2 = score2;
      } else {
        s1 = score2; s2 = score1;
      }

      if (statusType === 'STATUS_FINAL') {
        var winner = s1 > s2 ? bracketTeams.team1 : bracketTeams.team2;
        State.setGameResult(gameId, winner, s1, s2, false);
        State.setGameExtra(gameId, startTime, statusDetail);
      } else if (statusType === 'STATUS_IN_PROGRESS') {
        hasLive = true;
        State.setGameStatus(gameId, 'in_progress', s1, s2);
        State.setGameExtra(gameId, startTime, statusDetail);
      } else if (statusType === 'STATUS_SCHEDULED') {
        // Store the start time even for scheduled games
        State.setGameExtra(gameId, startTime, statusDetail);
      }
    }

    return hasLive;
  }

  function addPlayInGame(game) {
    var state = State.get();
    if (!state.playInGames) state.playInGames = [];
    // Deduplicate by team names
    var key = game.team1Name + ' vs ' + game.team2Name;
    var found = false;
    for (var i = 0; i < state.playInGames.length; i++) {
      var existing = state.playInGames[i].team1Name + ' vs ' + state.playInGames[i].team2Name;
      var existingReverse = state.playInGames[i].team2Name + ' vs ' + state.playInGames[i].team1Name;
      if (existing === key || existingReverse === key) {
        state.playInGames[i] = game;
        found = true;
        break;
      }
    }
    if (!found) state.playInGames.push(game);
    State.save();
  }

  function matchESPNTeam(competitor) {
    var teamData = competitor.team;
    if (!teamData) return null;

    var espnId = String(teamData.id);

    // Check cached ESPN ID mapping first
    if (ESPN_TEAM_MAP[espnId]) return ESPN_TEAM_MAP[espnId];

    // Try all available name fields from ESPN
    var candidates = [
      (teamData.abbreviation || '').toLowerCase(),
      (teamData.shortDisplayName || '').toLowerCase(),
      (teamData.displayName || '').toLowerCase(),
      (teamData.name || '').toLowerCase(),
      (teamData.location || '').toLowerCase()
    ];

    // Try direct lookup in NAME_MAP
    for (var c = 0; c < candidates.length; c++) {
      if (candidates[c] && NAME_MAP[candidates[c]]) {
        ESPN_TEAM_MAP[espnId] = NAME_MAP[candidates[c]];
        return NAME_MAP[candidates[c]];
      }
    }

    // Try partial match against our team names
    var displayName = (teamData.displayName || teamData.name || '').toLowerCase();
    var keys = Object.keys(TEAMS);
    for (var i = 0; i < keys.length; i++) {
      var tName = TEAMS[keys[i]].name.toLowerCase();
      if (displayName === tName || displayName.indexOf(tName) !== -1 || tName.indexOf(displayName) !== -1) {
        ESPN_TEAM_MAP[espnId] = keys[i];
        return keys[i];
      }
    }

    // Try matching the key itself against abbreviation
    var abbr = (teamData.abbreviation || '').toLowerCase();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === abbr) {
        ESPN_TEAM_MAP[espnId] = keys[i];
        return keys[i];
      }
    }

    return null;
  }

  function findGame(team1, team2) {
    if (!team1 && !team2) return null;
    var gameKeys = Object.keys(BRACKET);

    for (var i = 0; i < gameKeys.length; i++) {
      var teams = State.getGameTeams(gameKeys[i]);
      if (!teams.team1 || !teams.team2) continue;

      if ((teams.team1 === team1 && teams.team2 === team2) ||
          (teams.team1 === team2 && teams.team2 === team1)) {
        return gameKeys[i];
      }
    }

    // Also try matching with just one team (in case the other didn't match)
    if (team1 && !team2) {
      for (var i = 0; i < gameKeys.length; i++) {
        var teams = State.getGameTeams(gameKeys[i]);
        if (teams.team1 === team1 || teams.team2 === team1) return gameKeys[i];
      }
    }
    if (team2 && !team1) {
      for (var i = 0; i < gameKeys.length; i++) {
        var teams = State.getGameTeams(gameKeys[i]);
        if (teams.team1 === team2 || teams.team2 === team2) return gameKeys[i];
      }
    }

    return null;
  }

  function getTournamentDates() {
    // Cover all active tournament dates
    // First Four: Mar 17-18, R64: Mar 20-21, R32: Mar 22-23
    // S16: Mar 27-28, E8: Mar 29-30, F4: Apr 5, Champ: Apr 7
    var today = new Date();
    var dates = [];

    // Always include today and yesterday
    dates.push(formatDate(today));
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    dates.push(formatDate(yesterday));

    // During tournament windows, also include the day before yesterday
    // to catch any games we might have missed
    var twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    dates.push(formatDate(twoDaysAgo));

    // Remove duplicates
    var unique = {};
    var result = [];
    for (var i = 0; i < dates.length; i++) {
      if (!unique[dates[i]]) {
        unique[dates[i]] = true;
        result.push(dates[i]);
      }
    }
    return result;
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
    pollTimer = setInterval(function() { fetchScores(); }, rate);
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
