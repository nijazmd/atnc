import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $ } from './utils.js';
import { aggregatePlayerPoints } from './ranking.js';

(async function(){
const { teams, players, matches } = await loadAll(SHEETS);
const playerPts = Object.fromEntries(players.map(p=>[p.PlayerID, aggregatePlayerPoints(p.PlayerID, matches).pts]));
const grouped = {};
for(const p of players){ if(!p.TeamID) continue; (grouped[p.TeamID]=grouped[p.TeamID]||[]).push(p); }
const rows = teams.map(t=>{
const roster = grouped[t.TeamID]||[];
const teamPts = roster.reduce((a,p)=>a+(playerPts[p.PlayerID]||0),0);
return { ...t, teamPts, roster };
}).sort((a,b)=>b.teamPts-a.teamPts);

$('#teams').innerHTML = rows.map(t=>`
<div class="card">
<div class="flex"><h3 style="margin:0">${t.TeamName}</h3><span class="pill">${t.teamPts} pts</span></div>
${ (t.roster||[]).map(p=>`<div class="stat"><span>${p.PlayerName}</span><b>${playerPts[p.PlayerID]||0} pts</b></div>`).join('') }
</div>
`).join('');
})();