/* Phase 23.3A — keep all enquiry edit/archive actions under the existing Sales CRM.
 * This additive link does not modify the legacy enquiries/booking status view. */
(()=>{'use strict';
 const root=document.getElementById('adminRoot');if(!root)return;
 let scheduled=false;
 function mount(){
  const section=root.querySelector('.admin-main');
  const header=section?.querySelector('.admin-header');
  if(!header||!/^#leads(?:$|[?])/.test(location.hash)||section.querySelector('#lkm23LeadAdminShortcut'))return;
  const a=document.createElement('a');a.id='lkm23LeadAdminShortcut';a.href='/admin-crm.html';
  a.className='button button-dark';a.textContent='Edit · archive · manage enquiries ↗';
  a.style.cssText='margin:12px 0;max-width:max-content';
  const p=document.createElement('p');p.style.cssText='font-size:12px;color:#66766a;margin:2px 0 15px';
  p.textContent='All customer enquiry corrections and archived records are managed securely in Sales CRM.';
  header.after(a,p);
 }
 new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})})
 .observe(root,{childList:true});
 window.addEventListener('hashchange',()=>requestAnimationFrame(mount));mount();
})();
