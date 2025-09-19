import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $, getParam } from './utils.js';

(async function(){
const pid = getParam('id');
const { players, matches, courts } = await loadAll(SHEETS);
const p = players.find(x=>x.PlayerID===pid); if(!p){ $('#name').textContent='Not found'; return; }
$('#name').textContent = p.PlayerName;

const surfaceMap = Object.fromEntries(courts.map(c=>[c.CourtID,c.Surface]));
matches.forEach(m=>m._Surface=surfaceMap[m.CourtID]||'Unknown');

const my = matches.filter(m=>m.PlayerAID===pid||m.PlayerBID===pid);
let wins=0,losses=0, setsDiff=0,gamesDiff=0,pointsDiff=0, cleanW=0, cleanL=0;
let durAll=[], durHome=[], durAway=[]; let surfAgg={};

for(const m of my){
if(!m.WinnerID) continue;
const asA=m.PlayerAID===pid;
const myGames = asA?+m.GamesWonA:+m.GamesWonB; const opGames = asA?+m.GamesWonB:+m.GamesWonA;
const mySets = asA?+m.SetsWonA:+m.SetsWonB; const opSets = asA?+m.SetsWonB:+m.SetsWonA;
const myPts = asA?+m.PointsWonA:+m.PointsWonB; const opPts = asA?+m.PointsWonB:+m.PointsWonA;

if(m.WinnerID===pid) wins++; else losses++;
setsDiff += (mySets-opSets); gamesDiff += (myGames-opGames); pointsDiff += (myPts-opPts);
if(opGames===0) cleanW++; if(myGames===0) cleanL++;

const d=+m.DurationMinutes||0; if(d>0){ durAll.push(d); ((m.Venue||'').toLowerCase()==='home'?durHome:durAway).push(d); }
const s=m._Surface; (surfAgg[s]=surfAgg[s]||{matches:0,wins:0}); surfAgg[s].matches++; if(m.WinnerID===pid) surfAgg[s].wins++;
}
const played=wins+losses; const winPct=played? (wins/played*100).toFixed(1)+'%':'—';
const avg=(arr)=>arr.length? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(0)+'m':'—';

$('#overview').innerHTML = `
<div class="list">
<div class="stat"><span>Record</span><b>${wins}-${losses}</b></div>
<div class="stat"><span>Win %</span><b>${winPct}</b></div>
<div class="stat"><span>Sets Δ</span><b>${setsDiff}</b></div>
<div class="stat"><span>Games Δ</span><b>${gamesDiff}</b></div>
<div class="stat"><span>Points Δ</span><b>${pointsDiff}</b></div>
<div class="stat"><span>Clean sweeps</span><b>${cleanW}</b></div>
<div class="stat"><span>Clean losses</span><b>${cleanL}</b></div>
<div class="stat"><span>Fastest serve</span><b>${p.FastestServeKph||'—'} kph</b></div>
</div>`;

$('#splits').innerHTML = `
<h3>Average Match Time</h3>
<div class="list">
<div class="stat"><span>Overall</span><b>${avg(durAll)}</b></div>
<div class="stat"><span>Home</span><b>${avg(durHome)}</b></div>
<div class="stat"><span>Away</span><b>${avg(durAway)}</b></div>
</div>`;

$('#surfaces').innerHTML = `<h3>By Surface</h3>` + Object.entries(surfAgg).map(([k,v])=>{
const w=v.wins, pl=v.matches, pct=pl? (w/pl*100).toFixed(1)+'%':'—';
return `<div class="stat"><span>${k}</span><b>${w}-${pl-w} (${pct})</b></div>`;
}).join('');

// Recent (last 5 completed)
const completed = my.filter(m=>m.WinnerID).sort((a,b)=>new Date(b.Date)-new Date(a.Date)).slice(0,5);
$('#recent').innerHTML = `<h3>Recent (last 5)</h3>` + completed.map(m=>{
const vs = (m.PlayerAID===pid)? m.PlayerBID : m.PlayerAID;
return `<div class="stat"><span>vs ${vs}</span><b>${m.ScoreString||''}</b></div>`;
}).join('');
})();