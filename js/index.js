import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';

function fmtDate(d){ try{ return new Date(d).toLocaleDateString(); }catch{return d||''} }

(async function(){
  const { matches, players, courts } = await loadAll(SHEETS);
  const pName = id => (players.find(p=>p.PlayerID===id)?.PlayerName)||id||'—';
  const cName = id => (courts.find(c=>c.CourtID===id)?.CourtName)||'—';

  const upcoming = matches
    .filter(m => !m.WinnerID)
    .sort((a,b) => (a.Date||'9999-12-31').localeCompare(b.Date||'9999-12-31'))
    .slice(0,3);

  const recent = matches
    .filter(m => m.WinnerID)
    .sort((a,b) => (b.Date||'').localeCompare(a.Date||''))
    .slice(0,3);

  const upDiv = document.getElementById('upcoming');
  upDiv.innerHTML = upcoming.length ? upcoming.map(m=>`
    <a class="link" href="match.html?id=${encodeURIComponent(m.MatchID)}">
      <div class="stat"><span>${pName(m.PlayerAID)} vs ${pName(m.PlayerBID)}</span><b>${fmtDate(m.Date)}</b></div>
      <div class="small">${cName(m.CourtID)} · ${m.ChampionshipID}</div>
    </a>`).join('') : '<div class="small">No upcoming matches</div>';

  const recDiv = document.getElementById('recent');
  recDiv.innerHTML = recent.length ? recent.map(m=>`
    <a class="link" href="match.html?id=${encodeURIComponent(m.MatchID)}">
      <div class="stat"><span>${pName(m.PlayerAID)} <span class="pill">${m.ScoreString||''}</span> ${pName(m.PlayerBID)}</span><b>${fmtDate(m.Date)}</b></div>
      <div class="small">${cName(m.CourtID)} · ${m.ChampionshipID}</div>
    </a>`).join('') : '<div class="small">No recent results</div>';
})();
