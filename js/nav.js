const TABS = [
    { id:'home',        icon:'🏠', href:'index.html' },
    { id:'players',     icon:'🎾', href:'players.html' },
    { id:'teams',       icon:'👥', href:'teams.html' },
    { id:'courts',      icon:'🏟️', href:'courts.html' },
    { id:'championship',icon:'🏆', href:'championship.html' }
  ];
  
  function activeId(){
    const page = location.pathname.split('/').pop().toLowerCase();
    if (page.includes('player')) return 'players';
    if (page.includes('team')) return 'teams';
    if (page.includes('court')) return 'courts';
    if (page.includes('championship')) return 'championship';
    if (!page || page.includes('index')) return 'home';
    return '';
  }
  
  (function renderNav(){
    const nav = document.getElementById('nav'); if(!nav) return;
    const act = activeId();
    nav.className = 'navbar';
    nav.innerHTML = `<div class="tabs">${TABS.map(t=>`
      <a href="${t.href}" class="${t.id===act?'active':''}" aria-label="${t.id}">
        <span class="icon">${t.icon}</span>
      </a>`).join('')}</div>`;
  })();
  