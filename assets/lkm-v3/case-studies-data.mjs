/* Phase 22.3 — testable, side-effect-free helpers. No client data or fake project details. */
export function slugOK(value) {return typeof value==='string' && /^[a-z0-9-]{1,90}$/.test(value);}
export function uuidOK(value) {return typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
export function clean(value,max=2500) {return typeof value==='string'?value.trim().slice(0,max):'';}
export function imageURL(value) {
  const valueString=clean(value,1700);
  if(/^https:\/\/[^\s<>"']+$/.test(valueString))return valueString;
  if(/^\/assets\/[a-zA-Z0-9%._/-]+$/.test(valueString)&&!valueString.includes('..')&&!valueString.includes('//'))return valueString;
  return '';
}
export function youtubeID(value) {return typeof value==='string' && /^[A-Za-z0-9_-]{11}$/.test(value)?value:'';}
export function lines(value) {return [...new Set(String(value??'').split(/\r?\n/).map(x=>clean(x,160)).filter(Boolean))].slice(0,18);}
export function publishedCase(study,gallery) {
  return !!(study&&gallery&&study.is_published===true&&gallery.visibility==='public'&&study.gallery_id===gallery.id&&slugOK(gallery.slug));
}
export function readyToPublish(input,gallery){
  return !!gallery && gallery.visibility==='public' &&
    clean(input.headline,180).length>=8 && clean(input.objective,2500).length>=20 &&
    clean(input.approach,3500).length>=20;
}
export function yearValue(value){
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isInteger(n)&&n>=2000&&n<=2100?n:null;
}
export function selectedPhotos(photos,gallery){
  return (Array.isArray(photos)?photos:[]).filter(p=>p.gallery_id===gallery.id&&p.visibility==='public'&&imageURL(p.image_url))
    .sort((a,b)=>Number(a.display_order||100)-Number(b.display_order||100)).slice(0,24);
}
