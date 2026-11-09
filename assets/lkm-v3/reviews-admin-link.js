/* Add one safe native Reviews section to the existing admin sidebar without touching CMS state. */
(()=>{'use strict';
const root=document.getElementById('adminRoot');if(!root)return;
let pending=false;
function attach(){const side=root.querySelector('.admin-sidebar');if(!side||side.querySelector('#lkmReviewsNav'))return;
 const anchor=[...side.querySelectorAll('.admin-nav-label')].find(x=>x.textContent.trim()==='CONTENT');
 const link=document.createElement('a');link.href='/admin-reviews.html';link.id='lkmReviewsNav';link.textContent='★ Customer reviews';
 if(anchor){let n=anchor.nextElementSibling;while(n&&!n.classList.contains('admin-nav-label')){n=n.nextElementSibling;}if(n)side.insertBefore(link,n);else side.append(link);}else side.append(link);
}
new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;attach()})}).observe(root,{childList:true});attach();
})();
