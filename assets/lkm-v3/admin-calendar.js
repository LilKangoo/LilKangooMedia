/* LilKangooMedia Phase 21.3 — an authenticated calendar for enquiries, paid requests and manual date blocks.
 * RLS requires existing public.lkm_is_admin(). No private data is rendered to public pages.
 */
(()=>{'use strict';
  const root=document.getElementById('lkmAdminCalendar');
  const store=window.LKMStore,cfg=window.LKM_CONFIG||{};
  if(!root||!store)return;
  const api=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&quot;'}[c]));
  const currentDate=()=>{
    const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Nicosia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value=t=>p.find(x=>x.type===t)?.value||'';
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const state={month:currentDate().slice(0,7),day:currentDate(),scope:'*',services:[],blocks:[],leads:[],orders:[],confirmations:[],loading:false,notice:'',noticeType:'',configured:true};
  const monthBounds=(ym)=>{const [y,m]=ym.split('-').map(Number);return {first:`${ym}-01`,last:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10),days:new Date(Date.UTC(y,m,0)).getUTCDate()}};
  const monthTitle=ym=>new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(ym+'-01T12:00:00Z'));
  const shiftMonth=(ym,n)=>{const [y,m]=ym.split('-').map(Number);return new Date(Date.UTC(y,m-1+n,1)).toISOString().slice(0,7)};
  const dateLabel=d=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
  const scopeLabel=slug=>slug?state.services.find(s=>s.slug===slug)?.title||slug:'All services';
  const activeScope=slug=>state.scope==='*'||!slug||slug===state.scope;
  const notice=(s,type='')=>{state.notice=s;state.noticeType=type;draw()};
  const authError=message=>{root.innerHTML=`<div class="lkmcal-auth"><h1>Availability calendar</h1><p class="lkmcal-muted">Sign in using your LilKangooMedia administrator account.</p><form id="lkmcal-login"><label>Email<input type="email" name="email" autocomplete="email" required></label><label>Password<input type="password" name="password" autocomplete="current-password" required></label><button class="lkmcal-btn lkmcal-btn-dark" type="submit">Sign in</button></form>${message?`<p role="alert" class="lkmcal-alert error">${esc(message)}</p>`:''}<p class="lkmcal-muted"><a href="/admin.html">Back to admin</a></p></div>`};
  async function rest(path,method='GET',body=null){
    const jwt=await store.authenticatedToken();
    const headers={apikey:cfg.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt,'Content-Type':'application/json'};
    if(method!=='GET')headers.Prefer='return=representation';
    const res=await fetch(api+'/rest/v1/'+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store'});
    if(!res.ok){const txt=(await res.text()).slice(0,250);
      if(res.status===404 && /availability_blocks|PGRST205|42P01|PGRST116/.test(txt))throw Error('Availability table not installed. Run the supplied Phase 21.3 SQL migration in Supabase.');
      if(res.status===409)throw Error('Date unavailable: a block or confirmed booking already exists. Refresh the calendar.');
      throw Error(`Supabase ${res.status}: ${txt}`);
    }
    if(res.status===204)return [];
    const raw=await res.text();return raw?JSON.parse(raw):[];
  }
  async function initialize(){
    if(!store.configured){authError('Supabase is not configured. This calendar has no offline/demo mode.');return}
    try{
      await store.authenticatedToken();
      if(!await store.isAdmin())throw Error('This account does not have administrator access.');
      state.services=await store.adminServices();
      await load();
    }catch(err){authError(err.message)}
  }
  async function load(){
    if(state.loading)return;
    state.loading=true;
    root.innerHTML='<div class="loading-screen">Loading the availability calendar…</div>';
    try{
      const {first,last}=monthBounds(state.month);
      const params='preferred_date=gte.'+first+'&preferred_date=lte.'+last;
      const [blocks,leads,orders,confirmations]=await Promise.all([
        rest('lkm_availability_blocks?select=id,service_slug,blocked_date,note,created_at&blocked_date=gte.'+first+'&blocked_date=lte.'+last+'&order=blocked_date.asc&limit=1000'),
        rest('contact_leads?select=id,customer_name,customer_email,service_slug,service_type,preferred_date,status,submission_type,created_at&'+params+'&order=preferred_date.asc&limit=1000'),
        rest('stripe_orders?select=id,customer_name,customer_email,service_slug,preferred_date,status,paid_amount_cents,created_at&'+params+'&order=preferred_date.asc&limit=1000'),
        rest('lkm_booking_confirmations?select=id,source_type,source_id,service_slug,booking_date,state&state=eq.confirmed&booking_date=gte.'+first+'&booking_date=lte.'+last+'&limit=1000')
      ]);
      state.blocks=blocks;state.leads=leads;state.orders=orders;state.confirmations=confirmations;state.notice='';
    }catch(error){state.notice=error.message;state.noticeType='error';state.blocks=[];state.leads=[];state.orders=[];state.confirmations=[]}
    finally{state.loading=false;draw()}
  }
  function counts(date){
    const leads=state.leads.filter(x=>x.preferred_date===date&&activeScope(x.service_slug));
    const orders=state.orders.filter(x=>x.preferred_date===date&&activeScope(x.service_slug));
    const blocks=state.blocks.filter(x=>x.blocked_date===date&&activeScope(x.service_slug));
    const confirmations=state.confirmations.filter(x=>x.booking_date===date&&activeScope(x.service_slug));
    return {leads,orders,blocks,confirmations};
  }
  function dayButton(day){
    const date=`${state.month}-${String(day).padStart(2,'0')}`;
    const x=counts(date),tags=[];
    if(x.blocks.length)tags.push(`<span class="lkmcal-tag lkmcal-tag-blocked">Blocked</span>`);
    if(x.leads.length)tags.push(`<span class="lkmcal-tag">${x.leads.length} enquir${x.leads.length===1?'y':'ies'}</span>`);
    if(x.orders.length)tags.push(`<span class="lkmcal-tag lkmcal-tag-paid">${x.orders.length} paid</span>`);
    if(x.confirmations.length)tags.push(`<span class="lkmcal-tag lkmcal-tag-confirmed">${x.confirmations.length} confirmed</span>`);
    return `<button class="lkmcal-day ${x.blocks.length?'lkmcal-day-blocked':''} ${date===currentDate()?'lkmcal-day-today':''} ${date===state.day?'lkmcal-day-selected':''}" type="button" data-date="${date}" aria-pressed="${date===state.day}" aria-label="${esc(dateLabel(date))}, ${x.blocks.length} blocks, ${x.leads.length} enquiries, ${x.orders.length} paid requests, ${x.confirmations.length} confirmed bookings"><span class="lkmcal-day-num">${day}</span><span class="lkmcal-day-tags">${tags.join('')}</span></button>`;
  }
  const entry=(title,text,meta)=>`<article class="lkmcal-entry"><strong>${esc(title)}</strong><div>${esc(text)}</div>${meta?`<small>${esc(meta)}</small>`:''}</article>`;
  function detail(){
    const d=state.day,x=counts(d),past=d<currentDate();
    const blocks=x.blocks.map(b=>`<div class="lkmcal-entry"><strong>${esc(scopeLabel(b.service_slug))}: unavailable</strong><div>${esc(b.note||'No note')}</div><button class="lkmcal-btn lkmcal-btn-danger" type="button" data-unblock="${esc(b.id)}">Remove block</button></div>`).join('')||'<p class="lkmcal-empty">No date blocks.</p>';
    const confirmedSet=new Set(x.confirmations.map(c=>c.source_type+':'+c.source_id));
    const actionButtons=(source,row)=>{
      const key=source+':'+row.id, confirmed=confirmedSet.has(key);
      const status=String(row.status||'');
      const closed=/declined|cancelled|refund_review_required/.test(status);
      if(confirmed){
        const email=String(row.customer_email||'');
        const safeEmail=/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email);
        const mail=safeEmail?'mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('Your LilKangooMedia booking — '+state.day)+'&body='+encodeURIComponent('Hello '+String(row.customer_name||'')+',\n\nYour LilKangooMedia booking for '+scopeLabel(row.service_slug)+' on '+state.day+' has been confirmed. We will contact you regarding the remaining details.\n\nLilKangooMedia'):'';
        return `<div class="lkmcal-decision-actions">${safeEmail?`<a class="lkmcal-btn" href="${esc(mail)}">Email confirmation to client ↗</a>`:''}<button class="lkmcal-btn lkmcal-btn-danger" data-decision="cancel" data-source="${source}" data-source-id="${esc(row.id)}" type="button">Cancel confirmed booking</button></div>`;
      }
      if(closed)return '<small>Closed — for paid requests, verify any refund separately in Stripe.</small>';
      return `<div class="lkmcal-decision-actions"><button class="lkmcal-btn lkmcal-btn-dark" data-decision="confirm" data-source="${source}" data-source-id="${esc(row.id)}" type="button">Confirm full day</button><button class="lkmcal-btn" data-decision="decline" data-source="${source}" data-source-id="${esc(row.id)}" type="button">Decline</button></div>`;
    };
    const paid=x.orders.map(o=>`<article class="lkmcal-entry"><strong>${esc(o.customer_name||'Paid request')}</strong><div>${esc(scopeLabel(o.service_slug))}</div><small>${esc(o.status||'pending')} · €${((Number(o.paid_amount_cents)||0)/100).toFixed(2)}</small>${actionButtons('order',o)}</article>`).join('')||'<p class="lkmcal-empty">No paid requests.</p>';
    const pending=x.leads.map(l=>`<article class="lkmcal-entry"><strong>${esc(l.customer_name||'Enquiry')}</strong><div>${esc(scopeLabel(l.service_slug||l.service_type))}</div><small>${esc(l.status||'new')}</small>${actionButtons('lead',l)}</article>`).join('')||'<p class="lkmcal-empty">No enquiries.</p>';
    return `<aside class="lkmcal-card lkmcal-aside"><h2>${esc(dateLabel(d))}</h2><p class="lkmcal-muted">${esc(state.scope==='*'?'All services':scopeLabel(state.scope))} · Dates are manually confirmed with clients.</p>
      ${state.notice?`<p class="lkmcal-alert ${esc(state.noticeType)}" role="status">${esc(state.notice)}</p>`:''}
      <h3>Unavailable dates (${x.blocks.length})</h3>${blocks}
      <form id="lkmcal-block-form" class="lkmcal-form">
        <label>Block scope<select name="scope"><option value="">All services</option>${state.services.filter(s=>s.active!==false).map(s=>`<option value="${esc(s.slug)}" ${s.slug===state.scope?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label>
        <label>Private note (optional)<input name="note" maxlength="400" placeholder="e.g. day off, existing project"></label>
        <button class="lkmcal-btn lkmcal-btn-dark" type="submit" ${past?'disabled':''}>Block ${esc(dateLabel(d))}</button>
        ${past?'<small class="lkmcal-muted">Past dates cannot be blocked.</small>':''}
      </form>
      <h3>Confirmed bookings (${x.confirmations.length})</h3><p class="lkmcal-muted">Confirmations reserve the whole day for that service. No other request can be confirmed for the same service and date.</p>${x.confirmations.length?x.confirmations.map(c=>entry(scopeLabel(c.service_slug),'Reserved for '+(c.source_type==='order'?'paid order':'enquiry'),'Full-day confirmation')).join(''):'<p class="lkmcal-empty">No confirmed bookings.</p>'}
      <h3>Paid booking requests (${x.orders.length})</h3>${paid}
      <h3>Enquiries (${x.leads.length})</h3>${pending}
      <p class="lkmcal-muted"><a href="/admin.html#leads">View and manage enquiries and payments in Admin ↗</a></p>
    </aside>`;
  }
  function draw(){
    const {days}=monthBounds(state.month);
    const weekday=(new Date(state.month+'-01T12:00:00Z').getUTCDay()+6)%7;
    const firstWeek=Array.from({length:weekday},()=>'<div aria-hidden="true"></div>').join('');
    const allLeads=state.leads.filter(x=>activeScope(x.service_slug)).length;
    const allOrders=state.orders.filter(x=>activeScope(x.service_slug)).length;
    const allBlocks=state.blocks.filter(x=>activeScope(x.service_slug)).length;
    const allConfirmed=state.confirmations.filter(x=>activeScope(x.service_slug)).length;
    root.innerHTML=`<div class="lkmcal-heading"><div><p class="lkmcal-eyebrow">ADMIN / AVAILABILITY</p><h1>Booking calendar</h1><p>Review incoming enquiries and paid requests, then block unavailable dates for individual services or the whole team.</p></div><a href="/admin.html#leads" class="lkmcal-btn">View all enquiries ↗</a></div>
      <div class="lkmcal-top"><label>Show service<select id="lkmcal-filter"><option value="*">All services</option>${state.services.map(s=>`<option value="${esc(s.slug)}" ${state.scope===s.slug?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label>
        <div class="lkmcal-controls"><button class="lkmcal-btn" id="lkmcal-prev" type="button" aria-label="Previous month">←</button><strong class="lkmcal-month-label">${esc(monthTitle(state.month))}</strong><button class="lkmcal-btn" id="lkmcal-next" type="button" aria-label="Next month">→</button><button class="lkmcal-btn" id="lkmcal-today" type="button">Today</button><button class="lkmcal-btn" id="lkmcal-reload" type="button">Refresh</button></div></div>
      <div class="lkmcal-stats"><div class="lkmcal-stat"><strong>${allLeads}</strong><small>Enquiries this month</small></div><div class="lkmcal-stat"><strong>${allOrders}</strong><small>Paid requests this month</small></div><div class="lkmcal-stat"><strong>${allBlocks}</strong><small>Blocked dates this month</small></div><div class="lkmcal-stat"><strong>${allConfirmed}</strong><small>Confirmed full days</small></div></div>
      <div class="lkmcal-layout"><section class="lkmcal-card" aria-label="Booking calendar"><div class="lkmcal-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<span>${x}</span>`).join('')}</div><div class="lkmcal-days">${firstWeek+Array.from({length:days},(_,i)=>dayButton(i+1)).join('')}</div><div class="lkmcal-legend"><span>Green: enquiry</span><span>Violet: paid request</span><span>Red: blocked</span><span>Dark green: confirmed</span></div><p class="lkmcal-muted">Paid requests are not automatically confirmed. Only a manual confirmation reserves that service for the full day. Payment refunds are always a separate Stripe process.</p></section>${detail()}</div>`;
  }
  root.addEventListener('submit',async e=>{
    if(e.target.id==='lkmcal-login'){
      e.preventDefault();const form=e.target;try{await store.login(form.elements.email.value.trim(),form.elements.password.value);if(!await store.isAdmin())throw Error('Account is not an administrator.');state.services=await store.adminServices();await load()}catch(err){await store.logout?.();authError(err.message)}
      return;
    }
    if(e.target.id!=='lkmcal-block-form')return;
    e.preventDefault();const form=e.target,submit=form.querySelector('button[type="submit"]');submit.disabled=true;
    const service=form.elements.scope.value||null,note=form.elements.note.value.trim();
    if(state.day<currentDate()){notice('Cannot block a date in the past.','error');return}
    try{await rest('lkm_availability_blocks','POST',{service_slug:service,blocked_date:state.day,note});await load();state.notice='Date blocked. Public availability will now show it as unavailable.';state.noticeType='good';draw()}
    catch(err){notice(err.message,'error')}
  });
  root.addEventListener('change',e=>{if(e.target.id==='lkmcal-filter'){state.scope=e.target.value;draw()}});
  root.addEventListener('click',async e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.dataset.date){state.day=btn.dataset.date;draw();return}
    if(btn.id==='lkmcal-prev'||btn.id==='lkmcal-next'){
      state.month=shiftMonth(state.month,btn.id==='lkmcal-prev'?-1:1);
      state.day=state.month+'-01';await load();return;
    }
    if(btn.id==='lkmcal-today'){state.day=currentDate();state.month=state.day.slice(0,7);await load();return}
    if(btn.id==='lkmcal-reload'){await load();return}
    if(btn.dataset.decision){
      const decision=btn.dataset.decision,source=btn.dataset.source,id=btn.dataset.sourceId;
      if(!['confirm','decline','cancel'].includes(decision)||!['lead','order'].includes(source)||!/^[-a-f0-9]{36}$/i.test(id||''))return;
      const explanation=decision==='confirm'?`Confirm this ${source==='order'?'paid order':'enquiry'} and reserve the ENTIRE day for this service?`:
        `${decision==='cancel'?'Cancel':'Decline'} this ${source==='order'?'paid order':'enquiry'}? ${source==='order'?'This will flag a refund review. NO refund is issued automatically.':''}`;
      if(!confirm(explanation))return;
      btn.disabled=true;
      try{
        await rest('rpc/lkm_admin_booking_decision','POST',{p_source_type:source,p_source_id:id,p_decision:decision});
        await load();
        state.notice=decision==='confirm'?'Booking confirmed. Entire service/day reserved. Contact client to confirm details.':source==='order'?'Request closed. IMPORTANT: review paid amount and any refund manually in Stripe.':'Request updated.';
        state.noticeType='good';draw();
      }catch(err){notice(err.message,'error')}
      return;
    }
    if(btn.dataset.unblock){
      const id=btn.dataset.unblock;
      if(!/^[a-f\d-]{36}$/i.test(id)||!confirm('Remove this unavailable-date block?'))return;
      btn.disabled=true;
      try{await rest('lkm_availability_blocks?id=eq.'+encodeURIComponent(id),'DELETE');await load();state.notice='Date block removed.';state.noticeType='good';draw()}
      catch(err){notice(err.message,'error')}
    }
  });
  initialize();
})();
