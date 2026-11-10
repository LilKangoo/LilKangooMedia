/* Phase 21.3 — additive navigation link for the existing admin dashboard. */
(()=>{'use strict';
  const root=document.getElementById('adminRoot');if(!root)return;
  let queued=false;
  function attach(){
    const side=root.querySelector('.admin-sidebar');
    if(!side||side.querySelector('#lkmCalendarNav'))return;
    const item=document.createElement('a');item.id='lkmCalendarNav';
    item.href='/admin-calendar.html';item.textContent='▦ Availability calendar';
    const near=side.querySelector('a[data-tab="leads"]');
    if(near)near.insertAdjacentElement('afterend',item);
    else side.prepend(item);
  }
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})})
    .observe(root,{childList:true});
  attach();
})();
