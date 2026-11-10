/* Phase 24.2 — secure client-side renderer for RPC-provided projects only.
   Does not read private tables. Does not send writes. No checkout/refund actions. */
const stages={planning:'Planning',in_progress:'In progress',client_review:'Ready for your review',delivered:'Delivered',on_hold:'On hold',cancelled:'Cancelled'};
const orderStatuses={paid_pending_confirmation:'Payment recorded · confirmation pending',confirmed:'Booking confirmed',cancelled:'Cancelled · contact our team',declined:'Request declined · contact our team',refund_review_required:'Payment requires manual review in Stripe'};
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const safe=x=>typeof x==='string'?x.trim():'';
const isoDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')?x:'';
export function cleanProjects(reply){
 if(!reply||reply.ok!==true||!Array.isArray(reply.projects))throw Error('Project tracking response unavailable.');
 return reply.projects.filter(p=>p&&/^[0-9a-f-]{36}$/i.test(p.project_id||'')&&/^[0-9a-f-]{36}$/i.test(p.request_id||''))
  .slice(0,100).map(p=>({
   id:p.project_id,requestId:p.request_id,title:safe(p.title).slice(0,160)||'Client project',
   summary:safe(p.summary).slice(0,1800),phase:Object.hasOwn(stages,p.phase)?p.phase:'planning',
   progress:Number.isInteger(p.progress)&&p.progress>=0&&p.progress<=100?p.progress:0,
   targetDate:isoDate(p.target_date),nextStep:safe(p.next_step).slice(0,900),
   updated:safe(p.updated_at),
   order:p.order&&Object.hasOwn(orderStatuses,p.order.status)&&Number.isSafeInteger(p.order.paid_amount_cents)&&p.order.paid_amount_cents>=0?
    {status:p.order.status,paidCents:p.order.paid_amount_cents,kind:['deposit','full'].includes(p.order.payment_kind)?p.order.payment_kind:'payment'}:null,
   updates:Array.isArray(p.updates)?p.updates.filter(u=>u&&/^[0-9a-f-]{36}$/i.test(u.id||'')).slice(0,60)
    .map(u=>({title:safe(u.title).slice(0,140),detail:safe(u.detail).slice(0,1500),created:safe(u.created_at)})):[]
  }));
}
function oneCard(p){
 const card=node('article','lkm242-client-card');
 const top=node('div','lkm242-client-top');top.append(node('span','lkm242-client-tag','PROJECT DELIVERY'),node('span','lkm242-client-phase',stages[p.phase]));card.append(top);
 card.append(node('h3','',p.title));if(p.summary)card.append(node('p','lkm242-client-summary',p.summary));
 const meter=node('div','lkm242-client-meter');const row=node('div','lkm242-client-meter-line');row.append(node('span','','Project progress'),node('strong','',p.progress+'%'));meter.append(row);
 const track=node('div','lkm242-client-track');const fill=node('div','lkm242-client-fill');fill.style.width=p.progress+'%';track.append(fill);meter.append(track);card.append(meter);
 const fields=node('dl','lkm242-client-info');
 if(p.targetDate){fields.append(node('dt','','Target date'),node('dd','',p.targetDate));}
 if(p.nextStep){fields.append(node('dt','','Next step'),node('dd','',p.nextStep));}
 if(fields.children.length)card.append(fields);
 if(p.order){const order=node('div','lkm242-client-order');order.append(node('h4','','Linked order'),node('p','',orderStatuses[p.order.status]));
  const sum=(p.order.paidCents/100).toLocaleString('en-IE',{style:'currency',currency:'EUR'});
  order.append(node('strong','',sum+' recorded payment ('+(p.order.kind==='deposit'?'deposit':p.order.kind==='full'?'full payment':'payment')+')'));
  order.append(node('small','','Payment amount recorded before manual refunds/fees. This is not an invoice or live Stripe balance.'));card.append(order);
 }
 if(p.updates.length){const section=node('section','lkm242-client-timeline');section.append(node('h4','','Project updates'));
  for(const u of p.updates){const entry=node('div','lkm242-client-update');const date=u.created?new Date(u.created):null;
   const dateText=date&&Number.isFinite(date.getTime())?date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
   const header=node('div','lkm242-client-update-head');header.append(node('strong','',u.title));if(dateText)header.append(node('time','',dateText));entry.append(header);
   if(u.detail)entry.append(node('p','',u.detail));section.append(entry);}
  card.append(section);
 }else card.append(node('p','lkm242-client-muted','Your team has not shared any project updates yet.'));
 return card;
}
export function renderProjectResults(host,raw){
 host.replaceChildren();const projects=cleanProjects(raw);
 const header=node('div','lkm242-client-heading');header.append(node('div','', ''),node('h2','','Project progress'));
 header.firstChild.replaceWith(node('span','lkm242-client-eyebrow','DELIVERY UPDATES'));host.append(header);
 if(!projects.length){host.append(node('p','lkm242-client-muted','No project progress has been published for your shared enquiries yet. Your original request information remains available above.'));return projects.length;}
 const cards=node('div','lkm242-client-grid');for(const p of projects)cards.append(oneCard(p));host.append(cards);
 host.append(node('p','lkm242-client-smallprint','Project stages are informational and do not independently confirm a booking or trigger a payment. Contact us if you need clarification.'));
 return projects.length;
}
export async function showProjectTracking(host,authToken,api){
 host.replaceChildren(node('p','lkm242-client-muted','Loading shared project updates…'));
 try{const response=await api('/rest/v1/rpc/lkm_client_project_dashboard',{method:'POST',token:authToken,body:{}});return renderProjectResults(host,response);}
 catch(err){host.replaceChildren(node('p','lkm242-client-muted','Project tracking is temporarily unavailable. Your original requests remain visible above.'));return null;}
}
