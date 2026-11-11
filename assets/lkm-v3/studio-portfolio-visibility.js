/* Phase 26: independent Portfolio-card visibility. Never hides direct gallery URLs or project stories.
 * If Phase 26 SQL is absent/unavailable, this harmless enhancement fails open. */
(()=>{'use strict';
 if(document.body.dataset.cmsPage!=='portfolio')return;
 const root=document.getElementById('cmsPublic'),cfg=window.LKM_CONFIG||{};
 if(!root||!String(cfg.SUPABASE_URL||'').startsWith('https://')||!cfg.SUPABASE_ANON_KEY)return;
 const base=String(cfg.SUPABASE_URL).replace(/\/+$/,'');let hidden=new Set(),ready=false,queued=false;
 async function refresh(){try{
  const url=base+'/rest/v1/portfolio_galleries?select=slug&visibility=eq.public&show_in_portfolio=eq.false&limit=1000';
  const res=await fetch(url,{headers:{apikey:cfg.SUPABASE_ANON_KEY,Accept:'application/json'},cache:'no-store'});
  if(!res.ok)return;const data=await res.json();hidden=new Set(data.map(g=>g.slug));ready=true;apply();
 }catch{/* Never block portfolio when the visibility service is unavailable. */}}
 function apply(){if(!ready)return;const hash=location.hash||'#/';if(!['#/','#','#/stories'].includes(hash))return;
  for(const card of root.querySelectorAll('a.cms-pub-card[href^="#/gallery/"]')){
    const slug=card.getAttribute('href').slice('#/gallery/'.length);
    const shouldHide=hidden.has(slug);card.hidden=shouldHide;card.style.display=shouldHide?'none':'';
  }
  // Hide empty category chips only if that category has no other visible gallery cards.
  // We deliberately leave the existing filter UI intact to avoid changing SPA behaviour.
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 window.addEventListener('hashchange',schedule);void refresh();
})();
