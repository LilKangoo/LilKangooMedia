/* Phase 19 — dynamic OpenGraph landing page for shareable service/gallery links.
 * Uses public Supabase records, never service-role credentials. No database writes.
 * Social crawlers see page-specific metadata; browsers continue to the existing SPA.
 */
'use strict';
const SITE='https://lilkangoomedia.com';
// Public publishable key copied from the public lkm-config.js currently in the repository.
// Prefer environment values SUPABASE_URL/SUPABASE_ANON_KEY if configured in Netlify.
const FALLBACK_URL='https://nvronzbkvwyyllbuidhw.supabase.co';
const FALLBACK_PUBLIC_KEY='sb_publishable_CSAqkjuGdGB54y4a2_vf9w_mYtPIIJO';
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sanitize=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const safeSlug=s=>/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(String(s||''));
const safeImage=x=>{try{if(!x)return '';const u=new URL(x,SITE);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
const response=(statusCode,body,headers={})=>({statusCode,headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=120, s-maxage=300',...headers},body});
const errorPage=(code,msg)=>response(code,'<!doctype html><html lang="en"><meta charset="utf-8"><title>Link unavailable</title><meta name="robots" content="noindex"><p>'+escapeHtml(msg)+'</p><a href="/">Return to LilKangooMedia</a></html>',{'Cache-Control':'no-store'});
async function get(api,key,path){
 const res=await fetch(api+'/rest/v1/'+path,{headers:{apikey:key,'Content-Type':'application/json'},signal:AbortSignal.timeout(7000)});
 if(!res.ok)throw new Error('Public catalog HTTP '+res.status);
 return res.json();
}
export const handler=async function(event){
 const kind=event.queryStringParameters?.kind,slug=event.queryStringParameters?.slug;
 if(!['service','gallery'].includes(kind)||!safeSlug(slug))return errorPage(400,'Invalid share link.');
 const supabase=(process.env.SUPABASE_URL||FALLBACK_URL).replace(/\/$/,'');
 const key=process.env.SUPABASE_ANON_KEY||FALLBACK_PUBLIC_KEY;
 let title='',description='',image='',direct='';
 try{
  if(kind==='service'){
   const rows=await get(supabase,key,'services?select=slug,title,summary,description,cover_url&active=eq.true&slug=eq.'+encodeURIComponent(slug)+'&limit=1');
   const s=rows?.[0];if(!s)return errorPage(404,'This service is not currently published.');
   title=sanitize(s.title)+' | LilKangooMedia';description=sanitize(s.summary||s.description||'Photography and creative services in Cyprus.').slice(0,300);
   image=safeImage(s.cover_url);direct=SITE+'/#/service/'+encodeURIComponent(s.slug);
  }else{
   const rows=await get(supabase,key,'portfolio_galleries?select=id,slug,title,description,cover_image_id&visibility=eq.public&slug=eq.'+encodeURIComponent(slug)+'&limit=1');
   const g=rows?.[0];if(!g)return errorPage(404,'This gallery is not currently published.');
   title=sanitize(g.title)+' | LilKangooMedia Portfolio';description=sanitize(g.description||'Explore photography and visual stories from LilKangooMedia.').slice(0,300);
   const images=await get(supabase,key,'portfolio_images?select=id,image_url&visibility=eq.public&gallery_id=eq.'+encodeURIComponent(g.id)+'&order=display_order.asc&limit=100');
   const photo=images.find(p=>p.id===g.cover_image_id)||images[0];image=safeImage(photo?.image_url);
   if(!image){try{const vids=await get(supabase,key,'media_videos?select=youtube_id&visibility=eq.public&gallery_id=eq.'+encodeURIComponent(g.id)+'&limit=1');if(/^[a-zA-Z0-9_-]{11}$/.test(vids?.[0]?.youtube_id||''))image='https://img.youtube.com/vi/'+vids[0].youtube_id+'/hqdefault.jpg';}catch{}}
   direct=SITE+'/portfolio.html#/gallery/'+encodeURIComponent(g.slug);
  }
 }catch(err){console.error('Link preview unavailable:',err);return errorPage(503,'Preview temporarily unavailable. Please try again shortly.');}
 const share=SITE+'/share/'+kind+'/'+encodeURIComponent(slug);
 const ogImg=image||SITE+'/assets/images/home-meta.jpg';
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="noindex,follow">
<link rel="canonical" href="${escapeHtml(direct)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="LilKangooMedia"><meta property="og:url" content="${escapeHtml(share)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${escapeHtml(ogImg)}"><meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(ogImg)}">
<script>window.location.replace(${JSON.stringify(direct)});</script></head><body><p>Opening <a href="${escapeHtml(direct)}">${escapeHtml(title)}</a>…</p></body></html>`;
 return response(200,html);
};
