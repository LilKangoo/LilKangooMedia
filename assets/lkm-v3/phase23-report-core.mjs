/** LilKangooMedia Phase 23.4 — pure read-only reporting functions.
 * Independent aggregates from existing RLS-protected tables. No financial or admin writes.
 * Important: CRM stages, accepted quotes and Stripe gross payments are NOT interchangeable.
 */
export const STAGES = Object.freeze([
  ['new','New'],['qualified','Qualified'],['proposal','Proposal sent'],
  ['negotiation','Negotiating'],['won','Won'],['lost','Lost']
]);
const ACTIVE = new Set(['new','qualified','proposal','negotiation']);
const periods = new Set(['30','90','365','all']);
const int = n => Number.isSafeInteger(Number(n)) && Number(n) >= 0 ? Number(n) : 0;
const stamp = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x) ? x.slice(0,10) : '';
const clean = x => String(x ?? '').trim();
export function cyprusToday(at=new Date()) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Nicosia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);
  const get=k=>parts.find(p=>p.type===k)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function dateMinus(iso,days){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isSafeInteger(days))throw Error('Invalid reporting date');
  const dt=new Date(iso+'T12:00:00Z');if(!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==iso)throw Error('Invalid reporting date');
  dt.setUTCDate(dt.getUTCDate()-days);return dt.toISOString().slice(0,10);
}
export function quoteTotal(quote){
  const lines=quote?.line_items;if(!Array.isArray(lines)||lines.length>30)return null;
  let total=0;
  for(const row of lines){
    const qty=Number(row?.quantity),unit=Number(row?.unit_price_cents);
    if(!Number.isFinite(qty)||qty<=0||qty>1000||!Number.isInteger(qty*4)||!Number.isSafeInteger(unit)||unit<0||unit>1e9)return null;
    total+=Math.round(qty*unit);
    if(!Number.isSafeInteger(total)||total>1e9)return null;
  }
  const discount=Number(quote?.discount_cents??0);
  if(!Number.isSafeInteger(discount)||discount<0||discount>total)return null;
  return total-discount;
}
function group(rows,key,countMax=8){
  const groups=new Map();
  for(const row of rows){const raw=clean(row?.[key])||'Not specified';groups.set(raw,(groups.get(raw)||0)+1)}
  return [...groups].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,countMax).map(([name,count])=>({name,count}));
}
function monthsFor(today,windowDays){
  const result=[];const n=windowDays==='30'?2:windowDays==='90'?4:windowDays==='365'?12:6;
  const year=Number(today.slice(0,4)),mon=Number(today.slice(5,7));
  for(let i=n-1;i>=0;i--){const dt=new Date(Date.UTC(year,mon-1-i,1));result.push({month:dt.toISOString().slice(0,7),enquiries:0,sentQuotes:0,acceptedQuotes:0,paidGrossCents:0})}
  return result;
}
export function makeReport(data,settings={}){
  const {leads,details,quotes,approvals,orders}=data||{};
  if(![leads,details,quotes,approvals,orders].every(Array.isArray))throw Error('One or more reports are missing. Nothing was estimated.');
  const today=settings.today||cyprusToday();
  const period=String(settings.period||'90');if(!periods.has(period))throw Error('Invalid reporting period');
  const start=period==='all'?'':dateMinus(today,Number(period)-1);
  const service=clean(settings.service||'');
  const inside=row=>{const d=stamp(row?.created_at);return d && d<=today && (!start||d>=start)};
  const detailById=new Map(details.filter(x=>x?.lead_id).map(x=>[x.lead_id,x]));
  const allLeadById=new Map(leads.filter(x=>x?.id).map(x=>[x.id,x]));
  const cohort=leads.filter(l=>inside(l)&&(!service||clean(l.service_slug)===service));
  // A quotation created this month may belong to a lead created last year.
  // Filter by the lead's service across ALL dates, not only the lead cohort.
  const serviceLeadIds=new Set(leads.filter(l=>clean(l.service_slug)===service).map(l=>l.id));
  const selectedQuotes=quotes.filter(q=>inside(q)&&(!service||serviceLeadIds.has(q.lead_id)));
  const selectedOrders=orders.filter(o=>inside(o)&&(!service||clean(o.service_slug)===service));
  const approvalByQuote=new Map(approvals.filter(a=>a?.quote_id).map(a=>[a.quote_id,a]));
  const active=cohort.filter(l=>!l.archived_at&&ACTIVE.has(detailById.get(l.id)?.stage||'new'));
  const stages=STAGES.map(([id,label])=>({id,label,count:cohort.filter(l=>(detailById.get(l.id)?.stage||'new')===id).length}));
  const sent=selectedQuotes.filter(q=>q.status==='sent');
  const draft=selectedQuotes.filter(q=>q.status==='draft');
  const accepted=sent.filter(q=>approvalByQuote.get(q.id)?.decision==='accepted');
  const declined=sent.filter(q=>approvalByQuote.get(q.id)?.decision==='declined');
  const pending=sent.filter(q=>!['accepted','declined'].includes(approvalByQuote.get(q.id)?.decision));
  const liveOrders=selectedOrders.filter(o=>!clean(o.status).startsWith('test_') && clean(o.status)!=='test');
  const sumQuote=list=>list.reduce((sum,q)=>sum+(quoteTotal(q)??0),0);
  const invalidQuoteCount=sent.filter(q=>quoteTotal(q)===null).length;
  const followups=active.filter(l=>{const d=detailById.get(l.id)?.next_follow_up_date;return typeof d==='string'&&d&&d<=today})
    .sort((a,b)=>String(detailById.get(a.id)?.next_follow_up_date).localeCompare(String(detailById.get(b.id)?.next_follow_up_date)))
    .map(l=>({id:l.id,name:clean(l.customer_name)||'Customer',date:detailById.get(l.id)?.next_follow_up_date||'',service:clean(l.service_slug)||'General',stage:detailById.get(l.id)?.stage||'new'}));
  const pendingOffers=pending.map(q=>({id:q.id,number:q.quote_number,customer:clean(q.customer_name)||clean(allLeadById.get(q.lead_id)?.customer_name)||'Customer',expiry:stamp(q.valid_until),decision:approvalByQuote.get(q.id)?.decision||'no link',totalCents:quoteTotal(q)}))
    .sort((a,b)=>(a.expiry||'9999').localeCompare(b.expiry||'9999'));
  const months=monthsFor(today,period);const monthById=new Map(months.map(m=>[m.month,m]));
  const addByMonth=(items,property,amountFn)=>{for(const x of items){const bucket=monthById.get(stamp(x.created_at).slice(0,7));if(bucket)bucket[property]+=(amountFn?amountFn(x):1)}};
  addByMonth(cohort,'enquiries');addByMonth(sent,'sentQuotes');addByMonth(accepted,'acceptedQuotes');addByMonth(liveOrders,'paidGrossCents',o=>int(o.paid_amount_cents));
  return {
    window:{period,from:start||'All history',to:today,service:service||'all'},
    totals:{leads:cohort.length,archived:cohort.filter(l=>Boolean(l.archived_at)).length,
      open:active.length,openEstimatedCents:active.reduce((n,l)=>n+int(detailById.get(l.id)?.estimated_value_cents),0),
      won:cohort.filter(l=>(detailById.get(l.id)?.stage||'new')==='won').length,
      lost:cohort.filter(l=>(detailById.get(l.id)?.stage||'new')==='lost').length,
      followupsDue:followups.length,quotesSent:sent.length,quotesDraft:draft.length,
      quotesAccepted:accepted.length,quotesDeclined:declined.length,quotesPending:pending.length,
      quotedSentCents:sumQuote(sent),acceptedQuoteCents:sumQuote(accepted),
      acceptedRate:sent.length?accepted.length/sent.length:null,
      grossStripeCents:liveOrders.reduce((sum,o)=>sum+int(o.paid_amount_cents),0),livePaidOrders:liveOrders.length,
      excludedTestOrders:selectedOrders.length-liveOrders.length,invalidQuoteCount},
    stages,sources:group(cohort,'submission_type'),services:group(cohort,'service_slug'),months,
    followups:followups.slice(0,12),pendingOffers:pendingOffers.slice(0,12)
  };
}
export function exportSummaryCsv(report){
  const lines=[['Report','LilKangooMedia private CRM snapshot'],['Period',report.window.period],['From',report.window.from],['To',report.window.to],['Service',report.window.service]];
  for(const [k,v] of Object.entries(report.totals))lines.push([k,String(v===null?'':v)]);
  lines.push(['',''],['STAGES','Count']);for(const x of report.stages)lines.push([x.label,String(x.count)]);
  lines.push(['',''],['SOURCES','Count']);for(const x of report.sources)lines.push([x.name,String(x.count)]);
  lines.push(['',''],['SERVICES','Count']);for(const x of report.services)lines.push([x.name,String(x.count)]);
  lines.push(['',''],['MONTH','Enquiries','Sent quote versions','Accepted quote versions','Stripe gross cents']);
  for(const x of report.months)lines.push([x.month,String(x.enquiries),String(x.sentQuotes),String(x.acceptedQuotes),String(x.paidGrossCents)]);
  const escape=x=>{
    let s=String(x??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';
  };
  return '\ufeff'+lines.map(row=>row.map(escape).join(',')).join('\r\n')+'\r\n';
}
