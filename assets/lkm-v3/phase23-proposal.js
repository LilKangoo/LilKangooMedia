/* Phase 23.3B — bearer-link quote response, read-only except one final decision.
   No Stripe calls. The secret stays in the URL fragment and in-memory only. */
(()=>{'use strict';const root=document.getElementById('proposalRoot');if(!root)return;
 const cfg=window.LKM_CONFIG||{};const api=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'')+'/rest/v1/rpc/lkm_quote_client_action';
 const key=cfg.SUPABASE_ANON_KEY||'';const token=(location.hash||'').replace(/^#(?:token=)?/,'');
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
 const add=(n,...xs)=>{n.append(...xs);return n};const euros=n=>'€'+(Number(n||0)/100).toLocaleString('en-IE',{minimumFractionDigits:2,maximumFractionDigits:2});
 const validToken=x=>/^lkm_[a-f0-9]{64}$/.test(x);
 let busy=false;let current=null;
 async function call(action='view',confirm=false,name=''){
  if(!key||!/^https:\/\//.test(api)||!validToken(token))throw Error('The quotation link is unavailable.');
  const r=await fetch(api,{method:'POST',headers:{apikey:key,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({p_token:token,p_action:action,p_confirm:confirm,p_name:name}),cache:'no-store',referrerPolicy:'no-referrer'});
  if(!r.ok)throw Error('Could not contact the quotation service.');const data=await r.json();if(!data.ok)throw Error(data.error||'The quotation link is unavailable.');return data;
 }
 const line=(label,val)=>{const p=make('div','proposal-pair');add(p,make('span','',label),make('strong','',val));return p};
 function render(d){current=d;root.replaceChildren();const box=make('article','proposal-panel');
  add(box,make('p','proposal-eyebrow','PRIVATE CLIENT PROPOSAL'),make('h1','',d.title||'Your quotation'),make('p','proposal-meta',`LKM-Q-${String(d.quote_number||0).padStart(6,'0')} · Issued ${d.issue_date||''} · Valid until ${d.valid_until||''}`));
  const intro=make('section','proposal-intro');add(intro,make('p','',`Prepared for ${d.customer_name||'our client'}${d.customer_company?' · '+d.customer_company:''}`));if(d.introduction)intro.append(make('p','',d.introduction));box.append(intro);
  const section=make('section','proposal-section');section.append(make('h2','','Scope & pricing'));const items=make('div','proposal-items');
  for(const item of (Array.isArray(d.line_items)?d.line_items:[])){const row=make('div','proposal-item');add(row,make('span','',`${item.description||'Service'} · ${item.quantity} × ${euros(item.unit_price_cents)}`),make('strong','',euros(Math.round(item.quantity*item.unit_price_cents))));items.append(row)}
  section.append(items);const sums=make('div','proposal-sums');add(sums,line('Subtotal',euros(d.subtotal_cents)),line('Discount','−'+euros(d.discount_cents)),line('Proposed total',euros(d.total_cents)));section.append(sums);box.append(section);
  if(d.scope_notes)box.append(add(make('section','proposal-section'),make('h2','','Delivery details'),make('p','proposal-copy',d.scope_notes)));
  if(d.terms)box.append(add(make('section','proposal-section'),make('h2','','Terms & exclusions'),make('p','proposal-copy',d.terms)));
  const status=make('section','proposal-decision');status.id='proposalDecision';const state=d.decision;
  if(state==='accepted'||state==='declined'){add(status,make('h2','',state==='accepted'?'Proposal accepted':'Proposal declined'),make('p','',`Your response has been recorded${d.decided_at?' on '+new Date(d.decided_at).toLocaleDateString('en-GB'):''}. Contact us if you need to discuss changes.`));}
  else if(d.expired||state==='revoked'){add(status,make('h2','','Offer no longer available'),make('p','','Please contact LilKangooMedia for an updated quotation.'));}
  else{add(status,make('h2','','Your decision'),make('p','','Review the complete scope, pricing and terms above. This is not a payment, booking confirmation or digital signature.'));
    const form=make('form','proposal-form');const name=make('input');name.name='full_name';name.required=true;name.maxLength=120;name.autocomplete='name';name.placeholder='Your full name';const label=make('label');add(label,make('span','','Name of person accepting'),name);form.append(label);
    const check=make('input');check.type='checkbox';check.required=true;const consent=make('label','proposal-check');add(consent,check,make('span','','I have read the quotation and agree to the stated scope and terms.'));form.append(consent);
    const actions=make('div','proposal-actions');const yes=make('button','button button-dark','Accept quotation');yes.type='submit';const no=make('button','button button-light','Decline quotation');no.type='button';actions.append(yes,no);form.append(actions);
    const feedback=make('p','proposal-feedback');feedback.setAttribute('role','status');form.append(feedback);
    form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!form.reportValidity())return;if(!window.confirm('Accept this quotation? Your decision will be final.'))return;await decide('accept',name.value.trim(),check.checked,feedback,yes,no)});
    no.addEventListener('click',async()=>{if(busy||!window.confirm('Decline this quotation? Your decision will be final.'))return;await decide('decline','',false,feedback,yes,no)});
    status.append(form);
  }
  box.append(status);box.append(make('p','proposal-footer-note','No card payment is taken here. Availability and booking details are confirmed separately by LilKangooMedia.'));
  root.append(box);
 }
 async function decide(action,name,confirm,feedback,yes,no){busy=true;yes.disabled=no.disabled=true;feedback.textContent='Recording your response…';try{render(await call(action,confirm,name))}catch(e){feedback.textContent=e.message||'Could not save response.';yes.disabled=no.disabled=false}finally{busy=false}}
 (async()=>{try{render(await call())}catch(e){root.replaceChildren(add(make('div','proposal-panel'),make('h1','','Quotation unavailable'),make('p','',e.message||'Please contact LilKangooMedia.'),make('a','button button-dark','Contact us')));const a=root.querySelector('a');if(a)a.href='mailto:photo@lilkangoomedia.com'}})();
})();
