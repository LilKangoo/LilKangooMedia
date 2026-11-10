/* Adds one case studies link to the existing admin sidebar, without modifying core admin.js. */
(()=>{'use strict';
  const root=document.getElementById('adminRoot');if(!root)return;
  let queued=false;
  function enhance(){
    const sidebar=root.querySelector('.admin-sidebar');if(!sidebar||sidebar.querySelector('.lkm-case-admin-link'))return;
    const a=document.createElement('a');a.className='lkm-case-admin-link';a.href='/admin-case-studies.html';a.textContent='▣ Case Studies';
    const gallery=sidebar.querySelector('a[href="#galleries"]');if(gallery)gallery.after(a);else sidebar.append(a);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
  new MutationObserver(schedule).observe(root,{childList:true});schedule();
})();
