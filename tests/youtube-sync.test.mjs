import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/youtube-channel-sync.mjs';
const URL_ROOT='https://preview.example.com/api/youtube-channel-sync';
const channel='UCgIrKPHFpPy6srhdq4SjEtw';
const idA='AAAABBBB111',idB='BBBBCCCC222';
const feed=`<?xml version="1.0" encoding="UTF-8"?><feed><yt:channelId>${channel}</yt:channelId><title>LilKangooMedia</title>
 <entry><yt:videoId>${idA}</yt:videoId><title>Coastal &amp; Sunset Film</title><published>2026-11-01T08:00:00+00:00</published><media:description>Evening video &amp; photography.</media:description></entry>
 <entry><yt:videoId>${idB}</yt:videoId><title>Studio Project</title><published>2026-10-12T08:00:00+00:00</published><media:description>Filming at the studio.</media:description></entry></feed>`;
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
const req=(action,extra={},token='valid')=>new Request(URL_ROOT,{method:'POST',headers:{Authorization:'Bearer '+token,Origin:'https://preview.example.com','Content-Type':'application/json'},body:JSON.stringify({action,...extra})});
function setup({id=channel,existing=[]}={}){
 process.env.SUPABASE_URL='https://supabase.test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_placeholder';delete process.env.YOUTUBE_API_KEY;
 const state={gallery:false,placements:existing.slice(),calls:[],users:0};
 globalThis.fetch=async (input,options={})=>{
  const url=String(input);state.calls.push({url,method:options.method||'GET'});
  if(url.endsWith('/auth/v1/user'))return json({id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'});
  if(url.includes('/rest/v1/admin_users'))return json([{user_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'}]);
  if(url.startsWith('https://www.youtube.com/feeds/videos.xml'))return new Response(id===channel?feed:feed.replace(channel,id),{status:200});
  if(url.includes('/rest/v1/services?select=slug,title'))return json([{slug:'videography',title:'Videography'}]);
  if(url.includes('/rest/v1/services?select=slug'))return json([{slug:'videography'}]);
  if(url.includes('/rest/v1/portfolio_galleries?'))return json(state.gallery?[{id:'cccccccc-dddd-eeee-ffff-000000000000',visibility:'public'}]:[]);
  if(url.endsWith('/rest/v1/portfolio_galleries')&&options.method==='POST'){state.gallery=true;return json([{id:'cccccccc-dddd-eeee-ffff-000000000000',visibility:'public'}],201)}
  if(url.includes('/rest/v1/media_videos?')){
   if(url.includes('service_slug'))return json(state.placements.filter(x=>x.service_slug));
   return json(state.placements.filter(x=>x.gallery_id));
  }
  if(url.endsWith('/rest/v1/media_videos')&&options.method==='POST'){
    const batch=JSON.parse(options.body);
    state.placements.push(...(Array.isArray(batch)?batch:[batch]));return json([],201);
  }
  throw Error('Unmocked '+(options.method||'GET')+' '+url);
 };
 return state;
}
test('preview reads real fields from feed, including XML entities, without inventing copy',async()=>{
 setup();const response=await handler(req('preview'));assert.equal(response.status,200);
 const body=await response.json();assert.equal(body.channel,'LilKangooMedia');assert.equal(body.count,2);
 assert.equal(body.videos[0].id,idA);assert.equal(body.videos[0].title,'Coastal & Sunset Film');assert.equal(body.videos[0].description,'Evening video & photography.');
 assert.equal(body.videos[0].thumbnail,'https://i.ytimg.com/vi/'+idA+'/hqdefault.jpg');
 assert.equal(body.services[0].slug,'videography');assert.equal(body.truncated,true);
});
test('import creates one gallery, publishes selected clips, and permits explicit service placement',async()=>{
 const state=setup();const response=await handler(req('import',{selected_ids:[idA,idB],assignments:{[idA]:'videography'}}));
 assert.equal(response.status,200);const result=await response.json();
 assert.equal(result.added,2);assert.equal(result.service_placements_added,1);
 assert.equal(result.gallery_url,'/portfolio.html#/gallery/video-portfolio');
 assert.equal(state.placements.filter(x=>x.gallery_id).length,2);
 assert.equal(state.placements.filter(x=>x.service_slug==='videography').length,1);
 assert.equal(state.placements.filter(x=>x.gallery_id).every(x=>x.visibility==='public'),true);
 const again=await handler(req('import',{selected_ids:[idA,idB],assignments:{[idA]:'videography'}}));
 assert.equal(again.status,200);const body=await again.json();assert.equal(body.added,0);assert.equal(body.already_present,2);assert.equal(body.service_placements_added,0);
 assert.equal(state.placements.length,3);
});
test('rejects arbitrary videos that do not belong to verified channel feed',async()=>{
 setup();const r=await handler(req('import',{selected_ids:['DDDDFFFF333']}));
 assert.equal(r.status,502);const body=await r.json();assert.match(body.error,/no longer match/);
});
test('requires token and correct same-origin',async()=>{
 setup();let r=await handler(new Request(URL_ROOT,{method:'POST',body:JSON.stringify({action:'preview'})}));assert.equal(r.status,401);
 r=await handler(new Request(URL_ROOT,{method:'POST',headers:{Authorization:'Bearer valid',Origin:'https://attacker.example'},body:JSON.stringify({action:'preview'})}));assert.equal(r.status,403);
});
test('refuses channel-id mismatch and cannot insert any video',async()=>{
 const state=setup({id:'UCxxxxxxxxxxxxxxxxxxxxxxx'});
 const r=await handler(req('import',{selected_ids:[idA]}));assert.equal(r.status,502);
 assert.equal(state.placements.length,0);assert.equal(state.gallery,false);
});
test('rejects a non-existent service destination instead of guessing',async()=>{
 const state=setup();const r=await handler(req('import',{selected_ids:[idA],assignments:{[idA]:'fictional-service'}}));
 assert.equal(r.status,502);assert.equal(state.gallery,false);
});
test('YouTube Data API mode verifies handle/channel and excludes non-embeddable clips',async()=>{
 setup();process.env.YOUTUBE_API_KEY='test-api-key';
 const previous=globalThis.fetch;
 globalThis.fetch=async (input,options={})=>{
  const url=String(input);
  if(url.includes('/youtube/v3/channels?'))return json({items:[{id:channel,snippet:{title:'LilKangooMedia'},contentDetails:{relatedPlaylists:{uploads:'UUgIrKPHFpPy6srhdq4SjEtw'}}}]});
  if(url.includes('/youtube/v3/playlistItems?'))return json({items:[{snippet:{title:'Published film',description:'Official description.',videoOwnerChannelId:channel},contentDetails:{videoId:idA}}]});
  if(url.includes('/youtube/v3/videos?'))return json({items:[{id:idA,status:{privacyStatus:'public',embeddable:true}}]});
  return previous(input,options);
 };
 const response=await handler(req('preview'));assert.equal(response.status,200);
 const body=await response.json();assert.equal(body.source,'YouTube Data API');assert.equal(body.count,1);
 assert.equal(body.videos[0].title,'Published film');assert.equal(body.truncated,false);
 delete process.env.YOUTUBE_API_KEY;
});
test('YouTube Data API mode rejects mismatch instead of importing a different channel',async()=>{
 const state=setup();process.env.YOUTUBE_API_KEY='test-api-key';
 const previous=globalThis.fetch;
 globalThis.fetch=async (input,options={})=>String(input).includes('/youtube/v3/channels?')?json({items:[{id:'UCxxxxxxxxxxxxxxxxxxxxxxx',snippet:{title:'Other channel'}}]}):previous(input,options);
 const response=await handler(req('import',{selected_ids:[idA]}));assert.equal(response.status,502);
 assert.equal(state.gallery,false);assert.equal(state.placements.length,0);
 delete process.env.YOUTUBE_API_KEY;
});
