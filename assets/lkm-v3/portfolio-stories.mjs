/* LilKangooMedia — Portfolio Stories: published project stories inside /portfolio.html.
 * Read-only Supabase access; additive to the existing gallery SPA, with no CMS/Stripe writes.
 * Existing /case-studies.html links remain functional for backwards compatibility.
 */
import {clean,slugOK,imageURL,youtubeID,publishedCase,selectedPhotos} from './case-studies-data.mjs';

const galleryRoot=document.getElementById('cmsPublic');
const reader=document.getElementById('lkmPortfolioStoryView');
if(!galleryRoot || !reader || document.body.dataset.cmsPage!=='portfolio') {
  throw new Error('Portfolio Stories must be loaded only on the portfolio page.');
}
const cfg=window.LKM_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');
const key=String(cfg.SUPABASE_ANON_KEY||'');
const state={loading:true,stories:[],galleries:new Map(),images:[],videos:[],error:'',readerSlug:null};
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const anchor=(label,href,cls)=>{const n=node('a',cls||'',label);n.href=href;return n;};
const validUUID=x=>typeof x==='string'&&/^[0-9a-f-]{36}$/i.test(x);
const listRoute=()=>!location.hash||location.hash==='#/'||location.hash==='#';
const storiesRoute=()=>location.hash==='#/stories';
function storySlug(){
  const match=String(location.hash).match(/^#\/story\/([^?#]+)$/);
  if(!match)return '';
  try {const slug=decodeURIComponent(match[1]);return slugOK(slug)?slug:'';}catch{return '';}
}
function gallerySlug(){
  const match=String(location.hash).match(/^#\/gallery\/([^?#]+)$/);
  if(!match)return '';
  try {const slug=decodeURIComponent(match[1]);return slugOK(slug)?slug:'';}catch{return '';}
}
const storyLink=slug=>'#/story/'+encodeURIComponent(slug);
const galleryLink=slug=>'#/gallery/'+encodeURIComponent(slug);
const storyForSlug=slug=>state.stories.find(story=>state.galleries.get(story.gallery_id)?.slug===slug);
function getMedia(story){
  const g=state.galleries.get(story.gallery_id);
  const photos=selectedPhotos(state.images,g);
  const videos=state.videos.filter(v=>v.gallery_id===g.id&&v.visibility==='public'&&youtubeID(v.youtube_id))
    .sort((a,b)=>(Number(a.display_order)||100)-(Number(b.display_order)||100));
  const cover=photos.find(p=>p.id===g.cover_image_id)||photos[0];
  return {photos,videos,image:cover?imageURL(cover.image_url):videos[0]?'https://i.ytimg.com/vi/'+videos[0].youtube_id+'/hqdefault.jpg':'',
    alt:cover?clean(cover.alt_text,170)||g.title:videos[0]?clean(videos[0].title,170)||g.title:g.title};
}
async function api(path){
  const r=await fetch(base+'/rest/v1/'+path,{headers:{apikey:key,Accept:'application/json'},cache:'no-store'});
  if(!r.ok)throw Error('Published project stories could not be loaded.');
  const data=await r.json();if(!Array.isArray(data))throw Error('Unexpected project-story response.');return data;
}
async function load(){
  if(!base.startsWith('https://')||!key){state.error='Project stories are temporarily unavailable.';state.loading=false;state.readerSlug=null;sync();return;}
  try{
    const [cases,galleries]=await Promise.all([
      api('lkm_case_studies?select=*&is_published=eq.true&order=updated_at.desc&limit=1000'),
      api('portfolio_galleries?select=id,slug,title,category,description,client_name,related_service_slug,visibility,cover_image_id&visibility=eq.public&limit=1000')
    ]);
    state.galleries=new Map(galleries.filter(g=>validUUID(g.id)&&slugOK(g.slug)).map(g=>[g.id,g]));
    state.stories=cases.filter(s=>publishedCase(s,state.galleries.get(s.gallery_id)));
    if(state.stories.length){
      // Bound the requested gallery ids. Public RLS still enforces visibility.
      const ids=state.stories.map(s=>s.gallery_id).filter(validUUID).slice(0,100).join(',');
      const [images,videos]=await Promise.all([
        api('portfolio_images?select=id,gallery_id,image_url,alt_text,caption,display_order,visibility&gallery_id=in.('+ids+')&visibility=eq.public&order=display_order.asc&limit=1000').catch(()=>[]),
        api('media_videos?select=id,gallery_id,youtube_id,title,display_order,visibility&gallery_id=in.('+ids+')&visibility=eq.public&order=display_order.asc&limit=500').catch(()=>[])
      ]);
      state.images=images;state.videos=videos;
    }
  }catch(e){state.error=String(e?.message||'Project stories are temporarily unavailable.');}
  state.loading=false;
  state.readerSlug=null; // replace any loading placeholder with the fetched story
  sync();
}
function makeNav(active){
  const nav=node('nav','lkm-ps-nav');nav.id='lkmPortfolioSections';nav.setAttribute('aria-label','Portfolio sections');
  const tabs=[
    {href:'#/',eyebrow:'PHOTO · FILM · DESIGN',title:'Visual galleries',icon:'▦',selected:active==='galleries'},
    {href:'#/stories',eyebrow:'PROJECT JOURNAL',title:'Stories behind the work',icon:'↗',selected:active==='stories'}
  ];
  for(const tab of tabs){
    const a=anchor('',tab.href,'lkm-ps-nav-link'+(tab.selected?' is-current':''));
    if(tab.selected)a.setAttribute('aria-current','page');
    a.append(node('span','lkm-ps-nav-icon',tab.icon));
    const c=node('span','lkm-ps-nav-copy');c.append(node('small','',tab.eyebrow),node('strong','',tab.title));a.append(c);nav.append(a);
  }
  return nav;
}
function storyCard(story){
  const g=state.galleries.get(story.gallery_id);
  const media=getMedia(story);
  const a=anchor('',storyLink(g.slug),'lkm-ps-card');
  const art=node('div','lkm-ps-card-visual');
  if(media.image){const img=node('img');img.src=media.image;img.alt=media.alt;img.loading='lazy';img.decoding='async';art.append(img);}
  else art.append(node('span','lkm-ps-card-no-image','Project story'));
  art.append(node('span','lkm-ps-card-badge','CASE STUDY'));
  const body=node('div','lkm-ps-card-copy');
  body.append(node('small','lkm-ps-card-category',clean(g.category,60)||'CREATIVE PROJECT'));
  body.append(node('h3','',clean(story.headline,180)||g.title));
  body.append(node('p','',clean(story.objective,210)));
  const foot=node('div','lkm-ps-card-foot');
  const place=[story.project_location?clean(story.project_location,120):'',story.project_year?String(story.project_year):''].filter(Boolean).join(' · ');
  foot.append(node('span','',place),node('strong','','Read project story ↗'));
  body.append(foot);a.append(art,body);return a;
}
function storiesSection(full){
  const section=node('section','lkm-ps-stories'+(full?' is-full':''));section.id='lkmPortfolioStories';
  section.setAttribute('aria-labelledby','lkmPortfolioStoriesTitle');
  const head=node('div','lkm-ps-section-head');
  const labels=node('div');
  labels.append(node('p','lkm-ps-kicker','THE PROCESS BEHIND THE PROJECTS'));
  labels.append(node('h2','', 'Stories behind the work'));
  labels.querySelector('h2').id='lkmPortfolioStoriesTitle';
  labels.append(node('p','lkm-ps-intro','Go beyond the final image. Explore real collaborations, the creative approach and the materials we delivered.'));
  head.append(labels);
  if(!full&&state.stories.length){head.append(anchor('View all stories ↗','#/stories','lkm-ps-view-all'));}
  section.append(head);
  if(state.loading){section.append(node('p','lkm-ps-empty','Loading published project stories…'));return section;}
  if(state.error){section.append(node('p','lkm-ps-empty','Project stories are temporarily unavailable. The photography and film galleries are still available.'));return section;}
  if(!state.stories.length){section.append(node('p','lkm-ps-empty','We are preparing our project stories. Browse the galleries in the meantime.'));return section;}
  const grid=node('div','lkm-ps-cards');
  for(const story of (full?state.stories:state.stories.slice(0,3)))grid.append(storyCard(story));
  section.append(grid);return section;
}
function showGalleryStoryLink(){
  const slug=gallerySlug();if(!slug)return;
  const story=storyForSlug(slug);if(!story)return;
  const grid=galleryRoot.querySelector('.cms-gallery-grid');
  if(!grid||galleryRoot.querySelector('#lkmPortfolioGalleryStory'))return;
  const callout=node('div','lkm-ps-gallery-story');callout.id='lkmPortfolioGalleryStory';
  const copy=node('div');copy.append(node('strong','','The story behind this project'));
  copy.append(node('p','','Discover the brief, how we worked and what was delivered.'));
  callout.append(copy,anchor('Read the project story ↗',storyLink(slug),'lkm-ps-gallery-story-cta'));
  grid.before(callout);
}
function prose(title,body){
  if(!clean(body))return null;
  const section=node('section','lkm-case-prose');section.append(node('h2','',title),node('p','',clean(body,3500)));return section;
}
function videoCard(v){
  const card=node('article','lkm-ps-film-card');
  const btn=node('button','lkm-ps-film-poster');btn.type='button';btn.dataset.lkmPsPlay=v.youtube_id;
  btn.setAttribute('aria-label','Play '+(clean(v.title,180)||'project film'));
  const pic=node('img');pic.src='https://i.ytimg.com/vi/'+v.youtube_id+'/hqdefault.jpg';pic.alt='';pic.loading='lazy';
  btn.append(pic,node('span','lkm-ps-play-icon','▶ Play film'));
  const foot=node('div','lkm-ps-film-description');
  foot.append(node('strong','',clean(v.title,180)||'Project film'));
  const link=anchor('YouTube ↗','https://www.youtube.com/watch?v='+v.youtube_id);link.target='_blank';link.rel='noopener noreferrer';foot.append(link);
  card.append(btn,foot);return card;
}
function renderReader(slug){
  if(state.readerSlug===slug&&reader.hasChildNodes())return;
  state.readerSlug=slug;reader.replaceChildren();
  if(state.loading){reader.append(node('p','lkm-ps-loading','Loading project story…'));return;}
  const story=storyForSlug(slug);
  if(!story){
    const empty=node('div','lkm-ps-reader-empty');empty.append(node('h1','','This project story is unavailable'));
    empty.append(node('p','',state.error?'The stories could not be loaded right now.':'The story may be unpublished or the link may be incorrect.'));
    empty.append(anchor('← Back to Portfolio','#/stories','button button-dark'));
    reader.append(empty);return;
  }
  const g=state.galleries.get(story.gallery_id),media=getMedia(story);
  document.title=(clean(story.headline,180)||g.title)+' | Portfolio — LilKangooMedia';
  const crumb=node('nav','lkm-case-wrap lkm-case-breadcrumb');crumb.setAttribute('aria-label','Breadcrumb');
  crumb.append(anchor('Portfolio','#/'),node('span','',' / '),anchor('Project stories','#/stories'),node('span','',' / '+g.title));reader.append(crumb);
  const hero=node('header','lkm-ps-story-hero');
  const intro=node('div','lkm-case-wrap');intro.append(node('p','lkm-case-kicker','PORTFOLIO / STORIES BEHIND THE WORK'));
  intro.append(node('h1','',clean(story.headline,180)||g.title));
  const client=clean(story.client_label,140)||clean(g.client_name,140);
  if(client)intro.append(node('p','lkm-ps-story-client','Client · '+client));
  const chips=node('div','lkm-ps-story-meta');
  if(story.project_location)chips.append(node('span','',story.project_location));
  if(story.project_year)chips.append(node('span','',String(story.project_year)));
  if(g.category)chips.append(node('span','',g.category));
  intro.append(chips);hero.append(intro);
  if(media.image){const visual=node('div','lkm-ps-story-cover');const image=node('img');image.src=media.image;image.alt=media.alt;image.decoding='async';visual.append(image);hero.append(visual);}
  reader.append(hero);
  const body=node('div','lkm-case-wrap lkm-ps-story-body');
  const narrative=node('div','lkm-case-narrative');
  for(const block of [prose('The objective',story.objective),prose('Our approach',story.approach)])if(block)narrative.append(block);
  body.append(narrative);
  const deliverables=Array.isArray(story.deliverables)?story.deliverables.filter(x=>typeof x==='string'&&clean(x,160)).slice(0,18):[];
  if(deliverables.length){const sec=node('section','lkm-case-deliverables');sec.append(node('h2','','What we delivered'));const list=node('ul');deliverables.forEach(t=>list.append(node('li','',clean(t,160))));sec.append(list);body.append(sec);}
  if(story.outcomes){const outcome=prose('Documented outcome',story.outcomes);if(outcome){outcome.classList.add('lkm-case-outcome');body.append(outcome);}}
  if(media.videos.length||media.photos.length){
    const visual=node('section','lkm-ps-story-media');visual.setAttribute('aria-label','Project films and photography');
    if(media.videos.length){
      const sec=node('section','lkm-ps-film-section');sec.append(node('p','lkm-ps-kicker','WATCH THE WORK'),node('h2','','Project films'));
      const grid=node('div','lkm-ps-film-grid');
      const clips=media.videos.slice(0,6);
      // Eléa Golf Club: guaranteed featured sequence (full flyover, then Short).
      if(slug==='elea-golf-club')clips.sort((a,b)=>(a.youtube_id==='y1CB22Z-Qm4'?-2:a.youtube_id==='kU3ACgDkxDo'?-1:0)-(b.youtube_id==='y1CB22Z-Qm4'?-2:b.youtube_id==='kU3ACgDkxDo'?-1:0));
      clips.forEach(v=>grid.append(videoCard(v)));sec.append(grid);visual.append(sec);
    }
    if(media.photos.length){
      const sec=node('section','lkm-ps-photo-section');sec.append(node('p','lkm-ps-kicker','THE IMAGES'),node('h2','','Selected photography'));
      const grid=node('div','lkm-ps-photo-grid');
      for(const photo of media.photos.slice(0,12)){
        const a=anchor('',galleryLink(g.slug),'lkm-ps-photo-card');const im=node('img');im.src=imageURL(photo.image_url);im.alt=clean(photo.alt_text,200)||g.title;im.loading='lazy';im.decoding='async';a.append(im);if(photo.caption)a.append(node('span','',clean(photo.caption,180)));grid.append(a);
      }
      sec.append(grid);sec.append(anchor('View the full photo & video gallery ↗',galleryLink(g.slug),'lkm-ps-gallery-link'));visual.append(sec);
    }else if(media.videos.length){visual.append(anchor('Open the full project gallery ↗',galleryLink(g.slug),'lkm-ps-gallery-link'));}
    body.append(visual);
  }
  const cta=node('aside','lkm-case-cta');cta.append(node('p','lkm-ps-kicker','LET’S CREATE SOMETHING'),node('h2','','Planning a similar project?'));
  cta.append(node('p','','Photography, film and creative production for people and businesses across Cyprus. Tell us what you have in mind.'));
  const actions=node('div','lkm-case-cta-actions');actions.append(anchor('Explore our services ↗','/#/services','button button-orange'),anchor('Start a project ↗','/#/contact','button button-light'));
  cta.append(actions);body.append(cta);
  reader.append(body);
}
function sync(){
  const selected=storySlug();
  if(selected){
    galleryRoot.hidden=true;reader.hidden=false;
    document.documentElement.classList.remove('lkm-ps-stories-only');
    renderReader(selected);return;
  }
  galleryRoot.hidden=false;reader.hidden=true;state.readerSlug=null;
  const full=storiesRoute();
  document.documentElement.classList.toggle('lkm-ps-stories-only',full);
  if(full)document.title='Stories Behind the Work | LilKangooMedia Portfolio';
  const isHome=listRoute()||full;
  if(isHome){
    // The existing CMS replaces #cmsPublic children when filtering or navigating.
    // Reattach only after the original gallery DOM has actually rendered.
    const first=galleryRoot.querySelector('.cms-pub-chips,.cms-pub-grid,.cms-pub-empty');
    if(first){
      const nav=galleryRoot.querySelector('#lkmPortfolioSections');
      if(nav){const current=nav.querySelector('[aria-current="page"]');const desired=full?'#/stories':'#/';if(current?.getAttribute('href')!==desired)nav.replaceWith(makeNav(full?'stories':'galleries'));}
      else first.before(makeNav(full?'stories':'galleries'));
      const existing=galleryRoot.querySelector('#lkmPortfolioStories');
      if(existing){if(existing.classList.contains('is-full')!==full||existing.dataset.storyCount!==String(state.stories.length)||existing.dataset.loading!==String(state.loading))existing.replaceWith(storiesSection(full));}
      else galleryRoot.append(storiesSection(full));
      const section=galleryRoot.querySelector('#lkmPortfolioStories');if(section){section.dataset.storyCount=String(state.stories.length);section.dataset.loading=String(state.loading);}
    }
  }else if(gallerySlug())showGalleryStoryLink();
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync();});}
new MutationObserver(schedule).observe(galleryRoot,{childList:true});
window.addEventListener('hashchange',schedule);
reader.addEventListener('click',e=>{
  const button=e.target.closest('[data-lkm-ps-play]');if(!button)return;
  const id=button.dataset.lkmPsPlay;if(!youtubeID(id))return;
  const video=node('div','lkm-ps-film-player');
  const iframe=node('iframe');iframe.title=button.getAttribute('aria-label')||'Project video';
  iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0';
  iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;
  if(id==='kU3ACgDkxDo')video.classList.add('is-short');
  video.append(iframe);button.replaceWith(video);
});
sync();void load();
