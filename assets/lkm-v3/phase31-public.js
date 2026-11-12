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
    const [cases,galleries]=await Promise.all([
      q('lkm_case_studies?select=gallery_id,headline,objective,project_location,project_year,is_published,updated_at&is_published=eq.true&order=updated_at.desc&limit=20'),
      q('portfolio_galleries?select=id,slug,title,category,visibility,cover_image_id&visibility=eq.public&limit=300')
    ]);
    const galleriesById=new Map(galleries.filter(g=>uuidOK(g.id)&&slugOK(g.slug)).map(g=>[g.id,g]));
    const actual=cases.filter(st=>st.is_published===true&&galleriesById.has(st.gallery_id)).slice(0,3);
    if(!actual.length)return [];
    const ids=actual.map(st=>st.gallery_id).join(',');
    const [photos,videos]=await Promise.all([
      q(`portfolio_images?select=id,gallery_id,image_url,alt_text,display_order,visibility&gallery_id=in.(${ids})&visibility=eq.public&order=display_order.asc&limit=120`).catch(()=>[]),
      q(`media_videos?select=gallery_id,youtube_id,title,display_order,visibility&gallery_id=in.(${ids})&visibility=eq.public&order=display_order.asc&limit=60`).catch(()=>[])
    ]);
    return actual.map(st=>({story:st,gallery:galleriesById.get(st.gallery_id),media:mediaFor(galleriesById.get(st.gallery_id),photos,videos)}));
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
    section.append(grid);return section;
  }
  function showHome(){
    if(!isSpa||!homeVisible())return;
    const root=document.getElementById('main');const work=root?.querySelector('.portfolio-grid');
    if(!work||root.querySelector('#lkm31-home-stories'))return;
    if(homeData){if(homeData.length)work.after(buildHomeCards(homeData));return;}
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
  async function fetchStoryServices(slug){
    const galleries=await q(`portfolio_galleries?select=slug,id,related_service_slug,related_service_slugs&slug=eq.${encodeURIComponent(slug)}&visibility=eq.public&limit=1`);
    if(!galleries.length)return [];
    const links=rels(galleries[0]);if(!links.length)return [];
    const services=await q('services?select=slug,title,active&active=eq.true&limit=200');
    return services.filter(s=>slugOK(s.slug)&&links.includes(s.slug)&&s.title);
  }
  const linkedStoryDone=new WeakSet();
  function enhancePortfolioStory(){
    if(!isPortfolio)return;
    const m=String(location.hash).match(/^#\/story\/([^?#]+)/);if(!m)return;
    let slug;try{slug=decodeURIComponent(m[1]);}catch{return;}
    if(!slugOK(slug))return;
    const reader=document.getElementById('lkmPortfolioStoryView');
    const body=reader?.querySelector('.lkm-ps-story-body');
    if(!body||linkedStoryDone.has(body))return;
    linkedStoryDone.add(body);
    void fetchStoryServices(slug).then(services=>{
      if(!body.isConnected||!services.length)return;
      const box=make('section','lkm31-story-services');box.setAttribute('aria-label','Services used in this project');
      box.append(make('p','lkm31-label','WHAT WENT INTO THE PROJECT'),make('h2','', 'Related creative services'));
      const list=make('div','lkm31-service-links');
      for(const s of services){const a=make('a','',text(s.title,100)+' ↗');a.href='/#/service/'+encodeURIComponent(s.slug);list.append(a);}
      box.append(list);
      // Put the services near the START of the story, before long prose,
      // outcome metrics and the photography/video gallery. This is a presentation
      // change only: the links still come from existing published Supabase data.
      const narrative=body.querySelector('.lkm-case-narrative');
      const outcomes=body.querySelector('.lkm-case-outcome');
      const media=body.querySelector('.lkm-ps-story-media');
      const cta=body.querySelector('.lkm-case-cta');
      const anchor=narrative||outcomes||media||cta;
      if(anchor)anchor.before(box);
      else body.prepend(box);
    }).catch(()=>{});
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{
    scheduled=false;if(isSpa){showHome();enhanceService();}if(isPortfolio)enhancePortfolioStory();
  });}
  const root=isSpa?document.getElementById('main'):document.getElementById('lkmPortfolioStoryView');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>{if(isSpa){homeData=null;homeLoading=false;extraSlug='';extraPending=false;extraData=[];}schedule();});
  schedule();
})();
