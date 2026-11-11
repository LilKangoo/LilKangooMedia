/* LilKangooMedia Phase 30.3 — About Us scroll reveal. No user data, no navigation changes. */
(()=>{
 'use strict';
 if(!document.body.classList.contains('lkm-about-standalone'))return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(reduced?.matches||!('IntersectionObserver' in window))return;
 const items=Array.from(document.querySelectorAll(
  '.lkm-about-story .reveal,.lkm-about-team-section .reveal,.lkm-about-disciplines .reveal,.lkm-about-cta .reveal'
 ));
 if(!items.length)return;
 const io=new IntersectionObserver(entries=>{
  for(const e of entries){
   e.target.classList.toggle('lkm30-about-visible',e.isIntersecting);
  }
 },{threshold:0.07,rootMargin:'0px 0px -5% 0px'});
 document.body.classList.add('lkm30-about-motion-ready');
 items.forEach(el=>io.observe(el));
 // If motion preference changes while viewing, reveal everything immediately.
 reduced?.addEventListener?.('change',event=>{
  if(!event.matches)return;
  io.disconnect();
  document.body.classList.remove('lkm30-about-motion-ready');
  items.forEach(el=>el.classList.add('lkm30-about-visible'));
 },{once:true});
})();