/* Phase 19 — add Links to the existing admin menu without editing admin.js or CMS state. */
(()=>{'use strict';
const root=document.getElementById('adminRoot')||document.getElementById('lkmReviewsAdmin');
if(!root)return;
let pending=false;
function attach(){
  const side=root.querySelector('.admin-sidebar');
  if(!side||side.querySelector('#lkmLinksNav'))return;
  const el=document.createElement('a');el.id='lkmLinksNav';el.href='/admin-links.html';el.textContent='↗ Links library';
  const pre=[...side.querySelectorAll('.admin-nav-label')].find(n=>n.textContent.trim()==='PREVIEW');
  if(pre)side.insertBefore(el,pre);else side.appendChild(el);
}
new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;attach()})}).observe(root,{childList:true});
attach();
})();
