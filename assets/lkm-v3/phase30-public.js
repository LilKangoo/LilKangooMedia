/* LilKangooMedia Phase 30.0. Public pages only.
 * Standardizes the navigation without changing verified destination URLs.
 * SPA Home retains its existing Phase 29 header and background animation.
 */
(()=>{
 'use strict';
 if(window.__LKM30PublicReady)return;
 window.__LKM30PublicReady=true;
 const body=document.body;
 if(!body?.classList.contains('lkm30-public'))return;
 const HOME='/';
 const SERVICES='/#/services';
 const PERSONAL='/#/services?audience=personal';
 const BUSINESS_SERVICES='/#/services?audience=business';
 const BUSINESS='/business-solutions.html';
 const PORTFOLIO='/portfolio.html';
 const REVIEWS='/reviews.html';
 const ARTICLES='/blog.html';
 const ABOUT='/#/about';
 const CONTACT='/#/contact';
 const items=[
   ['Home',HOME],['Services',SERVICES],['For Business',BUSINESS],
   ['Our Work',PORTFOLIO],['Reviews',REVIEWS],['Articles',ARTICLES],
   ['About Us',ABOUT],['Contact',CONTACT]
 ];
 const create=(tag,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;return el};
 const addLink=(root,label,href,active=false,cls='')=>{
   const a=create('a',cls);a.href=href;a.textContent=label;
   if(active)a.setAttribute('aria-current','page');root.append(a);return a;
 };
 function currentKey(){
   const path=window.location.pathname.toLowerCase();
   if(path==='/'||path==='/index.html'||path==='/home.html')return 'Home';
   if(path.startsWith('/business-'))return 'For Business';
   if(path.includes('portfolio')||path.includes('case-stud'))return 'Our Work';
   if(path.includes('review'))return 'Reviews';
   if(path==='/blog.html'||path.startsWith('/blog/')||body.querySelector('.topbar'))return 'Articles';
   if(path.includes('aboutus')||path.includes('about us'))return 'About Us';
   if(path.startsWith('/services/'))return 'Services';
   return 'Home';
 }
 function normalizeHeader(){
   // Home SPA owns this header via Phase 29; never create a second menu.
   if(document.getElementById('siteHeader'))return;
   const header=document.querySelector('.site-header,.lkm25-header,.lkm-review-page-header,.topbar');
   if(!header)return;
   const container=header.matches('.topbar')?header:header.querySelector('.header-inner,.lkm25-navwrap,.lkm-review-page-nav');
   if(!container||container.querySelector('.lkm30-nav'))return;
   const brand=container.querySelector(':scope > .identity,:scope > .lkm25-brand');
   if(!brand)return;
   const existingAction=container.querySelector('.header-cta a[href]');
   const actionHref=existingAction?.getAttribute('href')||SERVICES;
   const actionLabel=existingAction?.textContent?.trim()||'Explore Services ↗';
   const original=Array.from(container.children).filter(node=>node!==brand);
   const nav=create('nav','lkm30-nav');nav.setAttribute('aria-label','Main navigation');
   const key=currentKey();
   items.forEach(([title,href])=>{
     if(title==='Services'){
       const wrapper=create('div','lkm30-services');
       addLink(wrapper,title,href,key==='Services');
       const toggle=create('button');toggle.type='button';toggle.textContent='⌄';
       toggle.setAttribute('aria-label','Choose personal or business services');
       toggle.setAttribute('aria-expanded','false');
       const sub=create('div','lkm30-submenu');
       addLink(sub,'Personal Services',PERSONAL);
       addLink(sub,'Business Services',BUSINESS_SERVICES);
       toggle.addEventListener('click',()=>{
         const open=wrapper.classList.toggle('lkm30-open');toggle.setAttribute('aria-expanded',String(open));
       });
       wrapper.append(toggle,sub);nav.append(wrapper);
     }else if(title==='Our Work'){
       const wrapper=create('div','lkm30-services');
       addLink(wrapper,title,href,key==='Our Work');
       const toggle=create('button');toggle.type='button';toggle.textContent='⌄';
       toggle.setAttribute('aria-label','Explore portfolio or project stories');
       toggle.setAttribute('aria-expanded','false');
       const sub=create('div','lkm30-submenu');
       addLink(sub,'Portfolio galleries',PORTFOLIO);
       addLink(sub,'Project Stories','/portfolio.html#/stories');
       toggle.addEventListener('click',()=>{
         const open=wrapper.classList.toggle('lkm30-open');toggle.setAttribute('aria-expanded',String(open));
       });
       wrapper.append(toggle,sub);nav.append(wrapper);
     }else addLink(nav,title,href,key===title);
   });
   const cta=addLink(create('div'), actionLabel, actionHref);
   cta.className='lkm30-header-cta';
   const mobileToggle=create('button','lkm30-nav-toggle');mobileToggle.type='button';
   mobileToggle.setAttribute('aria-label','Open navigation');mobileToggle.setAttribute('aria-expanded','false');mobileToggle.textContent='☰';
   const mobile=create('nav','lkm30-mobile-nav');mobile.hidden=true;mobile.setAttribute('aria-label','Mobile navigation');
   items.forEach(([title,href])=>{
     addLink(mobile,title,href,key===title);
     if(title==='Services'){
       addLink(mobile,'Personal Services',PERSONAL,false,'lkm30-sub-link');
       addLink(mobile,'Business Services',BUSINESS_SERVICES,false,'lkm30-sub-link');
     }
     if(title==='Our Work')addLink(mobile,'Project Stories','/portfolio.html#/stories',false,'lkm30-sub-link');
   });
   if(existingAction&&actionHref!==SERVICES) addLink(mobile,actionLabel,actionHref,false,'lkm30-mobile-action');
   mobileToggle.addEventListener('click',()=>{
     mobile.hidden=!mobile.hidden;
     mobileToggle.textContent=mobile.hidden?'☰':'✕';
     mobileToggle.setAttribute('aria-expanded',String(!mobile.hidden));
     mobileToggle.setAttribute('aria-label',mobile.hidden?'Open navigation':'Close navigation');
   });
   document.addEventListener('keydown',event=>{
     if(event.key!=='Escape')return;
     mobile.hidden=true;mobileToggle.setAttribute('aria-expanded','false');mobileToggle.textContent='☰';
     nav.querySelectorAll('.lkm30-services').forEach(s=>s.classList.remove('lkm30-open'));
     nav.querySelectorAll('[aria-expanded]').forEach(b=>b.setAttribute('aria-expanded','false'));
   });
   document.addEventListener('click',event=>{
     if(!header.contains(event.target)){
       mobile.hidden=true;mobileToggle.setAttribute('aria-expanded','false');mobileToggle.textContent='☰';
       nav.querySelectorAll('.lkm30-services').forEach(s=>s.classList.remove('lkm30-open'));
       nav.querySelectorAll('[aria-expanded]').forEach(b=>b.setAttribute('aria-expanded','false'));
     }
   });
   original.forEach(node=>node.remove());
   container.classList.add('lkm30-header-content');
   container.append(nav,cta,mobileToggle);
   header.append(mobile);
 }
 function watermark(){
   // The accepted kangaroo on the homepage is already animated by Phase 29.
   if(document.getElementById('siteHeader'))return;
   if(document.querySelector('.lkm30-watermark'))return;
   const mark=create('div','lkm30-watermark');mark.setAttribute('aria-hidden','true');
   const img=create('img');img.src='/assets/lkm-v3/brand/logo-orange.png';img.alt='';
   img.decoding='async';img.loading='lazy';mark.append(img);
   body.insertBefore(mark,body.firstChild);
   const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
   let ticking=false;
   function paint(){
     ticking=false;
     if(reduce.matches){mark.style.transform='none';return;}
     const total=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
     const doc=Math.max(0,document.documentElement.scrollHeight);
     const room=Math.max(0,doc-mark.getBoundingClientRect().width-170);
     const ratio=Math.max(0,Math.min(1,window.scrollY/total));
     mark.style.transform='translate3d(0,'+Math.round(room*ratio)+'px,0)';
   }
   function schedule(){if(ticking)return;ticking=true;window.requestAnimationFrame(paint)}
   window.addEventListener('scroll',schedule,{passive:true});
   window.addEventListener('resize',schedule,{passive:true});
   reduce.addEventListener?.('change',schedule);
   schedule();
 }

 /* Phase 30.4 — The main application renders About via /#/about, not AboutUs.html.
    Watch its existing #main root and upgrade the logo on every route render.
    No change to routing, pricing, forms, navigation destinations or admin. */
 function watchSpaAbout(){
   const root=document.getElementById('main');
   if(!root||!document.getElementById('siteHeader'))return;
   const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
   let queued=false,paintQueued=false;
   function paint(){
     paintQueued=false;
     const mark=root.querySelector(':scope > .lkm30-about-spa-mark');
     if(!mark)return;
     if(reduce?.matches){mark.style.transform='none';return;}
     const scrollMax=Math.max(1,document.documentElement.scrollHeight-innerHeight);
     const progress=Math.max(0,Math.min(1,scrollY/scrollMax));
     const room=Math.max(0,root.scrollHeight-mark.offsetWidth-190);
     mark.style.transform='translate3d(0,'+Math.round(room*progress)+'px,0) rotate('+Math.round((progress-.5)*13)+'deg)';
   }
   function paintLater(){if(paintQueued)return;paintQueued=true;requestAnimationFrame(paint)}
   function sync(){
     queued=false;
     const stamp=root.querySelector('.lkm-about-hero .lkm-about-hero-stamp');
     const about=Boolean(stamp);
     body.classList.toggle('lkm30-about-active',about);
     if(!about)return;
     if(!stamp.querySelector('img')){
       const img=document.createElement('img');
       img.src='/assets/lkm-v3/brand/logo-profile.png';
       img.alt='';img.width=117;img.height=117;img.decoding='async';
       stamp.replaceChildren(img);
     }
     if(!root.querySelector(':scope > .lkm30-about-spa-mark')){
       const mark=document.createElement('div');mark.className='lkm30-about-spa-mark';mark.setAttribute('aria-hidden','true');
       const pic=document.createElement('img');pic.src='/assets/lkm-v3/brand/logo-orange.png';pic.alt='';pic.loading='lazy';
       mark.append(pic);root.prepend(mark);
     }
     paintLater();
   }
   function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
   const observer=new MutationObserver(schedule);
   observer.observe(root,{childList:true});
   window.addEventListener('scroll',paintLater,{passive:true});
   window.addEventListener('resize',paintLater,{passive:true});
   reduce?.addEventListener?.('change',paintLater);
   sync();
 }

 // Phase 31.1 dynamically loads only on public SPA and Portfolio pages.
 // Admin uses the patched, original Studio module and never loads this runtime.
 function phase31Extensions(){
   const path=location.pathname;
   if(!/^\/(?:index\.html)?$/.test(path)&&!/^\/portfolio(?:\.html)?\/?$/i.test(path))return;
   if(document.querySelector('[data-lkm31="runtime"]'))return;
   const css=document.createElement('link');css.rel='stylesheet';
   css.href='/assets/lkm-v3/phase31-public.css?v=31-3';css.setAttribute('data-lkm31','styles');
   const script=document.createElement('script');script.src='/assets/lkm-v3/phase31-public.js?v=31-3';
   script.defer=true;script.setAttribute('data-lkm31','runtime');
   document.head.append(css,script);
 }
 normalizeHeader();
 watermark();
 watchSpaAbout();
 phase31Extensions();
})();
