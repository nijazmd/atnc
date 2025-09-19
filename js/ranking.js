import { POINTS, ROUND } from './constants.js';

export function aggregatePlayerPoints(playerId, matches){
let pts=0, wins=0, losses=0;
for(const m of matches){
const isA = m.PlayerAID===playerId, isB = m.PlayerBID===playerId; if(!(isA||isB)) continue;
const won = m.WinnerID===playerId;
const lost = !won && m.WinnerID && (isA||isB);

if(won) pts += POINTS.WIN;

if(m.Round===ROUND.SF){ pts += won? POINTS.SF_WIN : (lost? POINTS.SF_LOSS:0); }
if(m.Round===ROUND.F){ pts += won? POINTS.FINAL_WIN : (lost? POINTS.FINAL_LOSS:0); }

if(won) wins++; else if(lost) losses++;
}
return { pts, wins, losses };
}

export function sortKeysForPlayers(p){
// p should carry: totalPoints, winPct, sos, setsDiff, gamesDiff, pointsDiff, h2hTie, uePct, recentWins, matches
return [
-(p.totalPoints||0),
-(p.winPct||0),
-(p.sos||0),
-(p.setsDiff||0),
-(p.gamesDiff||0),
-(p.pointsDiff||0),
-(p.h2hTie||0), // computed only when exactly two tied; else 0
+(p.uePct||99), // lower is better
-(p.recentWins||0),
+(p.matches||9999),
];
}