/* LilKangooMedia Phase 22.3 — PUBLIC, APPROVED case studies only.
 * Draft rows are inaccessible to anon thanks to Supabase RLS.
 * Never fabricates project details, achievements, or clients.
 */
import {clean,slugOK,imageURL,youtubeID,publishedCase,selectedPhotos} from './case-studies-data.mjs';
const root=document.getElementById('lkmCasesPublic');
const cfg=window.LKM_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');
const key=String(cfg.SUPABASE_ANON_KEY||'');
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const state={cases:[],galleries:new Map(),photos:[],videos:[],error:''};
function link(label,href,cls='') {const a=make('a',cls,label);a.href=href;return a;}
function heading(label,title,description=''){
  const block=make('div','lkm-case-hero');const wrap=make('div','lkm-case-wrap');
  wrap.append(make('p','lkm-case-kicker',label),make('h1','',title));
  if(description)wrap.append(make('p','',description));
  block.append(wrap);return block;
}
function message(title,detail){root.replaceChildren(heading('LILKANGOOMEDIA · CASE STUDIES',title,detail));const wrap=make('div','lkm-case-wrap');wrap.append(link('Browse all photography and video work ↗','/portfolio.html','button button-dark'));root.append(wrap);}
async function api(path){
  const res=await fetch(base+'/rest/v1/'+path,{headers:{apikey:key,Accept:'application/json'},cache:'no-store'});
  if(!res.ok)throw Error('Portfolio data temporarily unavailable');
  const rows=await res.json();if(!Array.isArray(rows))throw Error('Invalid portfolio data');return rows;
}
async function load(){
  if(!base.startsWith('https://')||!key){state.error='Supabase is not configured';return;}
  try{
    const [stories,galleries]=await Promise.all([
      api('lkm_case_studies?select=*&is_published=eq.true&order=updated_at.desc&limit=1000'),
      api('portfolio_galleries?select=id,slug,title,category,description,related_service_slug,visibility,cover_image_id&visibility=eq.public&limit=1000')
    ]);
    state.galleries=new Map(galleries.map(g=>[g.id,g]));
    state.cases=stories.filter(s=>publishedCase(s,state.galleries.get(s.gallery_id)));
    if(!state.cases.length)return;
    const ids=state.cases.map(s=>s.gallery_id).filter(Boolean);
    const values=ids.slice(0,100).join(',');
    const [photos,videos]=await Promise.all([
      api('portfolio_images?select=id,gallery_id,image_url,alt_text,caption,display_order,visibility&gallery_id=in.('+values+')&visibility=eq.public&order=display_order.asc&limit=1000').catch(()=>[]),
      api('media_videos?select=id,gallery_id,youtube_id,title,display_order,visibility&gallery_id=in.('+values+')&visibility=eq.public&order=display_order.asc&limit=500').catch(()=>[])
    ]);
    state.photos=photos;state.videos=videos;
  }catch(e){state.error=e.message||'Unable to load case studies';}
}
function publicCaseFromSlug(slug){return state.cases.find(s=>state.galleries.get(s.gallery_id)?.slug===slug);}
function imageFor(story){
  const gallery=state.galleries.get(story.gallery_id);const photos=selectedPhotos(state.photos,gallery);
  const cover=photos.find(p=>p.id===gallery.cover_image_id)||photos[0];
  if(cover)return {url:imageURL(cover.image_url),alt:clean(cover.alt_text,160)||gallery.title};
  const clip=state.videos.find(v=>v.gallery_id===story.gallery_id&&youtubeID(v.youtube_id));
  return clip?{url:'https://i.ytimg.com/vi/'+clip.youtube_id+'/hqdefault.jpg',alt:clean(clip.title,160)||gallery.title}:{url:'',alt:''};
}
function listView(){
  document.title='Case Studies & Creative Projects | LilKangooMedia Cyprus';
  root.replaceChildren(heading('DOCUMENTED PROJECTS · CYPRUS','Stories behind the work','Real projects, actual creative decisions and documented outcomes. Each story is published by our team.'));
  const wrap=make('div','lkm-case-wrap lkm-case-section');
  if(state.error){wrap.append(make('p','lkm-case-empty','Case studies are temporarily unavailable. You can still explore our portfolio.'));wrap.append(link('Browse portfolio ↗','/portfolio.html','button button-dark'));root.append(wrap);return;}
  if(!state.cases.length){wrap.append(make('p','lkm-case-empty','We are preparing our documented project stories. Browse our existing photography and video galleries in the meantime.'));wrap.append(link('Browse our portfolio ↗','/portfolio.html','button button-dark'));root.append(wrap);return;}
  const grid=make('div','lkm-case-cards');
  for(const story of state.cases){
    const g=state.galleries.get(story.gallery_id);const a=link('',`/case-studies.html#/${encodeURIComponent(g.slug)}`,'lkm-case-card');
    const photo=imageFor(story);const pic=make('div','lkm-case-card-image');
    if(photo.url){const image=make('img');image.src=photo.url;image.alt=photo.alt;image.loading='lazy';image.decoding='async';pic.append(image);}
    else pic.append(make('span','','Project story'));
    const info=make('div','lkm-case-card-info');
    info.append(make('p','lkm-case-kicker',clean(g.category,80)||'PROJECT'),make('h2','',clean(story.headline,180)||g.title));
    info.append(make('p','',clean(story.objective,200)));
    const foot=make('div','lkm-case-card-foot');
    if(story.project_year)foot.append(make('span','',String(story.project_year)));
    if(story.project_location)foot.append(make('span','',clean(story.project_location,120)));
    foot.append(make('strong','','Read the story ↗'));info.append(foot);a.append(pic,info);grid.append(a);
  }
  wrap.append(grid);root.append(wrap);
}
function section(title,body,cls=''){
  if(!clean(body))return null;
  const container=make('section','lkm-case-prose '+cls);container.append(make('h2','',title),make('p','',clean(body,3500)));return container;
}
function detailView(slug){
  const story=publicCaseFromSlug(slug);
  if(!story){message('Project story not available','This case study is not published or the link is incorrect.');return;}
  const g=state.galleries.get(story.gallery_id);
  document.title=(story.headline||g.title)+' | LilKangooMedia Project';
  root.replaceChildren();
  const nav=make('nav','lkm-case-wrap lkm-case-breadcrumb');nav.setAttribute('aria-label','Breadcrumb');nav.append(link('All case studies','/case-studies.html'),make('span','',' / '+g.title));root.append(nav);
  root.append(heading((g.category||'CREATIVE PROJECT')+' · LILKANGOOMEDIA',story.headline||g.title,story.client_label?'Client: '+clean(story.client_label,140):''));
  const outer=make('div','lkm-case-wrap lkm-case-detail');
  const meta=make('div','lkm-case-meta');
  if(story.project_location)meta.append(make('span','','Location: '+clean(story.project_location,120)));
  if(story.project_year)meta.append(make('span','','Year: '+story.project_year));
  if(g.related_service_slug && slugOK(g.related_service_slug))meta.append(link('Explore this service ↗','/#/service/'+encodeURIComponent(g.related_service_slug)));
  if(meta.children.length)outer.append(meta);
  const overview=make('div','lkm-case-narrative');
  for(const block of [section('The objective',story.objective),section('Our approach',story.approach)])if(block)overview.append(block);
  outer.append(overview);
  const deliverables=Array.isArray(story.deliverables)?story.deliverables.filter(x=>typeof x==='string'&&clean(x,160)).slice(0,18):[];
  if(deliverables.length){const sec=make('section','lkm-case-deliverables');sec.append(make('h2','','What we delivered'));
    const list=make('ul');deliverables.forEach(d=>list.append(make('li','',clean(d,160))));sec.append(list);outer.append(sec);}
  if(clean(story.outcomes)){const result=section('Documented outcome',story.outcomes,'lkm-case-outcome');if(result)outer.append(result);}
  const photos=selectedPhotos(state.photos,g).slice(0,12);
  const clips=state.videos.filter(v=>v.gallery_id===g.id&&youtubeID(v.youtube_id)).slice(0,6);
  if(photos.length||clips.length){
    const gallery=make('section','lkm-case-visuals');gallery.append(make('h2','','Project imagery & films'));
    const grid=make('div','lkm-case-media-grid');
    for(const photo of photos){const a=link('',`/portfolio.html#/gallery/${encodeURIComponent(g.slug)}`,'lkm-case-media-item');
      const pic=make('img');pic.src=imageURL(photo.image_url);pic.alt=clean(photo.alt_text,200)||g.title;pic.loading='lazy';pic.decoding='async';a.append(pic);
      if(photo.caption)a.append(make('span','',clean(photo.caption,180)));grid.append(a);}
    for(const video of clips){const a=link('','https://www.youtube.com/watch?v='+video.youtube_id,'lkm-case-media-item lkm-case-video');a.target='_blank';a.rel='noopener noreferrer';
      const pic=make('img');pic.src=`https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`;pic.alt=clean(video.title,180)||'Watch video';pic.loading='lazy';a.append(pic,make('span','','▶ '+(clean(video.title,110)||'Watch film')));grid.append(a);}
    gallery.append(grid);gallery.append(link('Open full project gallery ↗',`/portfolio.html#/gallery/${encodeURIComponent(g.slug)}`,'lkm-case-gallery-link'));outer.append(gallery);
  }
  const cta=make('aside','lkm-case-cta');cta.append(make('h2','','Planning a similar project?'));
  cta.append(make('p','','We can discuss the objectives, schedule and creative scope for your business or personal project.'));
  const actions=make('div','lkm-case-cta-actions');actions.append(link('Explore our services ↗','/#/services','button button-orange'),link('Send an enquiry ↗','/#/contact','button button-light'));cta.append(actions);outer.append(cta);
  root.append(outer);
}
function route(){let path='';try{path=decodeURIComponent(location.hash.replace(/^#\/?/,''))}catch{path=''};
  if(slugOK(path))detailView(path);else listView();}
await load();route();window.addEventListener('hashchange',route);
