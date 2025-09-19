export function decideHome({pairH2H, totalsHome, rankA, rankB, nameA, nameB, playerAID, playerBID}){
    const hA = pairH2H?.homeCountA ?? 0; const hB = pairH2H?.homeCountB ?? 0;
    if(hA!==hB) return (hA<hB)?playerAID:playerBID;
    const tA = totalsHome[playerAID]??0; const tB = totalsHome[playerBID]??0;
    if(tA!==tB) return (tA<tB)?playerAID:playerBID;
    if(rankA!==rankB) return (rankA<rankB)?playerAID:playerBID;
    return (nameA.localeCompare(nameB)<=0)?playerAID:playerBID;
    }