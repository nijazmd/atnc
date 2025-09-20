// /js/player-single.js
import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $, getParam } from './utils.js';
import { aggregatePlayerPoints } from './ranking.js';

(function(){
  const pct = (n,d) => d ? (n/d*100).toFixed(1)+'%' : '—';

  async function main(){
    const pid = getParam('id');
    const { players, matches, courts } = await loadAll(SHEETS);

    const p = players.find(x=>x.PlayerID===pid);
    if(!p){ $('#name').textContent='Not found'; return; }
    $('#name').textContent = p.PlayerName;

    // Attach surface to matches
    const surfaceMap = Object.fromEntries(courts.map(c=>[c.CourtID, c.Surface]));
    matches.forEach(m => m._Surface = surfaceMap[m.CourtID] || 'Unknown');

    // All matches involving player
    const my = matches.filter(m => m.PlayerAID===pid || m.PlayerBID===pid);

    // Tally containers
    let wins=0, losses=0;
    let setsDiff=0, gamesDiff=0, pointsDiff=0;
    let gamePtsWon=0, gamePtsLost=0;
    let cleanW=0, cleanL=0;

    // Home/Away (by assignment, not venue string)
    let homeWins=0, homeLosses=0, awayWins=0, awayLosses=0;

    // Durations split by home/away
    const durAll=[], durHome=[], durAway=[];
    const surfAgg={};

    // Per-opponent H2H
    const byOpp = {}; // oppId -> { name, meetings, w, l, homePlayed, homeWins, awayPlayed, awayWins }

    for(const m of my){
      // Only count completed matches for stats
      if(!m.WinnerID) continue;

      const asA  = m.PlayerAID === pid;
      const opp  = asA ? m.PlayerBID : m.PlayerAID;
      const won  = m.WinnerID === pid;

      const sA=+m.SetsWonA||0, sB=+m.SetsWonB||0;
      const gA=+m.GamesWonA||0, gB=+m.GamesWonB||0;
      const pA=+m.PointsWonA||0, pB=+m.PointsWonB||0;

      const mySets  = asA ? sA : sB,  opSets  = asA ? sB : sA;  setsDiff  += (mySets - opSets);
      const myGames = asA ? gA : gB,  opGames = asA ? gB : gA;  gamesDiff += (myGames - opGames);
      const myPts   = asA ? pA : pB,  opPts   = asA ? pB : pA;  pointsDiff+= (myPts - opPts);

      gamePtsWon  += myPts;
      gamePtsLost += opPts;

      if (won) wins++; else losses++;
      if (opGames===0) cleanW++;
      if (myGames===0) cleanL++;

      const isHomeForPlayer = m.HomePlayerID === pid;
      if (won && isHomeForPlayer) homeWins++;
      else if (!won && isHomeForPlayer) homeLosses++;
      else if (won && !isHomeForPlayer) awayWins++;
      else if (!won && !isHomeForPlayer) awayLosses++;

      const d = +m.DurationMinutes || 0;
      if (d>0){
        durAll.push(d);
        (isHomeForPlayer ? durHome : durAway).push(d);
      }

      // Surface aggregates
      const s = m._Surface;
      (surfAgg[s] = surfAgg[s] || {matches:0,wins:0});
      surfAgg[s].matches++; if (won) surfAgg[s].wins++;

      // Opponent aggregates
      if (!byOpp[opp]){
        const oppName = (players.find(x=>x.PlayerID===opp)?.PlayerName) || opp;
        byOpp[opp] = { name: oppName, meetings:0, w:0, l:0, homePlayed:0, homeWins:0, awayPlayed:0, awayWins:0 };
      }
      const o = byOpp[opp];
      o.meetings++;
      if (won) o.w++; else o.l++;
      if (isHomeForPlayer){ o.homePlayed++; if (won) o.homeWins++; }
      else { o.awayPlayed++; if (won) o.awayWins++; }
    }

    // Match points (ranking points used for team standings)
    const { pts: matchPoints } = aggregatePlayerPoints(pid, matches);

    // Convenience
    const played = wins + losses;
    const winPct = pct(wins, played);
    const pointWinPct = pct(gamePtsWon, gamePtsWon + gamePtsLost);
    const avg = (arr)=> arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(0)+'m' : '—';

    // ===== Overview (top) =====
    $('#overview').innerHTML = `
      <div class="list">
        <div class="stat"><span>Match Points</span><b>${matchPoints} pts</b></div>
        <div class="stat"><span>Record</span><b>${wins}-${losses}</b></div>
        <div class="stat"><span>Win %</span><b>${winPct}</b></div>

        <div class="stat"><span>Game Points Won</span><b>${gamePtsWon}</b></div>
        <div class="stat"><span>Game Points Lost</span><b>${gamePtsLost}</b></div>
        <div class="stat"><span>Point Win %</span><b>${pointWinPct}</b></div>

        <div class="stat"><span>Sets Δ</span><b>${setsDiff}</b></div>
        <div class="stat"><span>Games Δ</span><b>${gamesDiff}</b></div>
        <div class="stat"><span>Points Δ</span><b>${pointsDiff}</b></div>

        <div class="stat"><span>Clean sweeps</span><b>${cleanW}</b></div>
        <div class="stat"><span>Clean losses</span><b>${cleanL}</b></div>
        <div class="stat"><span>Fastest serve</span><b>${p.FastestServeKph||'—'} kph</b></div>
      </div>
    `;

    // ===== Average Match Time (keep existing splits) =====
    $('#splits').innerHTML = `
      <h3>Average Match Time</h3>
      <div class="list">
        <div class="stat"><span>Overall</span><b>${avg(durAll)}</b></div>
        <div class="stat"><span>Home</span><b>${avg(durHome)}</b></div>
        <div class="stat"><span>Away</span><b>${avg(durAway)}</b></div>
      </div>
    `;

    // ===== NEW: Home & Away win% =====
    const venueCard = document.createElement('section');
    venueCard.className = 'card';
    venueCard.innerHTML = `
      <h3>Home & Away</h3>
      <div class="list">
        <div class="stat"><span>Home Record</span>
          <b>${homeWins}-${homeLosses} (${pct(homeWins, homeWins+homeLosses)})</b></div>
        <div class="stat"><span>Away Record</span>
          <b>${awayWins}-${awayLosses} (${pct(awayWins, awayWins+awayLosses)})</b></div>
      </div>
    `;
    // Insert after #splits
    const container = document.querySelector('main.container');
    container.insertBefore(venueCard, $('#surfaces'));

    // ===== By Surface (as you had) =====
    $('#surfaces').innerHTML = `<h3>By Surface</h3>` + Object.entries(surfAgg).map(([k,v])=>{
      const w=v.wins, pl=v.matches, p=pct(w, pl);
      return `<div class="stat"><span>${k}</span><b>${w}-${pl-w} (${p})</b></div>`;
    }).join('');

    // ===== NEW: Vs Players (H2H + home/away splits) =====
    const vsCard = document.createElement('section');
    vsCard.className = 'card';
    vsCard.id = 'vs';

    // Sort opponents by meetings desc, then name
    const oppRows = Object.entries(byOpp)
      .sort((a,b) => (b[1].meetings - a[1].meetings) || (a[1].name.localeCompare(b[1].name)))
      .map(([oppId, o])=>{
        const overallPct = pct(o.w, o.meetings);
        const homePct = pct(o.homeWins, o.homePlayed);
        const awayPct = pct(o.awayWins, o.awayPlayed);
        const link = `<a class="link" href="player-single.html?id=${encodeURIComponent(oppId)}">${o.name}</a>`;
        return `
          <div class="stat"><span>${link}</span><b>${o.w}-${o.l} (${overallPct})</b></div>
          <div class="small">Home: ${o.homeWins}-${o.homePlayed - o.homeWins} (${homePct}) · Away: ${o.awayWins}-${o.awayPlayed - o.awayWins} (${awayPct})</div>
        `;
      }).join('') || '<div class="small">No completed matches vs anyone yet.</div>';

    vsCard.innerHTML = `<h3>Vs Players</h3><div class="list">${oppRows}</div>`;
    container.insertBefore(vsCard, $('#recent'));

    // ===== Recent (last 5 completed) with opponent names =====
    const completed = my.filter(m=>m.WinnerID)
      .sort((a,b)=>new Date(b.Date)-new Date(a.Date))
      .slice(0,5);

    const nameOf = id => (players.find(pp=>pp.PlayerID===id)?.PlayerName) || id;
    $('#recent').innerHTML = `<h3>Recent (last 5)</h3>` + completed.map(m=>{
      const opp = (m.PlayerAID===pid) ? m.PlayerBID : m.PlayerAID;
      return `<div class="stat"><span>vs ${nameOf(opp)}</span><b>${m.ScoreString||''}</b></div>`;
    }).join('');
  }

  main();
})();
