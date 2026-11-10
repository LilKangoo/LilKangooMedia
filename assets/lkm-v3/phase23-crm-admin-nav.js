/* Phase 23.1 — link to dedicated admin-only CRM. Does not replace existing admin. */
(()=>{'use strict';
 const root=document.getElementById('adminRoot');if(!root)return;
 let queued=false;
 function add(){
   const side=root.querySelector('.admin-sidebar');
   if(!side||side.querySelector('#lkm23CrmNav'))return;
   const link=document.createElement('a');
   link.id='lkm23CrmNav';link.href='/admin-crm.html';link.textContent='▦ Sales CRM & follow-ups';
   const anchor=side.querySelector('#lkmCalendarNav')||side.querySelector('a[data-tab="leads"]');
   if(anchor)anchor.after(link);else side.prepend(link);
 }
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;add()})}).observe(root,{childList:true});
 add();
})();
