// ScoreString e.g. "3-1, 4-3, 3-0" (short sets to 3; TB at 3–3 -> recorded as 4–3)
export function deriveFromScoreString(scoreStr){
    if(!scoreStr) return {setsWonA:0,setsWonB:0,gamesWonA:0,gamesWonB:0,valid:false};
    const sets = scoreStr.split(',').map(s=>s.trim()).filter(Boolean);
    let sA=0,sB=0,gA=0,gB=0,valid=true;
    for(const set of sets){
    const m=set.match(/^(\d+)\s*[-:]\s*(\d+)$/); if(!m){valid=false;break;}
    const a=+m[1], b=+m[2];
    const okDirect=(a>=3||b>=3)&&Math.abs(a-b)>=2&&(a<=5&&b<=5);
    const okTB=( (a===4&&b===3)||(a===3&&b===4) );
    if(!(okDirect||okTB)){ valid=false; break; }
    gA+=a; gB+=b; if(a>b) sA++; else sB++;
    }
    return {setsWonA:sA,setsWonB:sB,gamesWonA:gA,gamesWonB:gB,valid};
    }