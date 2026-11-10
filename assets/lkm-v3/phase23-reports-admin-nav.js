/* Phase 23.4 — adds a single link to the unified admin navigation. */
(()=>{'use strict';
  const root=document.getElementById('adminRoot');if(!root)return;
  let scheduled=false;
  function attach(){
    const sidebar=root.querySelector('.admin-sidebar');if(!sidebar||sidebar.querySelector('#lkmReportsNav'))return;
    const a=document.createElement('a');a.id='lkmReportsNav';a.href='/admin-reports.html';a.textContent='▥ Sales reports';
    const link=sidebar.querySelector('a[href="/admin-crm.html"]')||sidebar.querySelector('a[href="/admin-quotes.html"]')||sidebar.querySelector('a[data-tab="leads"]');
    if(link)link.insertAdjacentElement('afterend',a);else sidebar.append(a);
  }
  new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;attach()})}).observe(root,{childList:true});
  attach();
})();
