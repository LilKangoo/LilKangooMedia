/* LilKangooMedia Phase 23.2 — PRIVATE Sales Quotation Builder.
 * Pulls contact_leads via admin RLS; uses separately secured lkm_crm_quotes.
 * No Stripe/refund integrations. PDF via Chrome/Safari/Edge native Print > Save as PDF.
 * No email is sent or status changed automatically.
 */
(async()=>{'use strict';
 const {euroToCents,centsToEuro,computeQuote,validateQuote,validLeadId,quoteCode}=await import('/assets/lkm-v3/phase23-quotes-core.mjs');
 const root=document.getElementById('lkmQuotesRoot'),printRoot=document.getElementById('lkm23PrintRoot');
 if(!root||!printRoot)return;
 const store=window.LKMStore,cfg=window.LKM_CONFIG||{};
 const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');const key=String(cfg.SUPABASE_ANON_KEY||'');
 const st={leads:[],services:[],quotes:[],approvals:[],current:null,dirty:false,active:false,busy:false,filter:'',lastError:''};
 const el=(t,c='',text)=>{const n=document.createElement(t);if(c)n.className=c;if(text!==undefined)n.textContent=String(text);return n};
 const add=(p,...ch)=>{p.append(...ch);return p};
 const label=(text,element)=>{const w=el('label','lkm23q-label');add(w,el('span','',text),element);return w};
 const input=(value='',type='text',max=160)=>{const n=el('input');n.type=type;n.value=String(value??'');if(type==='text'||type==='email')n.maxLength=max;return n};
 const area=(value='',max=3000,rows=4)=>{const n=el('textarea');n.value=String(value??'');n.maxLength=max;n.rows=rows;return n};
 const select=(options,val='')=>{const n=el('select');for(const [v,t] of options){const opt=el('option','',t);opt.value=v;opt.selected=v===val;n.append(opt)}return n};
 const money=c=>'€'+(Number(c||0)/100).toLocaleString('en-IE',{minimumFractionDigits:2,maximumFractionDigits:2});
 const day=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Nicosia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=k=>p.find(x=>x.type===k)?.value;return `${part('year')}-${part('month')}-${part('day')}`};
 const plusDays=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
  const defaultTerms='This quotation is an offer, not a confirmed booking. Dates, deliverables and schedule require written agreement. Any additional work or costs outside the listed scope will be quoted separately. Payment terms will be agreed before work begins.';
 const blank=lead=>({lead_id:lead?.id||'',status:'draft',title:lead?.service_slug?'Creative services — '+lead.service_slug:'Creative services quotation',customer_name:lead?.customer_name||'',customer_email:lead?.customer_email||'',customer_company:'',customer_phone:lead?.phone||'',issue_date:day(),valid_until:plusDays(day(),14),currency:'EUR',introduction:'Thank you for considering LilKangooMedia for your project. Below is our proposed scope and pricing.',scope_notes:'',line_items:[],discount_cents:0,terms:defaultTerms});
 function announce(text,isError=false){const n=document.getElementById('lkm23qStatus');if(n){n.textContent=text;n.classList.toggle('is-error',isError)}}
 async function api(path,opt={}){
  if(!store?.configured||!base.startsWith('https://')||!key)throw Error('Supabase configuration is missing.');
  const token=await store.authenticatedToken();
  const res=await fetch(base+'/rest/v1/'+path,{method:opt.method||'GET',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',...(opt.headers||{})},...(opt.body!==undefined?{body:JSON.stringify(opt.body)}:{})});
  if(!res.ok){if(res.status===401||res.status===403)throw Error('Administrator session expired or access denied.');
   const e=await res.json().catch(()=>({}));throw Error(typeof e.message==='string'?e.message.slice(0,220):'Database request failed ('+res.status+'). Check SQL migration.');}
  const body=await res.text();return body?JSON.parse(body):[];
 }
 function login(message='Sign in with the existing LilKangooMedia administrator account.'){
  root.replaceChildren();const box=el('section','lkm23q-login');add(box,el('p','lkm23q-overline','PRIVATE · SALES'),el('h1','','Quotation Builder'),el('p','',message));
  const form=el('form','lkm23q-login-form');const user=input('','email'),pass=input('','password');user.required=pass.required=true;user.placeholder='Admin email';pass.placeholder='Password';user.autocomplete='username';pass.autocomplete='current-password';
  const btn=el('button','button button-dark','Sign in');btn.type='submit';const err=el('p','');err.setAttribute('role','status');add(form,user,pass,btn,err);box.append(form);root.append(box);
  form.addEventListener('submit',async ev=>{ev.preventDefault();if(!form.reportValidity())return;btn.disabled=true;err.textContent='Signing in…';try{await store.login(user.value.trim(),pass.value);if(!await store.isAdmin())throw Error('Not an administrator.');pass.value='';await refresh();}catch(ex){store.logout();pass.value='';err.textContent=ex.message||'Login failed.';btn.disabled=false}});
 }
 function dirty(){st.dirty=true;updateBadge()}
 function updateBadge(){const badge=document.getElementById('lkm23qBadge');if(!badge)return;badge.textContent=st.dirty?'Unsaved changes':st.current?.id?'Saved quotation':'New draft';badge.classList.toggle('dirty',st.dirty);
 const print=document.getElementById('lkm23qPrint');if(print)print.disabled=st.dirty||!st.current?.id;
 }
 function leadOptions(){return [['','Choose a CRM enquiry'],...st.leads.filter(l=>!l.archived_at||l.id===st.current?.lead_id).map(l=>[l.id,`${l.customer_name||'Customer'} — ${l.customer_email||l.service_slug||'Enquiry'}${l.archived_at?' (archived)':''}`])];}
 function selectLead(id){const lead=st.leads.find(l=>l.id===id);st.current=blank(lead);st.dirty=true;render()}
 function menu(){const bar=el('header','lkm23q-header');const left=el('div');add(left,el('p','lkm23q-overline','LILKANGOOMEDIA · SALES'),el('h1','','Quotation Builder'),el('p','lkm23q-hint','Create private, editable quotations. Save first, then print or save as PDF. Sending is always manual.'));
 const right=el('div','lkm23q-actions');const back=el('a','button button-light','← Sales CRM');back.href='/admin-crm.html';right.append(back);const refreshBtn=el('button','button button-light','Refresh');refreshBtn.type='button';refreshBtn.addEventListener('click',()=>{if(st.dirty&&!confirm('Discard unsaved edits and reload saved quotations?'))return;void refresh();});
 const sign=el('button','button button-light','Sign out');sign.type='button';sign.addEventListener('click',()=>{if(st.dirty&&!confirm('Discard unsaved changes and sign out?'))return;store.logout();st.current=null;printRoot.replaceChildren();printRoot.hidden=true;login('Signed out. Sign in to view quotations.');});right.append(refreshBtn,sign);
 add(bar,left,right);return bar;
 }
 function summaryCard(q){const a=el('button','lkm23q-quote-card'+(st.current?.id===q.id?' active':''));a.type='button';
 add(a,el('strong','',quoteCode(q.quote_number)),el('span','',q.customer_name||'No client name'),el('small','',q.title||'Untitled proposal'),el('small','',q.status==='sent'?(st.approvals.find(a=>a.quote_id===q.id)?.decision||'Sent · awaiting link'):'Draft'));
 a.addEventListener('click',()=>{if(st.dirty&&!confirm('Discard unsaved changes?'))return;st.current=JSON.parse(JSON.stringify(q));st.dirty=false;render();});return a;}
 function aside(){const box=el('aside','lkm23q-side');const top=el('div','lkm23q-side-top');top.append(el('h2','','Saved quotations'));
 const newQuote=el('button','button button-orange','+ New quotation');newQuote.type='button';newQuote.addEventListener('click',()=>{if(st.dirty&&!confirm('Discard unsaved changes?'))return;st.current=null;st.dirty=false;render();});top.append(newQuote);box.append(top);
 const s=input(st.filter,'search');s.placeholder='Search quote, client, project…';s.setAttribute('aria-label','Search saved quotations');box.append(s);
 const rows=el('div','lkm23q-quote-list');const refreshList=()=>{rows.replaceChildren();const f=st.filter.trim().toLowerCase();const data=st.quotes.filter(q=>!f||[quoteCode(q.quote_number),q.customer_name,q.customer_email,q.title].some(v=>String(v||'').toLowerCase().includes(f)));if(!data.length)rows.append(el('p','lkm23q-hint','No quotations match.'));else data.forEach(q=>rows.append(summaryCard(q)));};
 s.addEventListener('input',()=>{st.filter=s.value;refreshList()});refreshList();box.append(rows);return box;
 }
 function lineWidget(item,index){const row=el('div','lkm23q-item');row.dataset.row=String(index);
 const desc=input(item.description||'','text',180);desc.placeholder='Work / deliverable (e.g. 1-hour photography session)';desc.dataset.field='description';
 const qty=input(item.quantity??1,'number');qty.min='0.25';qty.max='1000';qty.step='0.25';qty.dataset.field='quantity';
 const price=input(centsToEuro(item.unit_price_cents??0),'text');price.inputMode='decimal';price.dataset.field='unit_price_cents';
 const total=el('strong','lkm23q-line-total',money(Math.round(Number(item.unit_price_cents||0)*Number(item.quantity||0))));
 const remove=el('button','lkm23q-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove quotation line '+(index+1));remove.addEventListener('click',()=>{sync();st.current.line_items.splice(index,1);dirty();renderEditor();});
 add(row,label('Description',desc),label('Qty',qty),label('Price per unit (€)',price),total,remove);return row;
 }
 function sync(){const q=st.current;if(!q)return;
 const values={};for(const n of document.querySelectorAll('[data-quote-field]'))values[n.dataset.quoteField]=n.value;
 for(const field of ['title','customer_name','customer_email','customer_company','customer_phone','issue_date','valid_until','introduction','scope_notes','terms','status'])if(Object.hasOwn(values,field))q[field]=values[field];
 const ds=document.getElementById('lkm23qDiscount');if(ds){try{q.discount_cents=euroToCents(ds.value||'0');ds.setCustomValidity('')}catch{ds.setCustomValidity('Enter a valid EUR amount');}}
 const list=[];for(const item of document.querySelectorAll('[data-row]')){
  const val=field=>item.querySelector('[data-field="'+field+'"]')?.value;
  let cents;try{cents=euroToCents(val('unit_price_cents')||'0')}catch{cents=-1;}
  list.push({description:val('description')||'',quantity:Number(val('quantity')),unit_price_cents:cents});
 }
 q.line_items=list;
 }
 function displayTotals(){const q=st.current;if(!q)return;
 const total=document.getElementById('lkm23qTotals');if(!total)return;
 try{sync();const result=computeQuote(q.line_items,q.discount_cents);
 total.replaceChildren();const pair=(name,amount)=>{const d=el('div','lkm23q-totals-line');add(d,el('span','',name),el('strong','',money(amount)));return d;};
 add(total,pair('Subtotal',result.subtotal),pair('Discount',-result.discount),pair('Proposed total',result.total));total.classList.remove('is-invalid');
 document.querySelectorAll('[data-row]').forEach((row,i)=>{const p=row.querySelector('.lkm23q-line-total');if(p)p.textContent=money(Math.round(result.lines[i].quantity*result.lines[i].unit_price_cents))});
 }catch(ex){total.textContent=ex.message||'Please check the quotation lines.';total.classList.add('is-invalid')}
 }
 function serviceEntry(){const list=[];for(const s of st.services){if(s.active===false||!Array.isArray(s.packages))continue;for(const p of s.packages){
  if(!Number.isSafeInteger(p.price_cents)||p.price_cents<0||p.show_from||p.pricing_model==='quote'||p.setup_fee_cents)continue;
  const m=p.pricing_model||'fixed';if(!['fixed','hour','day','person','item'].includes(m))continue;
  const note=m==='fixed'?'':` (per ${m})`;
  list.push([JSON.stringify({s:s.slug,p:p.id}),`${s.title} — ${p.name||'Package'}${note} · ${money(p.price_cents)}`,{s,p}]);
 }}return list;}
 function editor(){const q=st.current;const box=el('section','lkm23q-editor');const badge=el('div','lkm23q-editor-bar');add(badge,el('p','lkm23q-code',q.id?quoteCode(q.quote_number):'NEW QUOTATION'),el('span','lkm23q-badge',''));badge.lastChild.id='lkm23qBadge';box.append(badge);
 const grid=el('div','lkm23q-grid');const createField=(name,title,value,type='text',max=160)=>{const field=input(value,type,max);field.dataset.quoteField=name;grid.append(label(title,field));return field;};
 createField('title','Project / quotation title',q.title,'text',180);
 const leadSelect=select(leadOptions(),q.lead_id);leadSelect.id='lkm23qLead';grid.append(label('Source enquiry (required)',leadSelect));
 leadSelect.disabled=Boolean(q.id);leadSelect.addEventListener('change',()=>{if(!leadSelect.value)return;if(st.dirty&&!confirm('Change customer and discard the current draft details?')){leadSelect.value=q.lead_id;return;}selectLead(leadSelect.value)});
 createField('customer_name','Customer name',q.customer_name,'text',120);
 createField('customer_email','Customer email',q.customer_email,'email',200);
 createField('customer_company','Company / organisation (optional)',q.customer_company,'text',160);
 createField('customer_phone','Phone (optional)',q.customer_phone,'text',50);
 createField('issue_date','Issued on',q.issue_date,'date');createField('valid_until','Valid until',q.valid_until,'date');
 box.append(grid);
 const intro=area(q.introduction,1600,3);intro.dataset.quoteField='introduction';box.append(label('Introduction / executive summary',intro));
 box.append(el('h2','lkm23q-section-title','Scope & pricing'));
 const table=el('div','lkm23q-items');table.id='lkm23qItems';q.line_items.forEach((item,i)=>table.append(lineWidget(item,i)));box.append(table);
 const ctrls=el('div','lkm23q-add');const addRow=el('button','button button-light','+ Add custom line');addRow.type='button';addRow.addEventListener('click',()=>{sync();if(q.line_items.length>=30){announce('Maximum 30 lines.',true);return;}q.line_items.push({description:'',quantity:1,unit_price_cents:0});dirty();renderEditor();});ctrls.append(addRow);
 const choices=serviceEntry();if(choices.length){const from=select([['','Choose an existing priced service…'],...choices.map(([v,title])=>[v,title])]);from.id='lkm23qCatalog';const addCatalog=el('button','button button-light','+ Add from catalogue');addCatalog.type='button';addCatalog.addEventListener('click',()=>{if(!from.value)return;sync();if(q.line_items.length>=30){announce('Maximum 30 lines.',true);return;}const entry=choices.find(([v])=>v===from.value)?.[2];if(!entry)return;q.line_items.push({description:entry.s.title+' — '+(entry.p.name||'Package'),quantity:1,unit_price_cents:entry.p.price_cents});dirty();renderEditor();});ctrls.append(from,addCatalog);}
 box.append(ctrls);
 const discount=input(centsToEuro(q.discount_cents),'text');discount.id='lkm23qDiscount';discount.inputMode='decimal';
 const wrap=el('div','lkm23q-discount');wrap.append(label('Optional fixed discount (€)',discount));const totals=el('div','lkm23q-totals');totals.id='lkm23qTotals';wrap.append(totals);box.append(wrap);
 const scope=area(q.scope_notes,3000,4);scope.dataset.quoteField='scope_notes';box.append(label('Scope / delivery details (optional)',scope));
 const terms=area(q.terms,3000,4);terms.dataset.quoteField='terms';box.append(label('Terms & exclusions (editable)',terms));
 const notes=el('p','lkm23q-hint','This document is a quotation only — not a tax invoice, receipt, paid order or confirmed booking. VAT / tax treatment is not calculated by this builder.');box.append(notes);
 const buttons=el('div','lkm23q-save-actions');const save=el('button','button button-dark','Save quotation');save.type='button';save.id='lkm23qSave';save.addEventListener('click',()=>void persist());buttons.append(save);
 const pdf=el('button','button button-orange','Print / Save as PDF');pdf.id='lkm23qPrint';pdf.type='button';pdf.addEventListener('click',()=>void printQuote());buttons.append(pdf);
 const sent=el('button','button button-light','Mark sent manually');sent.type='button';sent.disabled=!q.id||q.status==='sent';sent.addEventListener('click',()=>void markSent());buttons.append(sent);
 if(q.id&&q.status==='sent')box.append(approvalControls(q));
 if(q.id&&q.customer_email){const email=el('a','button button-light','Draft email to client');email.href='mailto:'+encodeURIComponent(q.customer_email)+'?subject='+encodeURIComponent(quoteCode(q.quote_number)+' | LilKangooMedia quotation')+'&body='+encodeURIComponent('Hello '+q.customer_name+',\n\nPlease find attached our quotation '+quoteCode(q.quote_number)+' for your project.\n\nKind regards,\nLilKangooMedia');buttons.append(email);}
 if(q.id){
  const duplicate=el('button','button button-light','Create revised draft');duplicate.type='button';duplicate.addEventListener('click',()=>{
   if(st.dirty&&!confirm('Discard unsaved edits and create a new draft version?'))return;
   const revision={...JSON.parse(JSON.stringify(q)),status:'draft',issue_date:day(),valid_until:plusDays(day(),14)};
   for(const key of ['id','quote_number','created_at','updated_at','created_by','updated_by'])delete revision[key];
   st.current=revision;st.dirty=true;render();announce('Revised draft created. Edit and save it to receive a new quotation number.');
  });buttons.append(duplicate);
  if(q.status==='draft'){
   const discard=el('button','button lkm23q-delete','Discard draft');discard.type='button';
   discard.addEventListener('click',()=>void discardDraft(q));buttons.append(discard);
  }
 }
 box.append(buttons);
 if(q.status==='sent'){
   for(const control of box.querySelectorAll('input,select,textarea,button.lkm23q-remove,.lkm23q-add button'))control.disabled=true;
   save.disabled=true;
   box.append(el('p','lkm23q-sent-message','This quotation was marked as sent. Create a revised draft to change the scope or prices; the original remains in the archive.'));
 }
 box.addEventListener('input',()=>{dirty();displayTotals()});box.addEventListener('change',()=>{dirty();displayTotals()});
 const status=el('p','lkm23q-status');status.id='lkm23qStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');box.append(status);
 return box;
 }
 function approvalControls(q){
  const area=el('section','lkm23-approval-box');area.id='lkm23ApprovalControls';
  const saved=st.approvals.find(a=>a.quote_id===q.id);
  add(area,el('h3','','Client decision link'),el('p','lkm23q-hint',saved?
    `Status: ${saved.decision.toUpperCase()} · Valid through ${q.valid_until}. The old link cannot be recovered; generating another will invalidate it.`:
    'Share a private link for this exact sent quotation. No automatic email is sent.'));
  if(saved&&saved.decision!=='pending'){
    area.append(el('p','lkm23-approval-status','Client response: '+saved.decision.toUpperCase()+ (saved.decided_at?' · '+new Date(saved.decided_at).toLocaleDateString('en-GB'):'')));
    return area;
  }
  const btn=el('button','button button-light',saved?'Replace expired/lost link':'Generate client decision link');btn.type='button';
  const link=el('input');link.type='text';link.readOnly=true;link.hidden=true;link.setAttribute('aria-label','Private quotation acceptance link');link.id='lkm23ClientLink';
  const copy=el('button','button button-light','Copy link');copy.type='button';copy.hidden=true;
  const reply=el('p','lkm23q-hint');reply.setAttribute('role','status');
  btn.addEventListener('click',async()=>{
    if(st.dirty){reply.textContent='Save or discard unsaved changes first.';return;}
    if(saved&&!confirm('This replaces the previous client link. Continue?'))return;
    btn.disabled=true;reply.textContent='Creating private link…';
    try{
      const result=await api('rpc/lkm_quote_admin_share',{method:'POST',body:{p_quote_id:q.id}});
      if(!result?.ok||!/^lkm_[a-f0-9]{64}$/.test(result.token||''))throw Error('Share link was not created.');
      link.value=location.origin+'/proposal.html#token='+result.token;link.hidden=false;copy.hidden=false;
      st.approvals=st.approvals.filter(x=>x.quote_id!==q.id);
      st.approvals.push({quote_id:q.id,decision:'pending',expires_at:result.expires_on});
      reply.textContent='Link ready. Copy it and send it manually along with the PDF. Only the latest generated link works.';
      btn.textContent='Rotate link';
    }catch(e){reply.textContent=e.message||'Failed to generate link.'}finally{btn.disabled=false}
  });
  copy.addEventListener('click',async()=>{if(!link.value)return;try{await navigator.clipboard.writeText(link.value);reply.textContent='Link copied. Send it manually to the client.'}catch{link.focus();link.select();reply.textContent='Select and copy the link above.'}});
  area.append(btn,link,copy,reply);return area;
 }
 function renderEditor(){const host=document.getElementById('lkm23qEditorHost');if(!host)return;host.replaceChildren(editor());displayTotals();updateBadge();}
 function pick(){const data=st.current;if(!data)return;const container=el('div','lkm23q-layout');container.append(aside());const host=el('div');host.id='lkm23qEditorHost';container.append(host);root.append(container);renderEditor();}
 function chooseNew(){const panel=el('section','lkm23q-start');add(panel,el('h2','','Start a quotation'),el('p','lkm23q-hint','Choose a real enquiry from Sales CRM. Each quote stays linked to that customer and can have multiple revisions as separate draft quotations.'));
 const picker=select(leadOptions());picker.id='lkm23qLeadStart';panel.append(label('CRM enquiry',picker));const start=el('button','button button-dark','Create quotation');start.type='button';start.addEventListener('click',()=>{if(!picker.value){picker.focus();return;}selectLead(picker.value)});panel.append(start);return panel;}
 function render(){printRoot.hidden=true;root.replaceChildren(menu());if(!st.current){const layout=el('div','lkm23q-layout');layout.append(aside(),chooseNew());root.append(layout);const msg=el('p','lkm23q-status');msg.id='lkm23qStatus';root.append(msg);}else pick()}
 async function persist(){if(st.busy||!st.current)return;sync();const q=st.current;
 try{
  const x=validateQuote(q,q.status==='sent');
  const payload={lead_id:q.lead_id,status:q.status,title:q.title.trim(),customer_name:q.customer_name.trim(),customer_email:q.customer_email.trim(),customer_company:q.customer_company.trim(),customer_phone:q.customer_phone.trim(),issue_date:q.issue_date,valid_until:q.valid_until,currency:'EUR',introduction:q.introduction,scope_notes:q.scope_notes,line_items:x.lines,discount_cents:x.discount,terms:q.terms};
  st.busy=true;announce('Saving quotation…');const button=document.getElementById('lkm23qSave');if(button)button.disabled=true;
  const rows=await api(q.id?'lkm_crm_quotes?id=eq.'+encodeURIComponent(q.id):'lkm_crm_quotes',{method:q.id?'PATCH':'POST',headers:{Prefer:'return=representation'},body:payload});
  if(!Array.isArray(rows)||rows.length!==1)throw Error('Database did not confirm your changes.');
  st.current=rows[0];st.dirty=false;const index=st.quotes.findIndex(v=>v.id===st.current.id);if(index>=0)st.quotes[index]=rows[0];else st.quotes.unshift(rows[0]);
  render();announce('Quotation saved. Use Print / Save as PDF to export an A4 document.');
  const u=new URL(location.href);u.searchParams.set('quote_id',st.current.id);u.searchParams.delete('lead_id');history.replaceState({},'',u.pathname+u.search);
 }catch(e){announce(e.message||'Save failed.',true)}finally{st.busy=false;const b=document.getElementById('lkm23qSave');if(b)b.disabled=false;}
 }
 async function markSent(){if(st.busy||!st.current?.id)return;if(st.dirty){announce('Save edits before marking this quotation as sent.',true);return;}
 try{validateQuote(st.current,true)}catch(e){announce(e.message,true);return;}
 if(!confirm('Confirm you have sent this quotation to the client manually? The website will NOT send an email.'))return;
 st.busy=true;try{
  const rows=await api('lkm_crm_quotes?id=eq.'+encodeURIComponent(st.current.id),{method:'PATCH',headers:{Prefer:'return=representation'},body:{status:'sent'}});
  if(!Array.isArray(rows)||rows.length!==1)throw Error('Could not confirm status change.');
  st.current=rows[0];st.dirty=false;const i=st.quotes.findIndex(x=>x.id===st.current.id);if(i>=0)st.quotes[i]=rows[0];render();announce('Marked as sent manually. This did not send any email.');
 }catch(e){announce(e.message||'Could not mark as sent.',true)}finally{st.busy=false;}}
 async function discardDraft(q){
  if(st.busy||!q.id||q.status!=='draft')return;
  if(st.dirty){announce('Save or discard unsaved changes before deleting the draft.',true);return;}
  const phrase=prompt('Discard this DRAFT quotation permanently?\nSent quotations are protected.\n\nType DELETE to confirm:');
  if(phrase!=='DELETE'){if(phrase!==null)announce('Deletion cancelled — type DELETE exactly.',true);return;}
  st.busy=true;announce('Discarding draft quotation…');
  try{
   const result=await api('rpc/lkm_crm_admin_remove_draft_quote',{method:'POST',body:{p_quote_id:q.id,p_confirmation:'DELETE'}});
   if(!result?.ok)throw Error('Database did not confirm deletion.');
   st.quotes=st.quotes.filter(v=>v.id!==q.id);st.current=null;st.dirty=false;
   const u=new URL(location.href);u.searchParams.delete('quote_id');history.replaceState({},'',u.pathname+u.search);
   render();announce('Draft quotation deleted. Sent quotations are never deleted here.');
  }catch(e){announce(e.message||'Could not delete draft.',true)}finally{st.busy=false}
 }
 function printPair(parent,labelText,value){const d=el('div','lkm23q-print-meta');add(d,el('span','',labelText),el('strong','',value||'—'));parent.append(d)}
 function makePrint(q,calc){printRoot.replaceChildren();const sheet=el('article','lkm23q-print');const head=el('header','lkm23q-print-header');
 const brand=el('div','lkm23q-print-brand');const logo=el('img');logo.src='/assets/lkm-v3/brand/logo-orange.png';logo.alt='LilKangooMedia';brand.append(logo);const identity=el('div');add(identity,el('strong','','LilKangooMedia LTD'),el('span','','Photography · Film · Digital · Marketing'),el('span','','Cyprus · lilkangoomedia.com'),el('span','','photo@lilkangoomedia.com · +357 99 005 924'));brand.append(identity);
 add(head,brand,el('div','lkm23q-print-doc','QUOTATION'));sheet.append(head);
 const sub=el('div','lkm23q-print-title');add(sub,el('p','lkm23q-print-kicker','CREATIVE SERVICES PROPOSAL'),el('h1','',q.title||'Creative project quotation'));sheet.append(sub);
 const meta=el('div','lkm23q-print-columns');const client=el('div');client.append(el('h2','','PREPARED FOR'));
 add(client,el('strong','',q.customer_name||'Customer'));if(q.customer_company)client.append(el('span','',q.customer_company));if(q.customer_email)client.append(el('span','',q.customer_email));if(q.customer_phone)client.append(el('span','',q.customer_phone));
 const dates=el('div');printPair(dates,'Reference',quoteCode(q.quote_number));printPair(dates,'Issue date',q.issue_date);printPair(dates,'Valid until',q.valid_until);printPair(dates,'Currency','EUR');add(meta,client,dates);sheet.append(meta);
 if(q.introduction)sheet.append(el('p','lkm23q-print-intro',q.introduction));
 const heading=el('h2','lkm23q-print-heading','Scope & pricing');sheet.append(heading);
 const table=el('table','lkm23q-print-table');const thead=el('thead'),tr=el('tr');['SERVICES & DELIVERABLES','QTY','UNIT PRICE','AMOUNT'].forEach(t=>tr.append(el('th','',t)));thead.append(tr);table.append(thead);
 const tbody=el('tbody');calc.lines.forEach(item=>{const row=el('tr');const td=(text,c='')=>el('td',c,text);row.append(td(item.description),td(String(item.quantity),'right'),td(money(item.unit_price_cents),'right'),td(money(Math.round(item.quantity*item.unit_price_cents)),'right'));tbody.append(row)});table.append(tbody);sheet.append(table);
 const totals=el('div','lkm23q-print-totals');const totalLine=(title,v,strong=false)=>{const row=el('div',strong?'grand':'');add(row,el('span','',title),el('strong','',money(v)));totals.append(row);};totalLine('Subtotal',calc.subtotal);if(calc.discount>0)totalLine('Discount',-calc.discount);totalLine('PROPOSED TOTAL',calc.total,true);sheet.append(totals);
 if(q.scope_notes){const scope=el('section','lkm23q-print-section');add(scope,el('h2','','Project details'),el('p','',q.scope_notes));sheet.append(scope)}
 if(q.terms){const terms=el('section','lkm23q-print-section');add(terms,el('h2','','Terms & conditions'),el('p','',q.terms));sheet.append(terms)}
 const foot=el('footer','lkm23q-print-footer');add(foot,el('strong','','IDEAS MADE VISIBLE.'),el('span','','Prepared by LilKangooMedia LTD · This is not an invoice, receipt or booking confirmation.'));sheet.append(foot);printRoot.append(sheet);
 }
 async function printQuote(){const q=st.current;if(!q?.id||st.dirty){announce('Save the quotation before exporting.',true);return;}
 let calc;try{calc=validateQuote(q,true)}catch(e){announce(e.message,true);return;}
 makePrint(q,calc);printRoot.hidden=false;announce('Choose “Save as PDF” or your printer in the print dialog.');
 requestAnimationFrame(()=>{try{window.print()}catch(e){printRoot.hidden=true;announce('Print is not supported. Try Chrome or Safari.',true)}});
 }
 window.addEventListener('afterprint',()=>{printRoot.hidden=true});
 window.addEventListener('beforeunload',e=>{if(st.dirty){e.preventDefault();e.returnValue=''}});
 async function refresh(){st.busy=true;root.replaceChildren(el('p','lkm23q-hint','Loading private enquiries and quotations…'));
 try{if(!store?.configured||!await store.isAdmin())throw Error('Administrator permission required.');
  const [leads,quotes,services,approvals]=await Promise.all([
   api('contact_leads?select=id,customer_name,customer_email,phone,service_slug,service_type,message,archived_at,created_at&order=created_at.desc&limit=2000'),
   api('lkm_crm_quotes?select=*&order=created_at.desc&limit=1000'),
   store.adminServices().catch(()=>[]),
    api('lkm_quote_approvals?select=quote_id,decision,decided_at,expires_at&order=created_at.desc&limit=1000')
  ]);
  if(!Array.isArray(leads)||!Array.isArray(quotes))throw Error('Unexpected database response.');st.leads=leads;st.quotes=quotes;st.services=services;st.approvals=Array.isArray(approvals)?approvals:[];
  const params=new URL(location.href).searchParams;
  const qid=params.get('quote_id');const requested=params.get('lead_id');
  st.current=quotes.find(q=>q.id===qid)||null;
  if(!st.current&&validLeadId(requested)){const lead=leads.find(l=>l.id===requested);if(lead)st.current=blank(lead);}
  st.dirty=false;st.active=true;render();
 }catch(e){st.lastError=e.message||'Unable to load quotations';root.replaceChildren();const box=el('section','lkm23q-error');add(box,el('h1','','Quotation Builder unavailable'),el('p','',st.lastError));const retry=el('button','button button-dark','Retry');retry.type='button';retry.addEventListener('click',()=>void refresh());box.append(retry);root.append(box);
 }finally{st.busy=false}
 }
 async function init(){if(!store?.configured){root.textContent='Quotation Builder requires the configured Supabase project.';return;}if(!store.getSession()){login();return;}try{if(!await store.isAdmin())throw Error();await refresh()}catch{store.logout();login('Your administrator session expired or is not authorized. Sign in again.')}}
 await init();
})();
