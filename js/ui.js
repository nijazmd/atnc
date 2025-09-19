import { linkPlayer } from './utils.js';
export function playerRow(p, rank){
return `<div class="card">
<div class="flex"><span class="rank">#${rank}</span><span class="pill">${p.totalPoints} pts</span><span class="pill">${(p.winPct*100).toFixed(1)}%</span></div>
<div class="small">${p.TeamName||''}</div>
<div class="stat"><span>Sets Δ</span><b>${p.setsDiff}</b></div>
<div class="stat"><span>Games Δ</span><b>${p.gamesDiff}</b></div>
<a class="link" href="player-single.html?id=${encodeURIComponent(p.PlayerID)}">View profile →</a>
</div>`;
}