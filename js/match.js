// /js/match.js
import { SHEETS, APPS_SCRIPT_EXEC } from './constants.js';
import { loadAll } from './loader.js';
import { $, getParam } from './utils.js';
import { deriveFromScoreString } from './score-utils.js';

(async function () {
  const id    = getParam('id');
  const cid   = getParam('cid');
  const round = getParam('round');
  const no    = getParam('no');

  const { matches, players, courts } = await loadAll(SHEETS);

  // Locate match by MatchID OR by (ChampionshipID, Round, MatchNo)
  let match = matches.find(m => m.MatchID === id);
  if (!match && cid && round && no) {
    match = matches.find(m => m.ChampionshipID === cid && m.Round === round && m.MatchNo === no);
  }
  if (!match) {
    $('#summary')?.insertAdjacentHTML('beforeend', '<div class="small">Match not found</div>');
    return;
  }

  // Player objects (fallback to IDs if no record)
  const A = players.find(p => p.PlayerID === match.PlayerAID) || { PlayerName: match.PlayerAID, PlayerID: match.PlayerAID };
  const B = players.find(p => p.PlayerID === match.PlayerBID) || { PlayerName: match.PlayerBID, PlayerID: match.PlayerBID };
  $('#matchTitle').textContent = `${A.PlayerName} vs ${B.PlayerName}`;

  // Helpers
  const courtById = Object.fromEntries(courts.map(c => [c.CourtID, c]));
  const courtName = (id) => courtById[id]?.CourtName || '—';

  // ===== Summary =====
  $('#summary').innerHTML = `
    <div class="list">
      <div class="stat"><span>Score</span><b>${match.ScoreString || '—'}</b></div>
      <div class="stat"><span>Venue</span><b>${match.VenueName || match.Venue || '—'}</b></div>
      <div class="stat"><span>Court</span><b>${courtName(match.CourtID)}</b></div>
      <div class="stat"><span>TB pts</span><b>${(+match.TieBreakPointsWonA || 0)} - ${(+match.TieBreakPointsWonB || 0)}</b></div>
      <div class="stat"><span>Duration</span><b>${(+match.DurationMinutes || 0) ? (+match.DurationMinutes) + ' min' : '—'}</b></div>
    </div>
  `;

  // ===== Head to Head (overall + last 3) =====
  const between = matches
    .filter(m =>
      (m.PlayerAID === A.PlayerID && m.PlayerBID === B.PlayerID) ||
      (m.PlayerAID === B.PlayerID && m.PlayerBID === A.PlayerID)
    )
    .filter(m => m.WinnerID);

  const wA = between.filter(m => m.WinnerID === A.PlayerID).length;
  const wB = between.filter(m => m.WinnerID === B.PlayerID).length;
  const last3 = between.sort((x, y) => new Date(y.Date) - new Date(x.Date)).slice(0, 3);

  const linkP = (p) => `<a class="link" href="player-single.html?id=${encodeURIComponent(p.PlayerID)}">${p.PlayerName}</a>`;
  $('#h2h').innerHTML = `
    <h3>Head to Head</h3>
    <div class="stat"><span>${linkP(A)}</span><b>${wA}</b></div>
    <div class="stat"><span>${linkP(B)}</span><b>${wB}</b></div>
    <div class="small">Last 3 meetings:</div>
    ${
      last3.length
        ? last3.map(m => `<div class="stat"><span>${m.Date || ''}</span><b>${m.ScoreString || ''}</b></div>`).join('')
        : '<div class="small">No history</div>'
    }
  `;

  // ===== Predicted duration (avg Home of A + avg Away of B) / 2 =====
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const aAll = matches.filter(m => (m.PlayerAID === A.PlayerID || m.PlayerBID === A.PlayerID) && m.WinnerID);
  const bAll = matches.filter(m => (m.PlayerAID === B.PlayerID || m.PlayerBID === B.PlayerID) && m.WinnerID);
  const aHomeDur = aAll.filter(m => (m.Venue || '').toLowerCase() === 'home').map(m => +m.DurationMinutes || 0).filter(Boolean);
  const bAwayDur = bAll.filter(m => (m.Venue || '').toLowerCase() !== 'home').map(m => +m.DurationMinutes || 0).filter(Boolean);
  const pred = Math.round((avg(aHomeDur.length ? aHomeDur : [40]) + avg(bAwayDur.length ? bAwayDur : [40])) / 2);
  $('#predict').innerHTML = `<h3>Predicted Duration</h3><div class="stat"><span>Estimated</span><b>${pred ? pred + ' min' : '—'}</b></div>`;

  // ===== Form (Add / Update) =====
  const homeName = (players.find(p => p.PlayerID === match.HomePlayerID)?.PlayerName) || match.HomePlayerID;
  const homeDefault = (players.find(p => p.PlayerID === match.HomePlayerID)?.HomeStadium) || '';
  const optionsCourts = courts.map(c => `<option value="${c.CourtID}">${c.CourtName} (${c.Surface})</option>`).join('');

  $('#form').innerHTML = `
    <h3>Add / Update Result</h3>

    <div class="row">
      <label>Venue (relative to Home: ${homeName})</label>
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

    <!-- New: per-set numeric inputs (OTP-style auto-advance) -->
    <div class="row">
      <label>Score (per set)</label>
      <div class="grid2">
        <input id="s1a" type="number" inputmode="numeric" min="0" max="5" placeholder="A"/>
        <input id="s1b" type="number" inputmode="numeric" min="0" max="5" placeholder="B"/>
      </div>
      <div class="grid2">
        <input id="s2a" type="number" inputmode="numeric" min="0" max="5" placeholder="A"/>
        <input id="s2b" type="number" inputmode="numeric" min="0" max="5" placeholder="B"/>
      </div>
      <div class="grid2">
        <input id="s3a" type="number" inputmode="numeric" min="0" max="5" placeholder="A"/>
        <input id="s3b" type="number" inputmode="numeric" min="0" max="5" placeholder="B"/>
      </div>
      <small class="small">Short sets to 3 (win by 2). Tie-break shows as 4–3.</small>
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

  // Prefill selects & per-set fields
  $('#venue').value    = match.Venue || 'Home';
  $('#court').value    = match.CourtID || courts[0]?.CourtID || '';
  $('#decision').value = match.Decision || 'Normal';
  prefillSets(match.ScoreString);

  // Auto-advance for the 6 per-set inputs (OTP-style)
  ['s1a','s1b','s2a','s2b','s3a','s3b'].forEach((id, idx, all) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '').slice(0, 1);
      if (el.value && all[idx + 1]) document.getElementById(all[idx + 1]).focus();
    });
    el.addEventListener('keydown', (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && !el.value && all[idx - 1]) {
        document.getElementById(all[idx - 1]).focus();
      }
    });
  });

  // Save
  $('#saveBtn').addEventListener('click', async () => {
    try {
      const payload = buildPayloadFromForm(match);
      const ok = await saveMatch(payload);
      if (ok) { alert('Saved'); location.reload(); } else { alert('Saved (verification pending). Refresh to see it.'); }
    } catch (e) {
      // deriveFromScoreString throws on invalid input
    }
  });

  // ===== Helpers (form → payload) =====
  function buildScoreStringFromInputs(){
    const ids = [['s1a','s1b'],['s2a','s2b'],['s3a','s3b']];
    const pairs = ids.map(([a,b]) => ({ a: $('#'+a).value, b: $('#'+b).value }))
                     .filter(p => p.a !== '' && p.b !== '');
    return pairs.map(p => `${+p.a}-${+p.b}`).join(', ');
  }
  function prefillSets(str){
    const sets = (str || '').split(',').map(s => s.trim()).filter(Boolean);
    const pairs = sets.map(s => s.split(/[-:]/).map(x => x.trim()));
    const ids = [['s1a','s1b'],['s2a','s2b'],['s3a','s3b']];
    ids.forEach((pair, i) => {
      const [a, b] = pairs[i] || ['',''];
      const A = document.getElementById(pair[0]);
      const B = document.getElementById(pair[1]);
      if (A) A.value = a || '';
      if (B) B.value = b || '';
    });
  }

  function buildPayloadFromForm(orig) {
    const scoreStr = buildScoreStringFromInputs();
    const parsed = deriveFromScoreString(scoreStr);
    if (!parsed.valid) {
      alert('Invalid score (use short sets to 3; tie-break as 4-3).');
      throw new Error('Invalid score');
    }
    const { setsWonA, setsWonB, gamesWonA, gamesWonB } = parsed;
    const WinnerID = setsWonA > setsWonB ? orig.PlayerAID : orig.PlayerBID;

    const p = {
      mode:            'saveMatch',               // Apps Script handler switch
      MatchID:         orig.MatchID || ('M-' + Date.now()),
      ChampionshipID:  orig.ChampionshipID,
      Round:           orig.Round,
      MatchNo:         orig.MatchNo,
      Date:            orig.Date || new Date().toISOString().slice(0, 10),

      HomePlayerID:    orig.HomePlayerID,
      AwayPlayerID:    orig.AwayPlayerID,
      PlayerAID:       orig.PlayerAID,
      PlayerBID:       orig.PlayerBID,

      Venue:           $('#venue').value,
      VenueName:       $('#venueName').value.trim(),
      CourtID:         $('#court').value,

      ScoreString:     scoreStr,
      Set1_A: '', Set1_B: '', Set2_A: '', Set2_B: '', Set3_A: '', Set3_B: '',

      SetsWonA:        setsWonA,
      SetsWonB:        setsWonB,
      GamesWonA:       gamesWonA,
      GamesWonB:       gamesWonB,

      TieBreakPointsWonA: +$('#tbA').value || 0,
      TieBreakPointsWonB: +$('#tbB').value || 0,

      PointsWonA:      +$('#ptsA').value || 0,
      PointsWonB:      +$('#ptsB').value || 0,
      UnforcedErrorsA: +$('#ueA').value || 0,
      UnforcedErrorsB: +$('#ueB').value || 0,
      FastestServeKphA:+$('#fsA').value || 0,
      FastestServeKphB:+$('#fsB').value || 0,

      WinnerID,
      DurationMinutes: +$('#dur').value || '',
      Decision:        $('#decision').value,
      Notes:           match.Notes || ''
    };
    return p;
  }

  // ===== Save (CORS-safe form POST + optional verification) =====
  async function saveMatch(payload){
    // 1) Send as form POST to Apps Script (avoids CORS)
    await submitViaForm(APPS_SCRIPT_EXEC, payload);

    // 2) Try to verify by reloading the Matches CSV and finding the MatchID
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

      // Convert payload into hidden inputs (x-www-form-urlencoded style)
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = (v === undefined || v === null) ? '' : String(v);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => { form.remove(); resolve(); }, 300);
    });
  }

  // Quote-aware CSV split (for verification)
  function splitCSVLine(line){
    const out=[]; let field='', i=0, inQ=false;
    while(i<line.length){
      const ch=line[i];
      if(inQ){
        if(ch === '"'){
          if(line[i+1] === '"'){ field+='"'; i+=2; }
          else { inQ=false; i++; }
        } else { field+=ch; i++; }
      } else {
        if(ch === '"'){ inQ=true; i++; }
        else if(ch === ','){ out.push(field); field=''; i++; }
        else { field+=ch; i++; }
      }
    }
    out.push(field);
    return out;
  }

  async function verifyByCsv(csvUrl, keyHeader, keyValue) {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res  = await fetch(csvUrl, { cache: 'no-store' });
        const text = await res.text();
        const lines = text.replace(/\r/g,'').split('\n').filter(Boolean);
        if (!lines.length) break;
        const headers = splitCSVLine(lines[0]);
        const idx = headers.indexOf(keyHeader);
        if (idx >= 0) {
          const found = lines.slice(1).some(line => (splitCSVLine(line)[idx] || '').trim() === keyValue);
          if (found) return true;
        }
      } catch (e) { /* ignore and retry */ }
      await sleep(600);
    }
    // Not verified yet; most likely a small propagation delay in Sheets
    return false;
  }
})();
