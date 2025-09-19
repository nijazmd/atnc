export const $ = (s,r=document)=>r.querySelector(s);
export const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
export function getParam(name, dflt=''){ return new URLSearchParams(location.search).get(name)||dflt; }
export function byIdMap(arr, key='PlayerID'){ const m={}; arr.forEach(o=>m[o[key]]=o); return m; }
export function groupBy(arr, key){ const m={}; arr.forEach(o=>{ const k=o[key]||''; (m[k]=m[k]||[]).push(o);}); return m; }
export function sum(nums){ return nums.reduce((a,b)=>a+(+b||0),0); }
export function avg(nums){ const n=nums.length; return n? sum(nums)/n : 0; }
export function fmtPct(x){ return isFinite(x)? (x*100).toFixed(1)+'%' : '—'; }
export function linkPlayer(p){ return `<a class="link" href="player-single.html?id=${encodeURIComponent(p.PlayerID)}">${p.PlayerName}</a>`; }
export function linkTeam(t){ return `<a class="link" href="teams.html#${encodeURIComponent(t.TeamID)}">${t.TeamName}</a>`; }