/**
 * LilKangooMedia YouTube channel importer for Netlify Functions.
 * POST /api/youtube-channel-sync, admin Bearer token required.
 * All video metadata is read from the official YouTube RSS/Data API on the server.
 * No fabricated titles, videos or category assignments.
 */
const CHANNEL_ID = 'UCgIrKPHFpPy6srhdq4SjEtw';
const CHANNEL_HANDLE = '@lilKangooMedia';
const GALLERY_SLUG = 'video-portfolio';
const json = (status, value) => new Response(JSON.stringify(value), {
  status,
  headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
});
const validId = s => /^[A-Za-z0-9_-]{11}$/.test(String(s||''));
const xmlText = value => String(value||'').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/,'$1').replace(/&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos);/gi,(_m,entity)=>{
  const code = entity.toLowerCase();
  if(code.startsWith('#')) {const n = code.startsWith('#x')?parseInt(code.slice(2),16):parseInt(code.slice(1),10);return Number.isFinite(n)&&n>=32&&n<=0x10ffff?String.fromCodePoint(n):'';}
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[code]||'';
});
const tag = (s,t) => xmlText(s.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+t+'>','i'))?.[1]||'');
const strip = t => String(t||'').replace(/\s+/g,' ').trim();
const safeVideo = v => validId(v.id) && v.title && !/^(private|deleted) video$/i.test(v.title);
const videoRecord = (id,title,description,published) => ({
  id,
  title:strip(title).slice(0,180),
  description:String(description||'').trim().slice(0,1500),
  published:String(published||''),
  thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',
  url:'https://www.youtube.com/watch?v='+id,
});
const fetchJson = async url => {
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw new Error('YouTube Data API could not return the channel ('+response.status+'). Check the YouTube API key and quota.');
  const body=await response.json();if(body.error)throw new Error('YouTube Data API: '+String(body.error.message||'Unable to read videos').slice(0,180));return body;
};
async function fromApi(apiKey){
  const root='https://www.googleapis.com/youtube/v3/';
  const mk=(part,params)=>root+part+'?'+new URLSearchParams({...params,key:apiKey}).toString();
  const data=await fetchJson(mk('channels',{part:'snippet,contentDetails',forHandle:CHANNEL_HANDLE}));
  const channel=data.items?.[0];
  if(!channel)throw new Error('YouTube handle '+CHANNEL_HANDLE+' was not found.');
  if(channel.id!==CHANNEL_ID)throw new Error('Channel identity mismatch: the requested YouTube handle and the channel referenced on the original LilKangooMedia site differ. Confirm the correct channel before importing.');
  const playlist=channel.contentDetails?.relatedPlaylists?.uploads;
  if(!playlist)throw new Error('YouTube did not provide the channel uploads playlist.');
  let pageToken='',rows=[],n=0,hasMore=false;
  do {
    const params={part:'snippet,contentDetails',playlistId:playlist,maxResults:'50'};
    if(pageToken)params.pageToken=pageToken;
    const page=await fetchJson(mk('playlistItems',params));
    for(const item of page.items||[]){
      const id=item.contentDetails?.videoId||item.snippet?.resourceId?.videoId;
      const s=item.snippet||{};
      const v=videoRecord(id,s.title,s.description,item.contentDetails?.videoPublishedAt||s.publishedAt);
      if(safeVideo(v)&&s.videoOwnerChannelId!==undefined&&s.videoOwnerChannelId!==CHANNEL_ID)continue;
      if(safeVideo(v))rows.push(v);
    }
    pageToken=page.nextPageToken||'';n++;
    if(rows.length>=300){hasMore=Boolean(pageToken);break}
  } while(pageToken && n<10);
  const unique=[...new Map(rows.map(v=>[v.id,v])).values()].slice(0,300);
  // Check the status of individual videos to avoid private / unembeddable items.
  const publicIds=new Set();
  for(let i=0;i<unique.length;i+=50){
    const chunk=unique.slice(i,i+50);
    const data=await fetchJson(mk('videos',{part:'status',id:chunk.map(v=>v.id).join(',')}));
    for(const v of data.items||[]){const st=v.status||{};if(st.privacyStatus==='public'&&st.embeddable!==false)publicIds.add(v.id)}
  }
  return {videos:unique.filter(v=>publicIds.has(v.id)),source:'YouTube Data API',channel:strip(channel.snippet?.title)||CHANNEL_HANDLE,truncated:hasMore};
}
async function fromFeed(){
  const url='https://www.youtube.com/feeds/videos.xml?channel_id='+CHANNEL_ID;
  const response=await fetch(url,{headers:{Accept:'application/atom+xml, application/xml, text/xml'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('The YouTube channel feed is temporarily unavailable ('+response.status+'). For a complete or more reliable catalogue configure YOUTUBE_API_KEY in Netlify.');
  const xml=await response.text();
  const reported=tag(xml,'yt:channelId');
  if(!reported||reported!==CHANNEL_ID)throw new Error('YouTube returned an unexpected channel feed. No videos were imported.');
  const channelName=tag(xml,'title');
  if(!/lil\s*kangoo\s*media/i.test(channelName))throw new Error('The YouTube feed title does not match LilKangooMedia. Please verify channel ownership before importing.');
  const entries=[...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)].map(x=>x[1]);
  const videos=entries.map(entry=>videoRecord(tag(entry,'yt:videoId'),tag(entry,'title'),tag(entry,'media:description'),tag(entry,'published'))).filter(safeVideo);
  if(!videos.length)throw new Error('YouTube returned no public videos. Import was not performed.');
  return {videos:[...new Map(videos.map(v=>[v.id,v])).values()],source:'YouTube RSS (recent uploads only)',channel:tag(xml,'title')||CHANNEL_HANDLE,truncated:true};
}
async function channelVideos(){
  if(process.env.YOUTUBE_API_KEY?.trim())return fromApi(process.env.YOUTUBE_API_KEY.trim());
  return fromFeed();
}
async function supa(path,options={}){
  const base=process.env.SUPABASE_URL?.replace(/\/$/,'');const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)throw new Error('Server-side Supabase configuration is missing.');
  const headers={apikey:key,'Content-Type':'application/json',...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{}),...options.headers};
  const response=await fetch(base+'/rest/v1/'+path,{method:options.method||'GET',headers,body:options.data?JSON.stringify(options.data):undefined,signal:AbortSignal.timeout(15000)});
  if(!response.ok){const info=await response.text();throw new Error('Supabase '+response.status+': '+info.slice(0,260))}
  if(response.status===204)return [];
  const text=await response.text();return text?JSON.parse(text):[];
}
async function authorizeAdmin(token){
  const base=process.env.SUPABASE_URL?.replace(/\/$/,'');const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)throw new Error('Supabase server variables are missing.');
  const r=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});
  if(!r.ok)return false;
  const user=await r.json();if(!user?.id||!(/^[a-f0-9-]{36}$/i.test(user.id)))return false;
  const admins=await supa('admin_users?select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
  return admins.length>0;
}
async function ensureGallery(){
  let existing=await supa('portfolio_galleries?select=id,visibility&slug=eq.'+GALLERY_SLUG+'&limit=1');
  if(existing.length)return existing[0];
  const created=await supa('portfolio_galleries',{method:'POST',headers:{Prefer:'return=representation'},data:{
    slug:GALLERY_SLUG,
    title:'Films & Video Production',
    description:'Videos published on the official LilKangooMedia YouTube channel.',
    category:'Videography',visibility:'public',display_order:40,
  }});
  if(!created?.[0]?.id)throw new Error('Unable to create the video portfolio gallery.');
  return created[0];
}
async function importVideos(source,selectedIds,assignments={}){
  const eligible=new Set(source.videos.map(v=>v.id));
  const requested=[...new Set(selectedIds)].filter(validId);
  if(!requested.length)throw new Error('Select at least one video to import.');
  if(requested.some(id=>!eligible.has(id)))throw new Error('Some selected videos no longer match the verified channel feed. Refresh preview.');
  // Additional service placements are created ONLY when chosen by the administrator.
  // Never infer client/service categories from YouTube titles.
  const services=await supa('services?select=slug&limit=1000');
  const validServices=new Set(services.map(x=>x.slug));
  if(!assignments||typeof assignments!=='object'||Array.isArray(assignments))throw new Error('Invalid service placements.');
  const servicePlacements=[];
  for(const id of requested){
    const slug=String(assignments[id]||'').trim();
    if(!slug)continue;
    if(!validServices.has(slug))throw new Error('One of the selected services does not exist. Refresh the preview.');
    const video=source.videos.find(v=>v.id===id);
    servicePlacements.push({youtube_id:id,title:video.title,description:video.description,service_slug:slug,gallery_id:null,visibility:'public',display_order:100});
  }
  const gallery=await ensureGallery();
  if(gallery.visibility!=='public')throw new Error('The video portfolio gallery exists but is not public. Set it to Public in Portfolio & Galleries before publishing videos.');
  const existing=await supa('media_videos?select=youtube_id&gallery_id=eq.'+encodeURIComponent(gallery.id)+'&limit=2000');
  const known=new Set(existing.map(x=>x.youtube_id));
  const newItems=source.videos.filter(v=>requested.includes(v.id)&&!known.has(v.id));
  let inserted=0;
  for(let i=0;i<newItems.length;i+=40){
    const batch=newItems.slice(i,i+40).map((v,n)=>({
      youtube_id:v.id,title:v.title,description:v.description,gallery_id:gallery.id,
      service_slug:null,visibility:'public',display_order:(i+n+1)*10,
    }));
    await supa('media_videos',{method:'POST',headers:{Prefer:'return=minimal'},data:batch});
    inserted+=batch.length;
  }
  let serviceAdded=0;
  if(servicePlacements.length){
    const ids=[...new Set(servicePlacements.map(p=>p.youtube_id))];
    const old=await supa('media_videos?select=youtube_id,service_slug&youtube_id=in.('+ids.join(',')+')&limit=2000');
    const seen=new Set(old.map(x=>x.youtube_id+'|'+x.service_slug));
    const fresh=servicePlacements.filter(x=>!seen.has(x.youtube_id+'|'+x.service_slug));
    for(let i=0;i<fresh.length;i+=40){
      const batch=fresh.slice(i,i+40);
      await supa('media_videos',{method:'POST',headers:{Prefer:'return=minimal'},data:batch});serviceAdded+=batch.length;
    }
  }
  return {gallery_url:'/portfolio.html#/gallery/'+GALLERY_SLUG,added:inserted,already_present:requested.length-inserted,total_selected:requested.length,service_placements_added:serviceAdded};
}
export default async function youtubeChannelSync(request){
  try{
    if(request.method!=='POST')return json(405,{ok:false,error:'Method not allowed.'});
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)return json(403,{ok:false,error:'Only same-origin requests are allowed.'});
    const token=/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization')||'')?.[1];
    if(!token)return json(401,{ok:false,error:'Please sign in to the administrator panel.'});
    if(!await authorizeAdmin(token))return json(403,{ok:false,error:'Administrator access required.'});
    const body=await request.json().catch(()=>({}));
    if(!['preview','import'].includes(body?.action))return json(400,{ok:false,error:'Unknown action.'});
    const source=await channelVideos();
    if(body.action==='preview'){
      const services=await supa('services?select=slug,title&order=title.asc&limit=1000');
      return json(200,{ok:true,source:source.source,channel:source.channel,truncated:source.truncated,videos:source.videos,services,count:source.videos.length});
    }
    if(!Array.isArray(body.selected_ids)||body.selected_ids.length>300)return json(400,{ok:false,error:'Invalid video selection.'});
    const outcome=await importVideos(source,body.selected_ids,body.assignments||{});
    return json(200,{ok:true,source:source.source,...outcome});
  }catch(e){console.error('[youtube-channel-sync]',e.message);return json(502,{ok:false,error:String(e.message||'Unable to synchronize the YouTube channel.').slice(0,300)})}
}
export const config={path:'/api/youtube-channel-sync'};
