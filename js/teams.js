// /js/teams.js
import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $ } from './utils.js';
import { aggregatePlayerPoints } from './ranking.js';

(async function(){
  const { teams, players, matches } = await loadAll(SHEETS);

  // Points per player
  const ptsOf = Object.fromEntries(
    players.map(p => [p.PlayerID, aggregatePlayerPoints(p.PlayerID, matches).pts])
  );

  // Group players by team
  const byTeam = {};
  for (const p of players) {
    if (!p.TeamID) continue;
    (byTeam[p.TeamID] = byTeam[p.TeamID] || []).push(p);
  }

  // Build rows with teamPts and sorted roster
  let rows = teams.map(t => {
    const roster = (byTeam[t.TeamID] || []).slice();

    // Sort roster by points desc
    const sortedRoster = roster.sort((a,b) => (ptsOf[b.PlayerID]||0) - (ptsOf[a.PlayerID]||0));

    // Top 3 contributors
    const top3 = sortedRoster.slice(0, 3);
    const top3Ids = new Set(top3.map(p => p.PlayerID));
    const teamPts = top3.reduce((sum,p) => sum + (ptsOf[p.PlayerID]||0), 0);

    return { ...t, teamPts, sortedRoster, top3Ids };
  });

  // Sort teams by total points desc, then name for stability
  rows.sort((a,b) => (b.teamPts - a.teamPts) || (a.TeamName||'').localeCompare(b.TeamName||''));

  // Assign display rank = lowest position in tie group
  // Example: points [10,10,8,8,8,7] -> ranks [2,2,5,5,5,6]
  let i = 0;
  while (i < rows.length) {
    const start = i;
    let end = i;
    while (end + 1 < rows.length && rows[end + 1].teamPts === rows[start].teamPts) end++;
    const rank = end + 1; // 1-based, lowest in group
    for (let j = start; j <= end; j++) rows[j].rank = rank;
    i = end + 1;
  }

  // Render
  $('#teams').innerHTML = rows.map(t => {
    const rosterHtml = t.sortedRoster.map(p => {
      const pts = ptsOf[p.PlayerID] || 0;
      const link = `<a class="link" href="player-single.html?id=${encodeURIComponent(p.PlayerID)}">${p.PlayerName}</a>`;
      // Badge only if NOT counted in top3
      const badge = t.top3Ids.has(p.PlayerID) ? '' : '<span class="badge">Not counted</span>';
      return `<div class="stat"><span>${link} ${badge}</span><b>${pts} pts</b></div>`;
    }).join('');

    return `
      <div class="card">
        <div class="flex" style="justify-content:space-between;align-items:center;">
          <div class="flex" style="gap:.5rem;align-items:center;">
            <span class="rank">#${t.rank}</span>
            <h3 style="margin:0">${t.TeamName}</h3>
          </div>
          <span class="pill">${t.teamPts} pts</span>
        </div>
        <div class="list">${rosterHtml}</div>
      </div>
    `;
  }).join('');
})();
