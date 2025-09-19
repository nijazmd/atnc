import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $ } from './utils.js';
import { aggregatePlayerPoints, sortKeysForPlayers } from './ranking.js';

(async function(){
const { players, matches, courts } = await loadAll(SHEETS);
// attach surface to matches
const courtMap = Object.fromEntries(courts.map(c=>[c.CourtID,c.Surface]));
matches.forEach(m=>{ m._Surface = courtMap[m.CourtID]||'Unknown'; });

// aggregate per player
const byId = Object.fromEntries(players.map(p=>[p.PlayerID,p]));
const rows = players.map(p=>{
const mFor = matches.filter(m=>m.PlayerAID===p.PlayerID||m.PlayerBID===p.PlayerID);
const { pts, wins, losses } = aggregatePlayerPoints(p.PlayerID, matches);
const played = wins+losses; const winPct = played? wins/played : 0;
// diffs (quick):
let setsDiff=0,gamesDiff=0,pointsDiff=0;
for(const m of mFor){
if(!m.WinnerID) continue;
const asA=m.PlayerAID===p.PlayerID; setsDiff += (asA?+m.SetsWonA:+m.SetsWonB) - (asA?+m.SetsWonB:+m.SetsWonA);
gamesDiff += (asA?+m.GamesWonA:+m.GamesWonB) - (asA?+m.GamesWonB:+m.GamesWonA);
pointsDiff += (asA?+m.PointsWonA:+m.PointsWonB) - (asA?+m.PointsWonB:+m.PointsWonA);
}
return { ...p, totalPoints:pts, winPct, setsDiff, gamesDiff, pointsDiff, TeamName:'' };
});

rows.sort((a,b)=>{
const ka = sortKeysForPlayers(a), kb = sortKeysForPlayers(b);
for(let i=0;i<ka.length;i++){ if(ka[i]!==kb[i]) return ka[i]-kb[i]; }
return 0;
});

const list=$('#list');
list.innerHTML = rows.map((p,i)=>`<div class="card"><div class="flex"><span class="rank">#${i+1}</span><span class="pill">${p.totalPoints} pts</span><span class="pill">${(p.winPct*100).toFixed(1)}%</span></div><div class="small">${p.PlayerName}</div><div class="stat"><span>Sets Δ</span><b>${p.setsDiff}</b></div><div class="stat"><span>Games Δ</span><b>${p.gamesDiff}</b></div><a class="link" href="player-single.html?id=${encodeURIComponent(p.PlayerID)}">View profile →</a></div>`).join('');
})();