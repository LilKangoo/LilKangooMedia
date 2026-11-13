/* LilKangooMedia Phase 31.1: published case studies on Home and
 * multi-service project connections, using only live Supabase public data.
 * No writes, localStorage, secrets, or invented media. */
(()=>{
  'use strict';
  if(window.__LKM31PublicLoaded)return;
  window.__LKM31PublicLoaded=true;
  const cfg=window.LKM_CONFIG||{};
  const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');
  const key=String(cfg.SUPABASE_ANON_KEY||'');
  if(!/^https:\/\//.test(base)||!key)return;
  const isSpa=/^\/(?:index\.html)?$/.test(location.pathname);
  const isPortfolio=/^\/portfolio(?:\.html)?\/?$/i.test(location.pathname);
  if(!isSpa&&!isPortfolio)return;
  const slugOK=x=>typeof x==='string'&&/^[a-z0-9-]{1,90}$/.test(x);
  const uuidOK=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(x);
  const text=(s,n=240)=>typeof s==='string'?s.trim().slice(0,n):'';
  const imageURL=x=>{
    const s=text(x,1800);
    return /^https:\/\/[^\s<>"']+$/.test(s)||(s.startsWith('/assets/')&&!s.includes('..')&&!s.includes('//'))?s:'';
  };
  const ytOK=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{11}$/.test(x);
  const make=(tag,cl,content)=>{const el=document.createElement(tag);if(cl)el.className=cl;if(content!==undefined)el.textContent=content;return el;};
  const q=async(path)=>{
    const res=await fetch(`${base}/rest/v1/${path}`,{headers:{apikey:key,Accept:'application/json'},cache:'no-store'});
    if(!res.ok)throw new Error('Public portfolio unavailable: '+res.status);
    const data=await res.json();return Array.isArray(data)?data:[];
  };
  const sorted=rows=>rows.slice().sort((a,b)=>(Number(a.display_order)||100)-(Number(b.display_order)||100));
  const rels=g=>[...new Set([...(Array.isArray(g.related_service_slugs)?g.related_service_slugs:[]),g.related_service_slug].filter(slugOK))];
  let homeData=null,homeLoading=false,workLoading=null,storyLinksPromise=null;
  function homeVisible(){return !location.hash||['#','#/','#/home'].includes(location.hash);}
  function mediaFor(g,images,videos){
    const photos=sorted(images.filter(i=>i.gallery_id===g.id&&imageURL(i.image_url)));
    const cover=photos.find(i=>i.id===g.cover_image_id)||photos[0];
    const video=sorted(videos.filter(v=>v.gallery_id===g.id&&ytOK(v.youtube_id)))[0];
    return {src:cover?imageURL(cover.image_url):video?'https://i.ytimg.com/vi/'+video.youtube_id+'/hqdefault.jpg':'',
      alt:cover?text(cover.alt_text,200)||g.title:video?text(video.title,200)||g.title:g.title};
  }
  async function fetchHome(){
    // Only explicitly selected, public Case Studies. Portfolio visibility is independent.
    const galleries=await q('portfolio_galleries?select=id,slug,title,category,visibility,cover_image_id,show_on_home,home_sort_order&visibility=eq.public&portfolio_kind=eq.project&show_on_home=eq.true&order=home_sort_order.asc,slug.asc&limit=300');
    const eligible=galleries.filter(g=>uuidOK(g.id)&&slugOK(g.slug)&&g.show_on_home===true);
    if(!eligible.length)return [];
    const ids=eligible.map(g=>g.id).join(',');
    const cases=await q(`lkm_case_studies?select=gallery_id,headline,objective,project_location,project_year,is_published&gallery_id=in.(${ids})&is_published=eq.true&limit=300`);
    const byGallery=new Map(cases.filter(st=>st.is_published===true).map(st=>[st.gallery_id,st]));
    const items=eligible.filter(g=>byGallery.has(g.id));
    if(!items.length)return [];
    const actualIds=items.map(g=>g.id).join(',');
    const coverIds=[...new Set(items.map(g=>g.cover_image_id).filter(uuidOK))];
    const [covers,photos,videos]=await Promise.all([
      coverIds.length?q(`portfolio_images?select=id,gallery_id,image_url,alt_text,display_order,visibility&id=in.(${coverIds.join(',')})&visibility=eq.public&limit=300`).catch(()=>[]):Promise.resolve([]),
      q(`portfolio_images?select=id,gallery_id,image_url,alt_text,display_order,visibility&gallery_id=in.(${actualIds})&visibility=eq.public&order=display_order.asc&limit=900`).catch(()=>[]),
      q(`media_videos?select=gallery_id,youtube_id,title,display_order,visibility&gallery_id=in.(${actualIds})&visibility=eq.public&order=display_order.asc&limit=300`).catch(()=>[])
    ]);
    const uniquePhotos=new Map([...photos,...covers].map(img=>[img.id,img]));
    return items.map(g=>({story:byGallery.get(g.id),gallery:g,media:mediaFor(g,[...uniquePhotos.values()],videos)}));
  }
  function buildHomeCards(items){
    const section=make('section','lkm31-home-stories');section.id='lkm31-home-stories';
    section.setAttribute('aria-label','Featured project stories');
    const top=make('div','lkm31-home-top');const title=make('div');
    title.append(make('p','lkm31-label','BEHIND THE WORK'),make('h3','', 'Real projects. Real results.'));
    const all=make('a','lkm31-all','Explore all stories ↗');all.href='/portfolio.html#/stories';
    top.append(title,all);section.append(top);
    const grid=make('div','lkm31-case-grid');
    for(const {story,gallery,media} of items){
      const card=make('a','lkm31-case');card.href='/portfolio.html#/story/'+encodeURIComponent(gallery.slug);
      const visual=make('div','lkm31-case-image');
      if(media.src){const img=make('img');img.src=media.src;img.alt=media.alt;img.loading='lazy';img.decoding='async';visual.append(img);}
      else visual.append(make('span','lkm31-photo-placeholder','Project story'));
      card.append(visual);
      const body=make('div','lkm31-case-copy');
      body.append(make('span','lkm31-category',text(gallery.category,70)||'PROJECT'));
      body.append(make('h4','',text(story.headline,150)||text(gallery.title,150)));
      body.append(make('p','',text(story.objective,155)));
      body.append(make('strong','lkm31-case-link','Read the project story ↗'));
      card.append(body);grid.append(card);
    }
    if(items.length)section.append(grid);
    else section.append(make('p','lkm31-empty','Discover all published projects and their stories in our Portfolio.'));
    return section;
  }
  function showHome(){
    if(!isSpa||!homeVisible())return;
    const root=document.getElementById('main');const work=root?.querySelector('.portfolio-grid');
    if(!work||root.querySelector('#lkm31-home-stories'))return;
    if(homeData){work.after(buildHomeCards(homeData));return;}
    if(homeLoading)return;
    homeLoading=true;
    void fetchHome().then(rows=>{homeData=rows;homeLoading=false;showHome();}).catch(()=>{homeLoading=false;});
  }
  function detailSlug(){
    const m=String(location.hash).match(/^#\/service\/([^?#]+)/);
    if(!m)return '';
    try{const s=decodeURIComponent(m[1]);return slugOK(s)?s:'';}catch{return '';}
  }
  async function fetchExtraForService(slug){
    // New multi-link array. If the additive migration has not been applied,
    // the existing Phase 22 service portfolio remains fully functional.
    const all=await q('portfolio_galleries?select=id,slug,title,category,description,client_name,related_service_slug,related_service_slugs,cover_image_id,display_order&visibility=eq.public&limit=500');
    const linked=sorted(all.filter(g=>uuidOK(g.id)&&slugOK(g.slug)&&rels(g).includes(slug)&&g.related_service_slug!==slug)).slice(0,10);
    if(!linked.length)return [];
    const ids=linked.map(g=>g.id).join(',');
    const [images,videos,stories]=await Promise.all([
      q(`portfolio_images?select=id,gallery_id,image_url,alt_text,display_order&gallery_id=in.(${ids})&visibility=eq.public&limit=120`).catch(()=>[]),
      q(`media_videos?select=gallery_id,youtube_id,title,display_order&gallery_id=in.(${ids})&visibility=eq.public&limit=80`).catch(()=>[]),
      q(`lkm_case_studies?select=gallery_id&gallery_id=in.(${ids})&is_published=eq.true&limit=20`).catch(()=>[])
    ]);
    const published=new Set(stories.map(st=>st.gallery_id));
    return linked.map(g=>({...g,media:mediaFor(g,images,videos),hasStory:published.has(g.id)})).filter(g=>g.media.src);
  }
  let extraSlug='',extraPending=false,extraData=[];
  function enhanceService(){
    if(!isSpa)return;
    const slug=detailSlug();if(!slug)return;
    const root=document.getElementById('main');
    const wrap=root?.querySelector('.lkm-v14[data-service-slug]');
    const section=wrap?.querySelector('#lkm22-projects');
    if(!wrap||!section||wrap.dataset.serviceSlug!==slug||section.dataset.lkm31Done==='yes')return;
    if(extraSlug!==slug){extraSlug=slug;extraData=[];extraPending=false;}
    if(section.dataset.lkm31Fetched==='yes' && !extraData.length){section.dataset.lkm31Done='yes';return;}
    if(!extraPending&&!extraData.length){
      extraPending=true;
      void fetchExtraForService(slug).then(data=>{
        if(extraSlug!==slug)return;
        extraData=data;extraPending=false;
        section.dataset.lkm31Fetched='yes';enhanceService();
      }).catch(()=>{if(extraSlug===slug){extraPending=false;section.dataset.lkm31Done='yes';}});
      return;
    }
    if(extraPending||!extraData.length){if(section.dataset.lkm31Fetched==='yes')section.dataset.lkm31Done='yes';return;}
    section.dataset.lkm31Done='yes';
    let grid=section.querySelector('.lkm22-grid');
    if(!grid){grid=make('div','lkm22-grid');const trust=section.querySelector('.lkm22-trust');if(trust)trust.before(grid);else section.append(grid);}
    let count=grid.querySelectorAll('.lkm22-card').length;
    for(const g of extraData){
      if(count>=4)break;
      const link=g.hasStory?'/portfolio.html#/story/':'/portfolio.html#/gallery/';
      const href=link+encodeURIComponent(g.slug);
      if([...grid.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===href))continue;
      const card=make('a','lkm22-card');card.href=href;
      const pic=make('div','lkm22-image-wrap');const img=make('img');img.src=g.media.src;img.alt=g.media.alt;img.loading='lazy';pic.append(img);card.append(pic);
      const info=make('div','lkm22-info');info.append(make('span','lkm22-type',text(g.category,100)||'Project'),make('h3','',text(g.title,170)));
      if(g.description)info.append(make('p','',text(g.description,175)));
      if(g.client_name)info.append(make('span','lkm22-client',text(g.client_name,100)));
      info.append(make('span','lkm22-view',g.hasStory?'Read project story ↗':'View project ↗'));card.append(info);grid.append(card);count++;
    }
    if(grid.children.length){
      const head=section.querySelector('#lkm22-projects-title');if(head)head.textContent='See this service in action';
      const kicker=section.querySelector('.lkm22-eyebrow');if(kicker)kicker.textContent='SELECTED PROJECTS';
      const sub=section.querySelector('.lkm22-muted');if(sub)sub.textContent='Published work linked to this service by our team.';
    }
  }
  const formatEur=cents=>new Intl.NumberFormat('en-IE',{
    style:'currency',currency:'EUR',maximumFractionDigits:Number(cents)%100?2:0
  }).format(Number(cents)/100);
  const packageInfo=service=>{
    const packages=Array.isArray(service.packages)?service.packages:[];
    const p=packages.find(p=>p&&p.pricing_model!=='quote'&&
      Number.isSafeInteger(Number(p.price_cents))&&Number(p.price_cents)>=0&&Number(p.price_cents)<=1e9);
    if(!p)return {label:'Pricing',price:'Custom quote'};
    const suffix={hour:'/hour',day:'/day',person:'/person',item:'/item',month:'/month',year:'/year'}[p.pricing_model]||'';
    const mode=p.pricing_model||'fixed';
    const label=(p.show_from||packages.length>1)?'Packages from':({
      fixed:'Fixed package',hour:'Per hour',day:'Per day',person:'Per person',
      item:'Per item',month:'Monthly subscription',year:'Annual subscription'
    }[mode]||'Fixed package');
    return {label,price:formatEur(p.price_cents)+suffix};
  };
  async function fetchStoryServices(slug){
    // The multi-service assignment is the source of truth. No inferred or fabricated projects.
    const galleries=await q(`portfolio_galleries?select=slug,id,related_service_slug,related_service_slugs&slug=eq.${encodeURIComponent(slug)}&visibility=eq.public&limit=1`);
    if(!galleries.length)return [];
    const links=rels(galleries[0]);if(!links.length)return [];
    const services=await q('services?select=*&active=eq.true&limit=250');
    const bySlug=new Map(services.filter(s=>slugOK(s.slug)&&s.active===true).map(s=>[s.slug,s]));
    return links.map(id=>bySlug.get(id)).filter(s=>s&&s.title).slice(0,24);
  }
  function createServiceCard(s){
    const a=make('a','lkm31-service-card');a.href='/#/service/'+encodeURIComponent(s.slug);
    a.setAttribute('aria-label','View service: '+text(s.title,100));
    const visual=make('div','lkm31-service-visual');
    const photo=imageURL(s.cover_url);
    if(photo){const img=make('img');img.src=photo;img.alt=text(s.title,120);img.loading='lazy';img.decoding='async';visual.append(img);}
    a.append(visual);
    const category=make('span','lkm31-service-category',text(s.category,55)||'SERVICE');a.append(category);
    const info=make('div','lkm31-service-info');
    info.append(make('h3','',text(s.title,110)));
    const price=packageInfo(s);
    info.append(make('small','lkm31-service-price-label',price.label));
    info.append(make('strong','lkm31-service-price',price.price));
    const features=Array.isArray(s.features)?s.features.filter(t=>typeof t==='string'&&t.trim()).slice(0,3):[];
    if(features.length){
      const ul=make('ul','lkm31-service-benefits');
      for(const f of features)ul.append(make('li','',text(f,120)));
      info.append(ul);
    }else if(s.summary)info.append(make('p','lkm31-service-summary',text(s.summary,180)));
    const cta=make('span','lkm31-service-cta','View service');cta.append(make('span','lkm31-service-arrow','→'));
    info.append(cta);a.append(info);return a;
  }
  const linkedStoryDone=new WeakSet();
  // Phase 32.3: one clear showcase for all project media types.
  // Leaves existing media, links and lightbox handlers untouched.
  function enhanceShowcaseCopy(body){
    const media=body?.querySelector('.lkm-ps-story-media');
    if(!media||media.dataset.lkm31ShowcaseCopy==='yes')return;
    media.dataset.lkm31ShowcaseCopy='yes';
    media.setAttribute('aria-label','Selected work and project materials');
    const intro=make('div','lkm31-showcase-intro');
    intro.append(
      make('p','lkm-ps-kicker','PROJECT SHOWCASE'),
      make('h2','','A closer look at what we created'),
      make('p','lkm31-showcase-description',
        'A selection of photography, films, graphics, design and digital materials from this project.')
    );
    media.prepend(intro);
    const film=media.querySelector('.lkm-ps-film-section');
    const photo=media.querySelector('.lkm-ps-photo-section');
    // A single media type needs no extra subsection heading.
    for(const [section,label] of [[film,'Films & videos'],[photo,'Photos, graphics & visuals']]){
      if(!section)continue;
      section.querySelector('.lkm-ps-kicker')?.remove();
      const heading=section.querySelector('h2');
      if(!heading)continue;
      if(film&&photo)heading.replaceWith(make('h3','lkm31-showcase-subtitle',label));
      else heading.remove();
    }
  }
  function enhancePortfolioStory(){
    if(!isPortfolio)return;
    const m=String(location.hash).match(/^#\/story\/([^?#]+)/);if(!m)return;
    let slug;try{slug=decodeURIComponent(m[1]);}catch{return;}
    if(!slugOK(slug))return;
    const reader=document.getElementById('lkmPortfolioStoryView');
    const body=reader?.querySelector('.lkm-ps-story-body');
    if(!body)return;
    enhanceShowcaseCopy(body);
    if(linkedStoryDone.has(body))return;
    linkedStoryDone.add(body);
    const cover=reader.querySelector('.lkm-ps-story-cover');
    if(cover){cover.tabIndex=0;cover.setAttribute('role','button');cover.setAttribute('aria-label','Enlarge project cover photo');}
    void fetchStoryServices(slug).then(services=>{
      if(!body.isConnected||String(location.hash)!=='#/story/'+slug||!services.length)return;
      const box=make('section','lkm31-story-services');box.setAttribute('aria-label','Services used in this project');
      box.append(make('p','lkm31-label','WHAT WENT INTO THE PROJECT'));
      box.append(make('h2','','Services behind this project'));
      box.append(make('p','lkm31-services-lead','Explore the LilKangooMedia services used to build this project.'));
      const grid=make('div','lkm31-service-grid');
      for(const s of services)grid.append(createServiceCard(s));
      box.append(grid);
      // The user wants these same service-style cards DIRECTLY BELOW the photo/video gallery.
      const media=body.querySelector('.lkm-ps-story-media');
      const cta=body.querySelector('.lkm-case-cta');
      if(media)media.after(box);
      else if(cta)cta.before(box);
      else body.append(box);
    }).catch(()=>{});
  }

  // Phase 31.3: media lightbox. Intercepts story-media clicks in capture phase
  // BEFORE the existing portfolio-stories.mjs inline-video handler or gallery link.
  let lightbox=null,lightboxItems=[],lightboxIndex=0,lightboxReturn=null,bodyOverflow='';
  function readLightboxItems(reader){
    const items=[];
    const elements=reader.querySelectorAll('.lkm-ps-story-media .lkm-ps-film-poster[data-lkm-ps-play],.lkm-ps-story-media .lkm-ps-photo-card');
    for(const el of elements){
      const yt=el.dataset.lkmPsPlay;
      if(ytOK(yt)){
        items.push({type:'video',id:yt,caption:text(el.closest('.lkm-ps-film-card')?.querySelector('.lkm-ps-film-description strong')?.textContent,180)||'Project film',el});
      }else{
        const img=el.querySelector('img');const url=imageURL(img?.getAttribute('src'));
        if(url)items.push({type:'photo',src:url,caption:text(el.querySelector('span')?.textContent,180)||text(img.alt,180),el});
      }
    }
    const cover=reader.querySelector('.lkm-ps-story-cover img');
    const src=imageURL(cover?.getAttribute('src'));
    if(src&&!items.some(i=>i.type==='photo'&&i.src===src)){
      items.unshift({type:'photo',src,caption:text(cover.alt,180)||'Project cover',el:cover.closest('.lkm-ps-story-cover')});
    }
    return items;
  }
  function closeLightbox(){
    if(!lightbox)return;
    const node=lightbox;lightbox=null;node.remove();
    document.body.style.overflow=bodyOverflow;
    if(lightboxReturn?.isConnected&&typeof lightboxReturn.focus==='function')lightboxReturn.focus({preventScroll:true});
    lightboxItems=[];lightboxReturn=null;
  }
  function showLightboxSlide(){
    if(!lightbox||!lightboxItems.length)return;
    const current=lightboxItems[lightboxIndex];
    const frame=lightbox.querySelector('.lkm31-lightbox-stage');frame.replaceChildren();
    if(current.type==='photo'){
      const img=make('img','lkm31-lightbox-photo');img.src=current.src;img.alt=current.caption||'Project photograph';frame.append(img);
    }else{
      const wrap=make('div','lkm31-lightbox-video');
      const iframe=make('iframe');iframe.title=current.caption||'Project video';
      iframe.src='https://www.youtube-nocookie.com/embed/'+current.id+'?autoplay=1&playsinline=1&rel=0';
      iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;
      wrap.append(iframe);frame.append(wrap);
    }
    lightbox.querySelector('.lkm31-lightbox-caption').textContent=current.caption||'';
    lightbox.querySelector('.lkm31-lightbox-count').textContent=(lightboxIndex+1)+' / '+lightboxItems.length;
    lightbox.querySelectorAll('[data-lkm31-step]').forEach(b=>b.hidden=lightboxItems.length<2);
  }
  function stepLightbox(change){
    if(!lightbox||!lightboxItems.length)return;
    lightboxIndex=(lightboxIndex+change+lightboxItems.length)%lightboxItems.length;
    showLightboxSlide();
  }
  function openLightbox(reader,source){
    const items=readLightboxItems(reader);if(!items.length)return;
    closeLightbox();lightboxItems=items;
    lightboxReturn=source;bodyOverflow=document.body.style.overflow;
    const image=source.closest?.('.lkm-ps-story-cover');
    const film=source.closest?.('.lkm-ps-film-card');
    const photo=source.closest?.('.lkm-ps-photo-card');
    const el=film?.querySelector('.lkm-ps-film-poster')||photo||image;
    let idx=items.findIndex(i=>i.el===el);
    if(idx<0&&image){
      const src=imageURL(image.querySelector('img')?.getAttribute('src'));
      idx=items.findIndex(i=>i.type==='photo'&&i.src===src);
    }
    lightboxIndex=idx>=0?idx:0;
    lightbox=make('div','lkm31-lightbox');lightbox.setAttribute('role','dialog');
    lightbox.setAttribute('aria-modal','true');lightbox.setAttribute('aria-label','Project photos and films');
    const windowBox=make('div','lkm31-lightbox-window');
    const close=make('button','lkm31-lightbox-close','×');close.type='button';close.setAttribute('aria-label','Close gallery');
    close.addEventListener('click',closeLightbox);
    const prev=make('button','lkm31-lightbox-prev','‹');prev.type='button';prev.dataset.lkm31Step='prev';prev.setAttribute('aria-label','Previous item');prev.addEventListener('click',()=>stepLightbox(-1));
    const next=make('button','lkm31-lightbox-next','›');next.type='button';next.dataset.lkm31Step='next';next.setAttribute('aria-label','Next item');next.addEventListener('click',()=>stepLightbox(1));
    const stage=make('div','lkm31-lightbox-stage');
    const footer=make('div','lkm31-lightbox-foot');footer.append(make('span','lkm31-lightbox-caption'),make('span','lkm31-lightbox-count'));
    windowBox.append(stage,prev,next,footer,close);lightbox.append(windowBox);
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});
    let startX=0,startY=0;
    lightbox.addEventListener('touchstart',e=>{if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY;}},{passive:true});
    lightbox.addEventListener('touchend',e=>{if(!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)stepLightbox(dx<0?1:-1);},{passive:true});
    document.body.append(lightbox);document.body.style.overflow='hidden';
    showLightboxSlide();close.focus({preventScroll:true});
  }
  if(isPortfolio){
    const reader=document.getElementById('lkmPortfolioStoryView');
    reader?.addEventListener('click',e=>{
      if(!/^#\/story\//.test(location.hash))return;
      const target=e.target.closest('.lkm-ps-photo-card,.lkm-ps-film-poster[data-lkm-ps-play],.lkm-ps-story-cover,.lkm-ps-gallery-link,.lkm-ps-film-description a');
      if(!target||!reader.contains(target))return;
      e.preventDefault();e.stopImmediatePropagation();
      const source=target.classList.contains('lkm-ps-gallery-link')?reader.querySelector('.lkm-ps-photo-card,.lkm-ps-film-poster')||target:target;
      openLightbox(reader,source);
    },true);
    reader?.addEventListener('keydown',e=>{
      if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('lkm-ps-story-cover')){e.preventDefault();openLightbox(reader,e.target);}
    });
    document.addEventListener('keydown',e=>{
      if(!lightbox)return;
      if(e.key==='Escape'){e.preventDefault();closeLightbox();}
      else if(e.key==='ArrowRight'){e.preventDefault();stepLightbox(1);}
      else if(e.key==='ArrowLeft'){e.preventDefault();stepLightbox(-1);}
      else if(e.key==='Tab'){
        const controls=[...lightbox.querySelectorAll('button:not([hidden])')];
        const first=controls[0],last=controls[controls.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{
    scheduled=false;if(isSpa){showHome();enhanceService();}if(isPortfolio)enhancePortfolioStory();
  });}
  const root=isSpa?document.getElementById('main'):document.getElementById('lkmPortfolioStoryView');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>{closeLightbox();if(isSpa){homeData=null;homeLoading=false;extraSlug='';extraPending=false;extraData=[];}schedule();});
  schedule();
})();
