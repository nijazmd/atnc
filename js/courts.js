import { SHEETS } from './constants.js';
import { loadAll } from './loader.js';
import { $ } from './utils.js';

(async function(){
const { courts } = await loadAll(SHEETS);
$('#list').innerHTML = courts.map(c=>`<a class="link" href="court-single.html?id=${encodeURIComponent(c.CourtID)}"><div class="card"><div class="stat"><span>${c.CourtName}</span><b>${c.Surface}</b></div><div class="small">${c.VenueName||''}</div></div></a>`).join('');
})();