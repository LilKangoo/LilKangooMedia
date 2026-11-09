// Optional authenticated publish trigger. This never exposes the Netlify build hook URL.
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async function(request){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Not allowed'},403);
 const token=(request.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1];if(!token)return json({error:'Authentication required'},401);
 const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const hook=process.env.NETLIFY_BUILD_HOOK_URL;
 if(!url||!serviceKey)return json({error:'Supabase server configuration missing'},503);
 if(!hook||!/^https:\/\/api\.netlify\.com\/build_hooks\/[A-Za-z0-9_-]+$/.test(hook))return json({error:'Netlify Build Hook is not configured'},503);
 try{
  const headers={apikey:serviceKey,'Content-Type':'application/json'};
  const userRes=await fetch(url+'/auth/v1/user',{headers:{...headers,Authorization:'Bearer '+token}});
  if(!userRes.ok)return json({error:'Session not valid'},401);
  const user=await userRes.json();if(!user?.id)return json({error:'Session not valid'},401);
  // Use current authenticated user's JWT for the membership check; never accept client-supplied admin IDs.
  const row=await fetch(url+'/rest/v1/admin_users?user_id=eq.'+encodeURIComponent(user.id)+'&select=user_id&limit=1',{headers:{...headers,Authorization:'Bearer '+token}});
  if(!row.ok)return json({error:'Cannot validate administrator'},403);
  const found=await row.json();if(!Array.isArray(found)||found.length!==1)return json({error:'Administrator access required'},403);
  const trigger=await fetch(hook,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  if(!trigger.ok)return json({error:'Could not queue Netlify deployment'},502);
  return json({ok:true,queued:true},202);
 }catch(error){console.error('publish-articles',error);return json({error:'Publishing unavailable'},503)}
}
export const config={path:'/api/publish-articles'};
