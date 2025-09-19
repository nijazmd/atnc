import { SHEETS, ROUND } from './constants.js';
import { loadAll } from './loader.js';
import { $, getParam } from './utils.js';

const roundOrder=[ROUND.R32,ROUND.R16,ROUND.QF,ROUND.SF,ROUND.F];

function chooseDefaultChamp(champs){
  const live = champs.find(c=>/live/i.test(c.Status));
  if (live) return live.ChampionshipID;
  const planned = champs
    .filter(c=>/plan/i.test(c.Status))
    .sort((a,b)=>(a.StartDate||'').localeCompare(b.StartDate||''))[0];
  if (planned) return planned.ChampionshipID;
  const done = champs
    .filter(c=>/comp/i.test(c.Status))
    .sort((a,b)=>(b.EndDate||'').localeCompare(a.EndDate||''))[0];
  return done ? done.ChampionshipID : (champs[0]?.ChampionshipID||'');
}

(async function(){
  const { champs, brackets, matches, players } = await loadAll(SHEETS);

  let cid = getParam('cid');
  if (!cid) cid = chooseDefaultChamp(champs);

  const c = champs.find(x=>x.ChampionshipID===cid) || { Name:'Championship' };
  $('#title').textContent = c.Name || cid;

  // Switcher: list all champs from sheet
  $('#switch').innerHTML = '<h3>All Championships</h3>' + champs.map(x=>`
    <a class="link" href="championship.html?cid=${encodeURIComponent(x.ChampionshipID)}">
      <div class="stat"><span>${x.Name||x.ChampionshipID}</span><b>${x.Status||''}</b></div>
    </a>`).join('');

  // Build a quick lookup for match rows
  const matchKey = (m)=>`${m.ChampionshipID}|${m.Round}|${m.MatchNo}`;
  const mMap = new Map(matches.map(m=>[matchKey(m), m]));
  const pName = id => (players.find(p=>p.PlayerID===id)?.PlayerName)||id||'—';

  // Render bracket by rounds
  const html = roundOrder.map(r=>{
    const slots = brackets
      .filter(b=>b.ChampionshipID===cid && b.Round===r)
      .sort((a,b)=>+a.MatchNo - +b.MatchNo);
    if (!slots.length) return '';
    const rows = slots.map(b=>{
      const m = mMap.get(`${cid}|${r}|${b.MatchNo}`);
      const a = pName(b.PlayerAID), x = pName(b.PlayerBID);
      const score = m?.ScoreString ? ` <span class="pill">${m.ScoreString}</span>` : '';
      const href  = m?.MatchID
        ? `match.html?id=${encodeURIComponent(m.MatchID)}`
        : `match.html?cid=${encodeURIComponent(cid)}&round=${r}&no=${b.MatchNo}`;
      return `<a class="link" href="${href}">
        <div class="stat"><span>#${b.MatchNo} ${a} vs ${x}</span><b>${score||'→'}</b></div>
      </a>`;
    }).join('');
    return `<section class="card"><h3>${r}</h3>${rows}</section>`;
  }).join('');

  $('#bracket').innerHTML = html || `<div class="card">No bracket data</div>`;
})();
