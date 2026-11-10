/* Phase 23.2: link to separate, admin-authenticated Quotation Builder. */
(()=>{'use strict';const root=document.getElementById('adminRoot');if(!root)return;
 let queued=false;function mount(){const side=root.querySelector('.admin-sidebar');if(!side||side.querySelector('#lkmQuotesNav'))return;
 const a=document.createElement('a');a.id='lkmQuotesNav';a.href='/admin-quotes.html';a.textContent='▧ Quotation Builder';
 const next=side.querySelector('#lkm23CrmNav')||side.querySelector('a[data-tab="leads"]');if(next)next.after(a);else side.prepend(a);
 }
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}).observe(root,{childList:true});mount();
})();
