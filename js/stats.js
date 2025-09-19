import { groupBy, sum, avg } from './utils.js';

export function ledgerForPlayer(playerId, matches){
const rec = { total:{}, home:{}, away:{}, surfaces:{}, durations:{home:[],away:[],all:[]} };
let cleanSweeps=0, cleanLosses=0;
let setsDiff=0,gamesDiff=0,pointsDiff=0, ue=0, mw=0, ml=0;

for(const m of matches){
const involved = (m.PlayerAID===playerId)||(m.PlayerBID===playerId);
if(!involved||!m.WinnerID) continue; // completed only
const asA = m.PlayerAID===playerId; const asB = m.PlayerBID===playerId;
const won = m.WinnerID===playerId;

const sA=+m.SetsWonA||0, sB=+m.SetsWonB||0;
const gA=+m.GamesWonA||0, gB=+m.GamesWonB||0;
const pA=+m.PointsWonA||0, pB=+m.PointsWonB||0;
const ueA=+m.UnforcedErrorsA||0, ueB=+m.UnforcedErrorsB||0;

const mySets = asA?sA:sB, opSets = asA?sB:sA; setsDiff += (mySets-opSets);
const myGames = asA?gA:gB, opGames = asA?gB:gA; gamesDiff += (myGames-opGames);
const myPts = asA?pA:pB, opPts = asA?pB:pA; pointsDiff += (myPts-opPts);
ue += (asA?ueA:ueB);

if(won) mw++; else ml++;
if(opGames===0) cleanSweeps++;
if(myGames===0) cleanLosses++;

const dur=+m.DurationMinutes||0; if(dur>0){
rec.durations.all.push(dur);
if((m.Venue||'').toLowerCase()==='home') rec.durations.home.push(dur); else rec.durations.away.push(dur);
}

// surface
const surface = m._Surface||'Unknown'; // attach before call via join (Matches <- Courts)
rec.surfaces[surface] = rec.surfaces[surface]||{matches:0,wins:0};
rec.surfaces[surface].matches++;
if(won) rec.surfaces[surface].wins++;
}

const matchesPlayed = mw+ml;
const winPct = matchesPlayed? mw/matchesPlayed : 0;
const uePct = ( (sum([pointsDiff])+0) , (rec._ptsTot) ); // not used here; compute separately if needed
return {
matchesPlayed, wins:mw, losses:ml,
setsDiff, gamesDiff, pointsDiff, cleanSweeps, cleanLosses,
winPct,
avgTimeAll: avg(rec.durations.all), avgTimeHome: avg(rec.durations.home), avgTimeAway: avg(rec.durations.away),
surfaces: rec.surfaces
};
}