import {json,rejectMethod,parseBody,safeString,emailValid,h,supabase,sendEmail,turnstileCheck,requireEnv} from '../_shared.js';
export async function onRequest({request,env}){
 const bad=rejectMethod(request);if(bad)return bad;
 try{
  requireEnv(env,['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','FROM_EMAIL']);
  const data=await parseBody(request);
  if(data.website)return json({ok:true}); // bot honeypot, don't email or save
  const name=safeString(data.name,100),email=safeString(data.email,200),phone=safeString(data.phone,40),message=safeString(data.message,3000);
  const service=safeString(data.service_slug||data.service_type,120),date=safeString(data.preferred_date,25),type=safeString(data.type,40);
  if(!name||!emailValid(email)||!message||message.length<6||!data.consent)return json({ok:false,error:'Please complete name, email, message and consent.'},400);
  if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return json({ok:false,error:'Invalid date.'},400);
  const ip=request.headers.get('CF-Connecting-IP')||'';
  if(!await turnstileCheck(env,data.turnstile_token||data['cf-turnstile-response'],ip))return json({ok:false,error:'Anti-spam verification failed.'},403);
  const lead={customer_name:name,customer_email:email,phone,preferred_date:date||null,service_slug:service||null,package_id:safeString(data.package_id,100)||null,message,submission_type:type||'general_enquiry',addons:Array.isArray(data.addon_ids)?data.addon_ids.slice(0,15):[],status:'new'};
  const rows=await supabase(env,'contact_leads',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(lead)});
  const id=rows?.[0]?.id||'';
  try{
   await sendEmail(env,{subject:'LilKangooMedia enquiry — '+(service||'General')+' — '+name,replyTo:email,html:`<h2>New LilKangooMedia enquiry</h2><p><b>Name:</b> ${h(name)}<br><b>Email:</b> ${h(email)}<br><b>Phone:</b> ${h(phone)}<br><b>Service:</b> ${h(service)}<br><b>Package:</b> ${h(safeString(data.package_id,100))}<br><b>Preferred date:</b> ${h(date)}</p><h3>Message</h3><p style="white-space:pre-wrap">${h(message)}</p><p><small>Lead ID ${h(id)}</small></p>`});
  }catch(emailErr){throw new Error('Enquiry saved, but email notification could not be delivered. Contact website administrator.')}
  return json({ok:true,id});
 }catch(e){console.error('Enquiry error',e);return json({ok:false,error:'The enquiry could not be completed. Please try again or email photo@lilkangoomedia.com.'},503)}
}
