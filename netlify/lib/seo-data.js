'use strict';
// LilKangooMedia Phase 33: read-only public Supabase SEO data.
// No service-role key is used or accepted by this module.
const SITE = 'https://lilkangoomedia.com';
const API = String(process.env.SUPABASE_URL || 'https://nvronzbkvwyyllbuidhw.supabase.co').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_CSAqkjuGdGB54y4a2_vf9w_mYtPIIJO';
const IMG = SITE + '/assets/images/home-meta.jpg';
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
const e = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const plain = v => String(v || '').replace(/<(?:script|style|iframe|object|svg|noscript)\b[^>]*>[\s\S]*?<\/\s*(?:script|style|iframe|object|svg|noscript)\s*>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g, ' ').trim();
const compact = (v,max=170) => {const s=plain(v);if(s.length<=max)return s;const i=s.lastIndexOf(' ',max);return s.slice(0,i>max/2?i:max).trim()+'…';};
function image(v){try{if(typeof v!=='string'||!v.trim()||/[\s<>"'\\]/.test(v))return '';const x=new URL(v,SITE);if(x.protocol!=='https:')return '';return x.href;}catch{return '';}}
function validSlug(v){return SLUG.test(String(v||''));}
function date(v){if(!v)return null;const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):null;}
function articlePublished(x){return x&&x.status==='published'&&x.published_at&&new Date(x.published_at).getTime()<=Date.now();}
function storyPublished(g,s){return !!(g&&s&&g.visibility==='public'&&s.is_published===true&&plain(s.headline).length>=8&&plain(s.objective).length>=20&&plain(s.approach).length>=20);}
function serviceIndexable(s){return s&&s.active===true&&validSlug(s.slug)&&plain(s.title).length>=3&&plain(s.description||s.summary).length>=60;}
function canonicalArticle(p){
  if(!p||!validSlug(p.slug)||!articlePublished(p))return null;
  if(p.legacy_path)return null; // legacy article HTML is managed by the static builder.
  const url=`${SITE}/articles/${p.slug}`;
  if(p.canonical_url && p.canonical_url!==url && p.canonical_url!==url+'/')return null;
  return url;
}
async function apiRows(table, params={}){
  const url=new URL(API+'/rest/v1/'+table);
  url.searchParams.set('select','*');
  url.searchParams.set('limit','1000');
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8500);
  try{const response=await fetch(url.toString(),{headers:{'apikey':KEY,'Accept':'application/json'},signal:controller.signal});if(!response.ok)throw Error(`${table}: public API ${response.status}`);const rows=await response.json();if(!Array.isArray(rows))throw Error(`${table}: invalid API response`);if(rows.length>=1000)throw Error(`${table}: reached safe pagination limit; extend pagination before relying on this sitemap`);return rows;}
  finally{clearTimeout(timeout);}
}
async function one(table, filters){const a=await apiRows(table,filters);return a[0]||null;}
function result(statusCode,body,type='text/html; charset=utf-8',more={}){return {statusCode,headers:{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=120,s-maxage=300',...more},body};}
function missing(message='Page not found'){return result(404,`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Page unavailable</title></head><body><h1>${e(message)}</h1><a href="/">Home</a></body></html>`,'text/html; charset=utf-8',{'Cache-Control':'no-store'});}
module.exports={SITE,IMG,e,plain,compact,image,date,validSlug,articlePublished,storyPublished,serviceIndexable,canonicalArticle,apiRows,one,result,missing};
