async function fetchCSV(url){
const res = await fetch(url, {cache:'no-store'});
const text = await res.text();
return csvToObjects(text);
}

// ADD this helper near the top of loader.js
function splitCSVLine(line){
    const out=[]; let field='', i=0, inQ=false;
    while(i<line.length){
      const ch=line[i];
      if(inQ){
        if(ch === '"'){
          if(line[i+1] === '"'){ field+='"'; i+=2; } // escaped quote
          else { inQ=false; i++; }
        } else { field+=ch; i++; }
      } else {
        if(ch === '"'){ inQ=true; i++; }
        else if(ch === ','){ out.push(field); field=''; i++; }
        else { field+=ch; i++; }
      }
    }
    out.push(field);
    return out;
  }
  
  // REPLACE your csvToObjects with this version
  export function csvToObjects(csv){
    const lines = csv.replace(/\r/g,'').split('\n').filter(l => l.trim().length);
    if(!lines.length) return [];
    const headers = splitCSVLine(lines[0].replace(/^\uFEFF/, '')).map(h => h.trim());
    return lines.slice(1).map(line=>{
      const cells = splitCSVLine(line).map(c=>c.trim());
      const obj={}; headers.forEach((h,i)=> obj[h] = (cells[i] ?? ''));
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