// /js/match.js
import { SHEETS, APPS_SCRIPT_EXEC } from './constants.js';
import { loadAll } from './loader.js';
import { $, getParam } from './utils.js';
import { deriveFromScoreString } from './score-utils.js';

(async function () {
  const id   = getParam('id');
  const cid  = getParam('cid');
  const round= getParam('round');
  const no   = getParam('no');

  const { matches, brackets, players, courts } = await loadAll(SHEETS);

  // Find the match either by MatchID or by (ChampionshipID, Round, MatchNo)
  let match = matches.find(m => m.MatchID === id);
  if (!match && cid && round && no) {
    match = matches.find(m => m.ChampionshipID === cid && m.Round === round && m.MatchNo === no);
  }
  if (!match) {
    $('#summary')?.insertAdjacentHTML('beforeend', '<div class="small">Match not found</div>');
    return;
  }

  const A = players.find(p => p.PlayerID === match.PlayerAID) || { PlayerName: match.PlayerAID, PlayerID: match.PlayerAID };
  const B = players.find(p => p.PlayerID === match.PlayerBID) || { PlayerName: match.PlayerBID, PlayerID: match.PlayerBID };

  // Title
  $('#matchTitle').textContent = `${A.PlayerName} vs ${B.PlayerName}`;

  // Helpers
  const courtMapById = Object.fromEntries(courts.map(c => [c.CourtID, c]));
  const courtName = (cID) => courtMapById[cID]?.CourtName || '—';

  // Summary (if completed we show score etc.)
  $('#summary').innerHTML = `
    <div class="list">
      <div class="stat"><span>Score</span><b>${match.ScoreString || '—'}</b></div>
      <div class="stat"><span>Venue</span><b>${match.VenueName || match.Venue || '—'}</b></div>
      <div class="stat"><span>Court</span><b>${courtName(match.CourtID)}</b></div>
      <div class="stat"><span>TB pts</span><b>${(+match.TieBreakPointsWonA || 0)} - ${(+match.TieBreakPointsWonB || 0)}</b></div>
      <div class="stat"><span>Duration</span><b>${match.DurationMinutes ? match.DurationMinutes + ' min' : '—'}</b></div>
    </div>
  `;

  // H2H (overall + last 3)
  const between = matches
    .filter(m =>
      (m.PlayerAID === A.PlayerID && m.PlayerBID === B.PlayerID) ||
      (m.PlayerAID === B.PlayerID && m.PlayerBID === A.PlayerID)
    )
    .filter(m => m.WinnerID);

  const wA = between.filter(m => m.WinnerID === A.PlayerID).length;
  const wB = between.filter(m => m.WinnerID === B.PlayerID).length;
  const last3 = between.sort((x, y) => new Date(y.Date) - new Date(x.Date)).slice(0, 3);

  $('#h2h').innerHTML = `
    <h3>Head to Head</h3>
    <div class="stat"><span>${A.PlayerName}</span><b>${wA}</b></div>
    <div class="stat"><span>${B.PlayerName}</span><b>${wB}</b></div>
    <div class="small">Last 3 meetings:</div>
    ${
      last3.length
        ? last3.map(m => `<div class="stat"><span>${m.Date || ''}</span><b>${m.ScoreString || ''}</b></div>`).join('')
        : '<div class="small">No history</div>'
    }
  `;

  // Predicted duration = avg(Home player's past Home durations) + avg(Away player's past Away durations) / 2
  function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
  const allForA = matches.filter(m => (m.PlayerAID === A.PlayerID || m.PlayerBID === A.PlayerID) && m.WinnerID);
  const allForB = matches.filter(m => (m.PlayerAID === B.PlayerID || m.PlayerBID === B.PlayerID) && m.WinnerID);
  const aHomeDur = allForA.filter(m => (m.Venue || '').toLowerCase() === 'home').map(m => +m.DurationMinutes || 0).filter(Boolean);
  const bAwayDur = allForB.filter(m => (m.Venue || '').toLowerCase() !== 'home').map(m => +m.DurationMinutes || 0).filter(Boolean);
  const pred = Math.round((avg(aHomeDur.length ? aHomeDur : [40]) + avg(bAwayDur.length ? bAwayDur : [40])) / 2);
  $('#predict').innerHTML = `<h3>Predicted Duration</h3><div class="stat"><span>Estimated</span><b>${pred ? pred + ' min' : '—'}</b></div>`;

  // Form (Add / Update)
  const homeDefault = (players.find(p => p.PlayerID === match.HomePlayerID)?.HomeStadium) || '';
  const optionsCourts = courts
    .map(c => `<option value="${c.CourtID}">${c.CourtName} (${c.Surface})</option>`)
    .join('');

  $('#form').innerHTML = `
    <h3>Add / Update Result</h3>

    <div class="row">
      <label>Venue</label>
      <select id="venue">
        <option value="Home">Home</option>
        <option value="Away">Away</option>
      </select>
    </div>

    <div class="row">
      <label>Venue Name (stadium)</label>
      <input id="venueName" placeholder="e.g., ${homeDefault}" value="${match.VenueName || homeDefault || ''}"/>
    </div>

    <div class="row">
      <label>Court</label>
      <select id="court">${optionsCourts}</select>
    </div>

    <div class="row">
      <label>Score (sets)</label>
      <input id="score" placeholder="e.g., 3-1, 4-3, 3-0" value="${match.ScoreString || ''}"/>
      <small class="small">Short sets to 3 (win by 2). Tie-break sets appear as 4-3.</small>
    </div>

    <div class="row grid2">
      <div>
        <label>TB points A</label>
        <input id="tbA" type="number" min="0" value="${+match.TieBreakPointsWonA || 0}"/>
      </div>
      <div>
        <label>TB points B</label>
        <input id="tbB" type="number" min="0" value="${+match.TieBreakPointsWonB || 0}"/>
      </div>
    </div>

    <div class="row grid2">
      <div>
        <label>Points Won A</label>
        <input id="ptsA" type="number" min="0" value="${+match.PointsWonA || 0}"/>
      </div>
      <div>
        <label>Points Won B</label>
        <input id="ptsB" type="number" min="0" value="${+match.PointsWonB || 0}"/>
      </div>
    </div>

    <div class="row grid2">
      <div>
        <label>Unforced Errors A</label>
        <input id="ueA" type="number" min="0" value="${+match.UnforcedErrorsA || 0}"/>
      </div>
      <div>
        <label>Unforced Errors B</label>
        <input id="ueB" type="number" min="0" value="${+match.UnforcedErrorsB || 0}"/>
      </div>
    </div>

    <div class="row grid2">
      <div>
        <label>Fastest Serve A (kph)</label>
        <input id="fsA" type="number" min="0" value="${+match.FastestServeKphA || 0}"/>
      </div>
      <div>
        <label>Fastest Serve B (kph)</label>
        <input id="fsB" type="number" min="0" value="${+match.FastestServeKphB || 0}"/>
      </div>
    </div>

    <div class="row">
      <label>Duration (min)</label>
      <input id="dur" type="number" min="1" value="${+match.DurationMinutes || ''}"/>
    </div>

    <div class="row">
      <label>Decision</label>
      <select id="decision">
        <option>Normal</option>
        <option>Retired</option>
        <option>Walkover</option>
      </select>
    </div>

    <button id="saveBtn">Save Result</button>
  `;

  // Prefill selects
  $('#venue').value    = match.Venue || 'Home';
  $('#court').value    = match.CourtID || courts[0]?.CourtID || '';
  $('#decision').value = match.Decision || 'Normal';

  // Save
  $('#saveBtn').addEventListener('click', async () => {
    try {
      const payload = buildPayloadFromForm(match);
      const ok = await saveMatch(payload);
      if (ok) { alert('Saved'); location.reload(); }
      else    { alert('Save failed'); }
    } catch (e) {
      // deriveFromScoreString throws on invalid input
    }
  });

  function buildPayloadFromForm(orig) {
    const parsed = deriveFromScoreString($('#score').value.trim());
    if (!parsed.valid) {
      alert('Invalid score string');
      throw new Error('Invalid score');
    }
    const { setsWonA, setsWonB, gamesWonA, gamesWonB } = parsed;
    const WinnerID = setsWonA > setsWonB ? orig.PlayerAID : orig.PlayerBID;

    const p = {
      // Your Apps Script should route on this:
      mode: 'saveMatch',

      // Identity / indexing
      MatchID:        orig.MatchID,
      ChampionshipID: orig.ChampionshipID,
      Round:          orig.Round,
      MatchNo:        orig.MatchNo,
      Date:           orig.Date || new Date().toISOString().slice(0, 10),

      // Players & venue/court
      HomePlayerID: orig.HomePlayerID,
      AwayPlayerID: orig.AwayPlayerID,
      PlayerAID:    orig.PlayerAID,
      PlayerBID:    orig.PlayerBID,
      Venue:        $('#venue').value,
      VenueName:    $('#venueName').value.trim(),
      CourtID:      $('#court').value,

      // Score & derived
      ScoreString: $('#score').value.trim(),
      Set1_A: '', Set1_B: '', Set2_A: '', Set2_B: '', Set3_A: '', Set3_B: '', // optional per-set fields
      SetsWonA:   setsWonA,
      SetsWonB:   setsWonB,
      GamesWonA:  gamesWonA,
      GamesWonB:  gamesWonB,

      // Stats
      TieBreakPointsWonA: +$('#tbA').value || 0,
      TieBreakPointsWonB: +$('#tbB').value || 0,
      PointsWonA: +$('#ptsA').value || 0,
      PointsWonB: +$('#ptsB').value || 0,
      UnforcedErrorsA: +$('#ueA').value || 0,
      UnforcedErrorsB: +$('#ueB').value || 0,
      FastestServeKphA: +$('#fsA').value || 0,
      FastestServeKphB: +$('#fsB').value || 0,

      WinnerID,
      DurationMinutes: +$('#dur').value || '',
      Decision:        $('#decision').value,
      Notes:           orig.Notes || ''
    };
    return p;
  }

  async function saveMatch(payload) {
    // Ensure we have a MatchID so we can verify later
    if (!payload.MatchID) payload.MatchID = 'M-' + Date.now();
  
    // 1) Submit via a regular HTML form into a hidden iframe (no CORS)
    await submitViaForm(APPS_SCRIPT_EXEC, payload);
  
    // 2) Optional: verify by reloading the Matches CSV and looking for MatchID
    //    (retry a couple of times to allow Sheets write to complete)
    const ok = await verifyByCsv(SHEETS.MATCHES, 'MatchID', String(payload.MatchID));
    return ok;
  }
  
  function submitViaForm(url, fields) {
    return new Promise((resolve) => {
      const sinkName = 'appsScriptSink';
      let iframe = document.querySelector(`iframe[name="${sinkName}"]`);
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = sinkName;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = sinkName;
  
      // Convert payload into hidden inputs (form-encoded)
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = (v === undefined || v === null) ? '' : String(v);
        form.appendChild(input);
      });
  
      document.body.appendChild(form);
      form.submit();
  
      // Give the browser a moment to send, then clean up
      setTimeout(() => { form.remove(); resolve(); }, 300);
    });
  }
  
  async function verifyByCsv(csvUrl, keyHeader, keyValue) {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(csvUrl, { cache: 'no-store' });
        const text = await res.text();
        const rows = text.trim().split('\n').map(r => r.split(','));
        const headers = rows[0] || [];
        const idx = headers.indexOf(keyHeader);
        if (idx >= 0) {
          const found = rows.slice(1).some(r => (r[idx] || '').trim() === keyValue);
          if (found) return true;
        }
      } catch (e) {
        // ignore and retry
      }
      await sleep(600); // brief pause between retries
    }
    // Couldn’t verify yet; the POST still went through, we just didn’t see it in CSV
    return false;
  }
  
  
})();
