'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),os=require('os');
const {pathToFileURL}=require('url');
const folder=path.resolve(__dirname,'..');
async function testShare(){
 // Recreate Netlify's root package.json with type:module and import the function as ESM.
 const esmDir=fs.mkdtempSync(path.join(os.tmpdir(),'lkm-phase19-esm-'));
 let share;
 try{
  fs.writeFileSync(path.join(esmDir,'package.json'),JSON.stringify({type:'module'}));
  const fn=path.join(esmDir,'link-preview.js');
  fs.copyFileSync(path.join(folder,'netlify/functions/link-preview.js'),fn);
  share=await import(pathToFileURL(fn).href);
 }finally{fs.rmSync(esmDir,{recursive:true,force:true});}
 assert.equal(typeof share.handler,'function','Netlify function must expose an ESM handler');
 const calls=[];
 global.fetch=async url=>{calls.push(url);let x=[];
  if(url.includes('services?'))x=[{slug:'commercial-video-reels',title:'Commercial Video & Reels',summary:'Commercial video <marketing> for Cyprus brands.',cover_url:'/assets/images/woodstock.jpg'}];
  if(url.includes('portfolio_galleries?'))x=[{id:'1122',slug:'portraits',title:'Portraits',description:'Selected portrait work',cover_image_id:'img1'}];
  if(url.includes('portfolio_images?'))x=[{id:'img1',image_url:'/assets/images/portrait-15.jpg'}];
  return {ok:true,json:async()=>x};
 };
 let r=await share.handler({queryStringParameters:{kind:'service',slug:'commercial-video-reels'}});
 assert.equal(r.statusCode,200);assert(r.body.includes('og:title'));assert(r.body.includes('Commercial Video &amp; Reels'));assert(r.body.includes('og:image'));assert(r.body.includes('https://lilkangoomedia.com/assets/images/woodstock.jpg'));assert(r.body.includes('https://lilkangoomedia.com/#/service/commercial-video-reels'));assert(!r.body.includes('<marketing>'),'HTML injection');assert.equal(calls.length,1);
 r=await share.handler({queryStringParameters:{kind:'gallery',slug:'portraits'}});
 assert.equal(r.statusCode,200);assert(r.body.includes('https://lilkangoomedia.com/assets/images/portrait-15.jpg'));assert(r.body.includes('/portfolio.html#/gallery/portraits'));
 r=await share.handler({queryStringParameters:{kind:'service',slug:'../../attack'}});assert.equal(r.statusCode,400);
 global.fetch=async()=>({ok:true,json:async()=>[]});
 r=await share.handler({queryStringParameters:{kind:'service',slug:'not-published'}});assert.equal(r.statusCode,404);
 global.fetch=async()=>{throw Error('Offline')};const log=console.error;console.error=()=>{};
 r=await share.handler({queryStringParameters:{kind:'service',slug:'portrait-photography'}});console.error=log;assert.equal(r.statusCode,503);
 console.log('PASS — share endpoint: valid metadata, image, safe redirect, gallery, invalid, unpublished, service outage');
}
async function testUI(){
 const services=[{slug:'commercial-video-reels',title:'Commercial Video & Reels',summary:'Brand film and reels.',cover_url:'/assets/images/film.jpg',category:'Videography',audience:'business',active:true},{slug:'portrait-photography',title:'Portrait & Family Photography',summary:'Portrait sessions.',cover_url:'/assets/images/portrait.jpg',category:'Photography',audience:'personal',active:true}];
 const posts=[{slug:'cyprus-light-guide',title:'Photography guide',seo_title:'Photos in Cyprus',seo_description:'Photography light explained',excerpt:'Insights',cover_url:'/assets/images/light.jpg',permalink:'/articles/cyprus-light-guide.html',category_name:'Education'}];
 const galleries=[{id:'g1',slug:'portraits',title:'Portraits',description:'Portrait gallery',category:'Photography',cover_image_id:'i1'}];
 const images=[{id:'i1',gallery_id:'g1',image_url:'https://mycdn.example/portraits.jpg'}];
 const root={innerHTML:'',events:{},addEventListener(type,fn){this.events[type]=fn},querySelector(sel){if(sel==='#lkmLinkSearch')return {focus(){}};if(sel==='#lkmLinksResults')return zone;if(sel==='#lkmLinkResultCount')return count;return null}};
 const zone={innerHTML:''},count={textContent:''},toast={hidden:true,textContent:''};
 const writes=[];
 const fetch=async url=>{let v=[];
  if(url.includes('articles-index.json'))v={posts};
  if(url.includes('portfolio_galleries'))v=galleries;
  if(url.includes('portfolio_images'))v=images;
  if(url.includes('media_videos'))v=[];
  return {ok:true,json:async()=>v};
 };
 const store={configured:true,getSession:()=>({access_token:'t'}),isAdmin:async()=>true,publicServices:async()=>services,logout(){}},document={getElementById:id=>id==='lkmLinksAdmin'?root:id==='toast'?toast:null,body:{append(){}}};
 const cx={window:{LKMStore:store,LKM_CONFIG:{SUPABASE_URL:'https://mock.supabase.co',SUPABASE_ANON_KEY:'pub'},location:{}},document,URL,console,fetch,navigator:{clipboard:{writeText:async s=>writes.push(s)}},setTimeout:()=>0,clearTimeout:()=>{},location:{href:''}};
 vm.runInNewContext(fs.readFileSync(folder+'/assets/lkm-v3/admin-links.js','utf8'),cx,{filename:'admin-links.js'});
 await new Promise(res=>setTimeout(res,40));
 assert(root.innerHTML.includes('20</strong> available links')); // 10 pages + 6 social + 2 service + 1 article + 1 gallery
 assert(root.innerHTML.includes('https://lilkangoomedia.com/share/service/commercial-video-reels'));
 assert(root.innerHTML.includes('Photos in Cyprus'));
 assert(root.innerHTML.includes('https://lilkangoomedia.com/share/gallery/portraits'));
 assert(root.innerHTML.includes('Links library'));
 const target=(dataset)=>({closest:selector=>(selector==='[data-folder]'&&Object.hasOwn(dataset,'folder')||selector==='[data-action]'&&Object.hasOwn(dataset,'action'))?({dataset}):null});
 await root.events.click({target:target({folder:'business'})});assert(root.innerHTML.includes('Business services'));assert(!root.innerHTML.includes('class="lkm-link-card" data-link-id="service:portrait-photography"'));
 await root.events.click({target:target({folder:'all'})});
 const event={target:target({action:'copy',id:'service:commercial-video-reels'})};
 await root.events.click(event);assert.equal(writes[0],'https://lilkangoomedia.com/share/service/commercial-video-reels');
 await root.events.click({target:target({action:'message',id:'service:commercial-video-reels'})});assert(writes[1].includes('Brand film and reels.'));
 root.events.input({target:{id:'lkmLinkSearch',value:'photography guide'}});
 assert(zone.innerHTML.includes('Photography guide'));assert(!zone.innerHTML.includes('Commercial Video & Reels'));
 console.log('PASS — admin module: auth gating, live collections, folder filter, search, copy, direct/social URLs');
}
(async()=>{await testShare();await testUI()})().catch(e=>{console.error(e);process.exitCode=1});
