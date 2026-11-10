/* Phase 25.3 — tiny, synchronous one-click quote bootstrap.
 * Inserted in <head> by the existing Netlify generator BEFORE deferred site.js.
 * No prices, personal information, orders or payment state are handled here. */
(()=>{'use strict';
 const params=new URLSearchParams(window.location.search);
 if(!params.has('lkm_service'))return;
 const raw=params.get('lkm_service')||'';
 const valid=/^[a-z0-9-]{1,90}$/.test(raw);
 params.delete('lkm_service');
 const query=params.toString();
 const target=(window.location.pathname||'/')+(query?'?'+query:'')+(valid?'#/quote':'#/services');
 if(valid){
  try{window.sessionStorage.setItem('lkm_selected_service',raw)}
  catch{window.location.replace('/#/service/'+encodeURIComponent(raw));return;}
 }
 // Remove the routing query from browser history before loading the SPA.
 window.history.replaceState(window.history.state,'',target);
})();
