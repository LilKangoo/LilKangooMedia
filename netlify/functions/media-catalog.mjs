// Public original-image file index for LilKangooMedia's admin Media Library.
// This lists files ALREADY public in GitHub. It never publishes or uploads photos.
// No API keys are read. Never use this endpoint for private files.
const GITHUB_TREE='https://api.github.com/repos/LilKangoo/LilKangooMedia/git/trees/main?recursive=1';
const extensions=/\.(jpe?g|png|webp|gif|avif)$/i;
function category(name){
 const s=name.toLowerCase();
 if(/wedding|bride|ceremony|ślub|slub|marriage/.test(s))return 'Weddings';
 if(/proposal|engage|zaręczyn|zareczyn/.test(s))return 'Proposals';
 if(/family|famil|portrait|dziec|baby|maternity/.test(s))return 'Family & portraits';
 if(/jewel|product|watch|zegarek|orofino|restaurant|food|hotel|brand/.test(s))return 'Commercial & products';
 if(/cyprus|beach|larnaca|limassol|paphos|lefkara|akamas|troodos|nature|sea|sunset|mountain|drone/.test(s))return 'Cyprus & nature';
 if(/concert|event|festival|woodstock|party/.test(s))return 'Events & film';
 return 'Unclassified — review';
}
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':status===200?'public, max-age=300, s-maxage=21600':'no-store','X-Content-Type-Options':'nosniff'}});
export default async function mediaCatalog(request){
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 try{
  const response=await fetch(GITHUB_TREE,{headers:{Accept:'application/vnd.github+json','User-Agent':'LilKangooMedia-media-library','X-GitHub-Api-Version':'2022-11-28'}});
  if(!response.ok){console.error('Media catalog: GitHub HTTP',response.status);return json({error:'GitHub catalog is temporarily unavailable. Try again later.'},503)}
  const body=await response.json();
  if(!Array.isArray(body.tree))return json({error:'Unexpected GitHub catalog response.'},503);
  const items=body.tree.filter(x=>x.type==='blob'&&x.path?.startsWith('assets/images/')&&extensions.test(x.path))
   .map(x=>({path:x.path,file:x.path.split('/').pop(),url:'/'+x.path.split('/').map(encodeURIComponent).join('/'),suggested_category:category(x.path),size:x.size||null}));
  items.sort((a,b)=>a.path.localeCompare(b.path,'en',{sensitivity:'base'}));
  return json({images:items,total:items.length,partial:Boolean(body.truncated),source:'GitHub public main branch'});
 }catch(e){console.error('Media catalog error',e?.message);return json({error:'Could not load image catalog.'},503)}
}
export const config={path:'/api/media-catalog'};
