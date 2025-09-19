import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $, getParam } from './utils.js';

(async function(){
const id = getParam('id');
const { courts, matches, players } = await loadAll(SHEETS);
const c = courts.find(x=>x.CourtID===id); if(!c){ $('#name').textContent='Not found'; return; }
$('#name').textContent=c.CourtName; $('#meta').innerHTML = `<div class="stat"><span>Venue</span><b>${c.VenueName||'—'}</b></div><div class="stat"><span>Surface</span><b>${c.Surface}</b></div>`;

const here = matches.filter(m=>m.CourtID===id && m.WinnerID);
const tally={};
for(const m of here){ tally[m.WinnerID]=(tally[m.WinnerID]||0)+1; }
const top = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,10);
const name=id=>players.find(p=>p.PlayerID===id)?.PlayerName||id;
$('#best').innerHTML = `<h3>Best Players on this Court</h3>` + top.map(([pid,w])=>`<div class="stat"><span>${name(pid)}</span><b>${w} wins</b></div>`).join('');
})();