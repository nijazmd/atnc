async function fetchCSV(url){
const res = await fetch(url, {cache:'no-store'});
const text = await res.text();
return csvToObjects(text);
}

export function csvToObjects(csv){
const lines = csv.replace(/\r/g,'').split('\n').filter(Boolean);
if(!lines.length) return [];
const headers = lines[0].split(',').map(h=>h.trim());
return lines.slice(1).map(line=>{
// naive CSV split; OK for Sheets w/o embedded commas; upgrade if needed
const cells = line.split(',');
const obj={}; headers.forEach((h,i)=>obj[h]=cells[i]?.trim?.()??'');
return obj;
});
}

export async function loadAll(SHEETS){
const [teams, players, champs, courts, brackets, matches] = await Promise.all([
fetchCSV(SHEETS.TEAMS), fetchCSV(SHEETS.PLAYERS), fetchCSV(SHEETS.CHAMPS),
fetchCSV(SHEETS.COURTS), fetchCSV(SHEETS.BRACKETS), fetchCSV(SHEETS.MATCHES)
]);
return { teams, players, champs, courts, brackets, matches };
}