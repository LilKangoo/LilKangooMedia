/* LilKangooMedia 24.1 — email OTP and explicitly-granted client summaries.
 * No service-role key, no privileged table reads, no private data in URLs.
 * Session is tab-scoped (sessionStorage), not the admin LKMStore session.
 */
import {validEmail,cleanEmail,validOtp,sessionFromFragment,cleanItems,statusLabel} from './phase24-client-core.mjs';
import {showProjectTracking} from './phase24-project-tracking.mjs';
const root=document.getElementById('lkm24Workspace');
if(root){
 const cfg=window.LKM_CONFIG||{},base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,''),key=String(cfg.SUPABASE_ANON_KEY||'');
 const storageKey='LKM24_CLIENT_SESSION',emailKey='LKM24_PENDING_EMAIL';
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
 const add=(p,...xs)=>{p.append(...xs);return p};
 const configured=base.startsWith('https://')&&key.length>12;
 let session=null,userEmail='',pendingEmail='';
 const str=x=>String(x||'');
 const loadStorage=()=>{try{return JSON.parse(sessionStorage.getItem(storageKey)||'null')}catch{return null}};
 const saveSession=s=>{session=s;if(s){sessionStorage.setItem(storageKey,JSON.stringify(s))}else{sessionStorage.removeItem(storageKey)}};
 const notice=(text,error=false)=>{const el=document.getElementById('lkm24Status');if(el){el.textContent=text;el.classList.toggle('is-error',error)}};
 async function api(endpoint,options={}){
  const headers={apikey:key,'Content-Type':'application/json',Accept:'application/json'};
  if(options.token)headers.Authorization='Bearer '+options.token;
  const response=await fetch(base+endpoint,{method:options.method||'GET',headers,cache:'no-store',...(options.body?{body:JSON.stringify(options.body)}:{})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error((result.msg||result.message||result.error_description||'Request could not be completed. Please try again.').slice(0,220));
  return result;
 }
 async function token(){
  if(!session?.access_token||!session?.refresh_token)throw Error('Please sign in again.');
  if((session.expires_at||0)>Math.floor(Date.now()/1000)+90)return session.access_token;
  const renewed=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
  if(!renewed.access_token||!renewed.refresh_token)throw Error('Your session has expired. Please sign in again.');
  saveSession({access_token:renewed.access_token,refresh_token:renewed.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(renewed.expires_in||3600)});
  return session.access_token;
 }
 function signIn(info='Enter the email address you used when contacting LilKangooMedia.'){
  root.replaceChildren();const section=node('section','lkm24-login');
  add(section,node('h2','','Secure sign in'),node('p','lkm24-muted',info));
  const form=node('form');form.id='lkm24SignIn';const label=node('label','','Email address'),email=node('input');email.type='email';email.autocomplete='email';email.required=true;email.maxLength=200;email.placeholder='you@example.com';email.value=pendingEmail||'';
  label.append(email);form.append(label);
  const actions=node('div','lkm24-actions'),submit=node('button','','Send secure sign-in link');submit.type='submit';actions.append(submit);form.append(actions);
  const status=node('p','lkm24-status');status.id='lkm24Status';status.setAttribute('role','status');form.append(status);
  section.append(form);
  const hint=node('p','lkm24-help','We email a sign-in link or code. Access to project information must also be enabled by our team. No password or payment details are required.');section.append(hint);
  if(pendingEmail){const verify=node('form');verify.id='lkm24Verify';const codeLabel=node('label','','Have a one-time code?'),code=node('input');code.autocomplete='one-time-code';code.inputMode='numeric';code.pattern='[0-9]{6,8}';code.placeholder='6-digit code';code.required=true;codeLabel.append(code);verify.append(codeLabel);
   const row=node('div','lkm24-actions'),btn=node('button','secondary','Verify code');btn.type='submit';row.append(btn);verify.append(row);section.append(verify);
   verify.addEventListener('submit',async e=>{e.preventDefault();if(!validOtp(code.value)){notice('Enter the code from your email.',true);return;}btn.disabled=true;notice('Verifying your sign-in…');try{const a=await api('/auth/v1/verify',{method:'POST',body:{type:'email',email:pendingEmail,token:code.value.trim()}});if(!a.access_token||!a.refresh_token)throw Error('Code could not be verified.');saveSession({access_token:a.access_token,refresh_token:a.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(a.expires_in||3600)});pendingEmail='';sessionStorage.removeItem(emailKey);await showDashboard();}catch(err){notice(err.message,true)}finally{btn.disabled=false}});
  }
  form.addEventListener('submit',async e=>{e.preventDefault();if(!validEmail(email.value)){notice('Enter a valid email address.',true);return;}submit.disabled=true;notice('Requesting your secure sign-in link…');try{
    const normalized=cleanEmail(email.value);
    // GoTrue redirects only to URL allowlisted in Supabase Auth > URL Configuration.
    const redirect=window.location.origin+'/client.html';
    await api('/auth/v1/otp?redirect_to='+encodeURIComponent(redirect),{method:'POST',body:{email:normalized,create_user:true}});
    pendingEmail=normalized;sessionStorage.setItem(emailKey,normalized);signIn('Check your inbox for the link or code. If it does not arrive, check spam.');notice('If email sign-in is available for this address, a secure link or code will arrive shortly.');
   }catch(err){notice(err.message||'Could not request a sign-in link.',true)}finally{submit.disabled=false}
  });
  root.append(section);
 }
 function card(item){
  const el=node('article','lkm24-request');el.append(node('div','lkm24-request-label','YOUR REQUEST'),node('h3','',item.service));
  const details=node('div','lkm24-request-details');
  const when=item.submitted?new Date(item.submitted).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
  add(details,node('span','','Submitted'),node('strong','',when));
  if(item.date)add(details,node('span','','Preferred date'),node('strong','',item.date));
  el.append(details,node('span','lkm24-request-status',statusLabel(item.status)));return el;
 }
 async function showDashboard(){
  root.replaceChildren(node('p','lkm24-muted','Verifying your account and loading your shared projects…'));
  try{
   const t=await token();
   const user=await api('/auth/v1/user',{token:t});
   if(!validEmail(user.email)||(!user.email_confirmed_at&&!user.confirmed_at))throw Error('A verified email account is required.');
   userEmail=cleanEmail(user.email);
   const result=await api('/rest/v1/rpc/lkm_client_portal_summary',{method:'POST',token:t,body:{}});
   if(result.ok!==true)throw Error('Your secure project list is not available.');
   const items=cleanItems(result);root.replaceChildren();
   const head=node('div','lkm24-topline'),left=node('div');add(left,node('p','lkm24-user-mail','Signed in as '+userEmail),node('h2','','Your client space'),node('p','lkm24-muted','Only requests shared with your verified email are shown here.'));head.append(left);
   const controls=node('div','lkm24-actions'),logout=node('button','secondary','Sign out');logout.type='button';controls.append(logout);head.append(controls);root.append(head);
   logout.addEventListener('click',async()=>{const t=session?.access_token;saveSession(null);pendingEmail='';sessionStorage.removeItem(emailKey);userEmail='';signIn('You have signed out of the client portal.');if(t)void api('/auth/v1/logout',{method:'POST',token:t}).catch(()=>{});});
   if(!items.length){root.append(node('p','lkm24-empty','There are no project requests shared with this email yet. If you have already enquired, please contact LilKangooMedia so we can enable access to your request.'));return;}
   const list=node('div','lkm24-requests');for(const item of items)list.append(card(item));root.append(list);
   const projects=node('section','lkm242-client-zone');projects.id='lkm242ProjectTracking';root.append(projects);
   await showProjectTracking(projects,t,api);
   root.append(node('p','lkm24-help','Files, media deliverables and invoices will be available in a later update. Payment details appear only when our team explicitly links the matching order.'));
  }catch(err){saveSession(null);pendingEmail='';sessionStorage.removeItem(emailKey);userEmail='';signIn('Your session has expired, or your request could not be loaded. Sign in again.');notice(err.message||'Unable to load secure client portal.',true)}
 }
 async function init(){
  if(!configured){root.replaceChildren(node('p','lkm24-empty','The secure client portal has not been configured yet. Please contact LilKangooMedia.'));return;}
  // Consume tokens immediately and remove from the address bar before any API call.
  const params=new URLSearchParams(window.location.search),hash=window.location.hash||'';
  const linked=sessionFromFragment(hash);
  let emailVerify=null;
  if(params.has('token_hash')&&['magiclink','email','invite','signup'].includes(params.get('type')||'')){
    emailVerify={token_hash:params.get('token_hash'),type:params.get('type')};
  }
  if(hash.includes('access_token=')||params.has('token_hash')||hash.includes('error='))window.history.replaceState({},document.title,'/client.html');
  pendingEmail=sessionStorage.getItem(emailKey)||'';
  if(linked){saveSession(linked);pendingEmail='';sessionStorage.removeItem(emailKey);}
  else if(emailVerify){try{const result=await api('/auth/v1/verify',{method:'POST',body:emailVerify});if(result.access_token&&result.refresh_token)saveSession({access_token:result.access_token,refresh_token:result.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(result.expires_in||3600)});}catch{/* Standard login offers retry. */}}
  else{session=loadStorage()}
  if(session?.access_token)await showDashboard();else signIn();
 }
 void init();
}
