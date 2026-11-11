/* LilKangooMedia Phase 26: pure shared UI/validation helpers. */
export const slugOK=value=>typeof value==='string'&&/^[a-z0-9-]{1,90}$/.test(value);
export const uuidOK=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const youtubeID=input=>{
 const raw=String(input||'').trim();if(/^[\w-]{11}$/.test(raw))return raw;
 try{const u=new URL(raw);const h=u.hostname.toLowerCase();if(!['youtu.be','www.youtu.be','youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(h))return '';
  const path=/^\/(?:shorts|embed|live|v)\/([\w-]{11})(?:\/|$)/.exec(u.pathname);
  const id=h.endsWith('youtu.be')?u.pathname.slice(1).split('/')[0]:path?.[1]||u.searchParams.get('v')||'';
  return /^[\w-]{11}$/.test(id)?id:'';
 }catch{return ''}
};
export const imageURL=value=>{
 const url=String(value||'').trim();
 return url.length<=1700&&!url.includes('..')&&(/^https:\/\/[^\s<>"']+$/.test(url)||/^\/assets\/[A-Za-z0-9%._/-]+$/.test(url))?url:'';
};
export const clean=(value,max=180)=>String(value??'').trim().slice(0,max);
export const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
export const safeSearch=value=>String(value??'').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,65);
export const tagsFromInput=value=>[...new Set(String(value??'').split(',').map(x=>clean(x,34)).filter(Boolean))].slice(0,30);
export const parseCount=header=>{const m=String(header||'').match(/\/(\d+)$/);return m?Number(m[1]):null;};
export const previewURL=a=>a?.media_type==='youtube'&&youtubeID(a.youtube_id)?`https://i.ytimg.com/vi/${a.youtube_id}/hqdefault.jpg`:imageURL(a?.image_url);
export const isShownInPortfolio=g=>g?.visibility==='public'&&g?.show_in_portfolio!==false;
export const isStoryPublished=(s,g)=>!!s?.is_published&&g?.visibility==='public';
export const normalVisibility=v=>['public','review','hidden'].includes(v)?v:'review';
export const galleryKind=v=>v==='project'?'project':'collection';
