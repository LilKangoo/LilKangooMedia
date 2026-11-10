/* LilKangooMedia Phase 24.2 — admin project controls inside existing CRM.
 * Admin JWT and RLS only; NEVER writes bookings, payments, Stripe or refunds.
 * A project is private until explicitly published AND client grant is active.
 */
(()=>{'use strict';
 const root=document.getElementById('lkmCrmRoot');if(!root||window.__lkm24ProjectsAdmin)return;
 window.__lkm24ProjectsAdmin=true;
 const store=window.LKMStore,cfg=window.LKM_CONFIG||{};
 const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,''),key=cfg.SUPABASE_ANON_KEY||'';
 const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s||'');
 const elem=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
 const stages=[['planning','Planning'],['in_progress','In progress'],['client_review','Client review'],['delivered','Delivered'],['on_hold','On hold'],['cancelled','Cancelled']];
 let queued=false;
 async function rest(path,opt={}){
  if(!store?.configured||!base.startsWith('https://')||!key)throw Error('Supabase is not configured.');
  const token=await store.authenticatedToken();
  const response=await fetch(base+'/rest/v1/'+path,{method:opt.method||'GET',cache:'no-store',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json',...(opt.body!==undefined?{Prefer:'return=representation'}:{})},...(opt.body!==undefined?{body:JSON.stringify(opt.body)}:{})});
  if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(String(error.message||'Project save failed; check Phase 24.2 SQL.').slice(0,230));}
  const text=await response.text();return text?JSON.parse(text):null;
 }
 function field(label,type,value,max=100){const wrap=elem('label','lkm242-field');wrap.append(elem('span','',label));const el=type==='textarea'?elem('textarea'):elem('input');if(type!=='textarea')el.type=type;el.value=value??'';el.maxLength=max;if(type==='textarea')el.rows=3;wrap.append(el);return [wrap,el];}
 function optionSelect(label,options,value){const wrap=elem('label','lkm242-field');wrap.append(elem('span','',label));const select=elem('select');for(const [v,t] of options){const o=elem('option','',t);o.value=v;if(v===String(value??''))o.selected=true;select.append(o);}wrap.append(select);return [wrap,select];}
 function note(section,msg,error=false){const n=section.querySelector('[data-project-message]');if(n){n.textContent=msg;n.classList.toggle('is-error',error)}}
 function selectedId(){return root.querySelector('.lkm23-card.is-selected[data-lead-id]')?.dataset.leadId||'';}
 async function load(section,id){
  if(!section.isConnected||selectedId()!==id)return;
  try{
   if(!await store.isAdmin())throw Error('Administrator permissions required.');
   const [leadRows,projectRows,orders]=await Promise.all([
    rest('contact_leads?select=id,customer_name,customer_email,service_slug,archived_at&id=eq.'+encodeURIComponent(id)+'&limit=1'),
    rest('lkm_client_projects?select=*&lead_id=eq.'+encodeURIComponent(id)+'&limit=1'),
    rest('stripe_orders?select=id,customer_email,status,paid_amount_cents,payment_kind,created_at&order=created_at.desc&limit=200').catch(()=>[])
   ]);
   if(selectedId()!==id||!section.isConnected)return;
   const lead=leadRows?.[0], project=projectRows?.[0]||null;
   if(!lead)throw Error('Enquiry no longer exists.');
   const updates=project?await rest('lkm_client_project_updates?select=*&project_id=eq.'+encodeURIComponent(project.id)+'&order=created_at.desc&limit=150'):[];
   if(selectedId()!==id||!section.isConnected)return;
   const matches=(Array.isArray(orders)?orders:[]).filter(o=>o.customer_email?.trim().toLowerCase()===lead.customer_email?.trim().toLowerCase()&&
     ['paid_pending_confirmation','confirmed','cancelled','declined','refund_review_required'].includes(o.status));
   draw(section,id,lead,project,Array.isArray(updates)?updates:[],matches);
  }catch(error){note(section,error.message||'Could not load project settings.',true)}
 }
 function draw(section,id,lead,project,updates,orders){
  const area=section.querySelector('[data-project-body]');area.replaceChildren();
  const intro=elem('p','lkm242-note',project?'Update the project here. Changes to delivery progress do not change booking or payment status.':'Create a private project from this enquiry. Publish it only when ready for the client.');area.append(intro);
  const form=elem('form','lkm242-form'),grid=elem('div','lkm242-grid');
  const [tWrap,title]=field('Project title','text',project?.title||'Creative services — '+(lead.service_slug||'Client project'),160);title.required=true;title.minLength=3;
  const [sWrap,summary]=field('Project summary','textarea',project?.summary||'',1800);
  const [phaseWrap,phase]=optionSelect('Delivery stage',stages,project?.phase||'planning');
  const [progressWrap,progress]=field('Progress (0–100%)','number',project?.progress??0,3);progress.min='0';progress.max='100';progress.step='1';
  const [dateWrap,target]=field('Target delivery date (optional)','date',project?.target_date||'',16);
  const [stepWrap,nextStep]=field('Next step for client','textarea',project?.next_step||'',900);
  const choices=[['','No Stripe order linked'],...orders.map(o=>[o.id,'Payment recorded · '+(Number(o.paid_amount_cents||0)/100).toFixed(2)+' EUR · '+o.created_at?.slice(0,10)])];
  if(project?.order_id&&!orders.some(o=>o.id===project.order_id))choices.push([project.order_id,'Previously linked order (not in current list)']);
  const [orderWrap,order]=optionSelect('Optional matching Stripe order',choices,project?.order_id||'');
  const [publishWrap,publish]=optionSelect('Client visibility',[['false','Private — admin only'],['true','Visible to granted client']],String(project?.client_visible===true));
  const hint=elem('small','', 'Visibility also requires an active Client portal access grant for this enquiry.');publishWrap.append(hint);
  grid.append(tWrap,sWrap,phaseWrap,progressWrap,dateWrap,stepWrap,orderWrap,publishWrap);form.append(grid);
  if(lead.archived_at)form.append(elem('p','lkm242-warning','This enquiry is archived. Restore it before publishing the project.'));
  const actions=elem('div','lkm242-actions'),save=elem('button','button button-dark',project?'Save project changes':'Create project');save.type='submit';
  actions.append(save);
  if(project&&!project.client_visible&&!updates.length){const remove=elem('button','button button-light','Delete private draft');remove.type='button';remove.addEventListener('click',async()=>{
    if(prompt('Delete this unpublished project permanently? Type DELETE:')!=='DELETE')return;
    remove.disabled=true;try{await rest('lkm_client_projects?id=eq.'+encodeURIComponent(project.id),{method:'DELETE'});note(section,'Private draft deleted.');await load(section,id)}catch(e){note(section,e.message,true);remove.disabled=false}
   });actions.append(remove);}
  form.append(actions);area.append(form);
  form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;
   const percent=Number(progress.value);if(!Number.isInteger(percent)||percent<0||percent>100){note(section,'Progress must be a whole number between 0 and 100.',true);return;}
   const payload={lead_id:id,title:title.value.trim(),summary:summary.value.trim(),phase:phase.value,progress:percent,
    target_date:target.value||null,next_step:nextStep.value.trim(),order_id:order.value||null,client_visible:publish.value==='true'};
   if(payload.client_visible&&lead.archived_at){note(section,'Restore this enquiry before publishing.',true);return;}
   save.disabled=true;note(section,'Saving project…');try{
    const response=await rest(project?'lkm_client_projects?id=eq.'+encodeURIComponent(project.id):'lkm_client_projects',
     {method:project?'PATCH':'POST',body:payload});
    if(!Array.isArray(response)||response.length!==1)throw Error('Project was not saved.');
    note(section,'Project saved. Publication is controlled separately from client access.');area.replaceChildren(elem('p','lkm242-note','Refreshing project…'));await load(section,id);
   }catch(error){note(section,error.message||'Could not save project.',true);save.disabled=false}
  });
  if(!project)return;
  const timeline=elem('div','lkm242-timeline');timeline.append(elem('h4','','Project updates'),elem('p','lkm242-note','Only updates marked Visible to client will appear in the portal. Keep private notes in CRM, not here.'));
  const post=elem('form','lkm242-post');const [updateTitleWrap,updateTitle]=field('Update title','text','',140),[detailWrap,detail]=field('Update message','textarea','',1500);
  updateTitle.required=true;updateTitle.minLength=3;
  const [visibleWrap,visible]=optionSelect('Share this update',[['false','Private draft'],['true','Visible to granted client']],'false');
  const postButton=elem('button','button button-light','Add project update');postButton.type='submit';
  post.append(updateTitleWrap,detailWrap,visibleWrap,postButton);timeline.append(post);
  post.addEventListener('submit',async e=>{e.preventDefault();if(!post.reportValidity())return;postButton.disabled=true;
    try{const rows=await rest('lkm_client_project_updates',{method:'POST',body:{project_id:project.id,title:updateTitle.value.trim(),detail:detail.value.trim(),client_visible:visible.value==='true'}});
     if(!rows?.length)throw Error('Update was not saved.');note(section,'Project update saved.');await load(section,id);
    }catch(error){note(section,error.message,true);postButton.disabled=false}
  });
  if(updates.length){const list=elem('div','lkm242-update-list');for(const u of updates){
    const card=elem('article','lkm242-update'),top=elem('div','lkm242-update-top');
    top.append(elem('strong','',u.title),elem('span','lkm242-pill'+(u.client_visible?' is-visible':''),u.client_visible?'Client visible':'Private draft'));
    card.append(top,elem('p','',u.detail||'No additional details.'));
    const buttons=elem('div','lkm242-update-actions');const toggle=elem('button','',u.client_visible?'Hide from client':'Publish update');toggle.type='button';
    toggle.addEventListener('click',async()=>{toggle.disabled=true;try{await rest('lkm_client_project_updates?id=eq.'+encodeURIComponent(u.id),{method:'PATCH',body:{client_visible:!u.client_visible}});await load(section,id)}catch(error){note(section,error.message,true);toggle.disabled=false}});
    const edit=elem('button','','Edit');edit.type='button';edit.addEventListener('click',()=>{
      const fields=elem('div','lkm242-inline-edit');const [a,aVal]=field('Title','text',u.title,140),[b,bVal]=field('Message','textarea',u.detail||'',1500);
      const ok=elem('button','button button-light','Save update');ok.type='button';fields.append(a,b,ok);card.append(fields);edit.disabled=true;
      ok.addEventListener('click',async()=>{if(aVal.value.trim().length<3){note(section,'Update title must contain at least 3 characters.',true);return;}ok.disabled=true;
       try{await rest('lkm_client_project_updates?id=eq.'+encodeURIComponent(u.id),{method:'PATCH',body:{title:aVal.value.trim(),detail:bVal.value.trim()}});await load(section,id)}catch(error){note(section,error.message,true);ok.disabled=false}});
    });
    const del=elem('button','','Remove');del.type='button';del.addEventListener('click',async()=>{if(prompt('Permanently remove this project update? Type DELETE:')!=='DELETE')return;
       del.disabled=true;try{await rest('lkm_client_project_updates?id=eq.'+encodeURIComponent(u.id),{method:'DELETE'});await load(section,id)}catch(error){note(section,error.message,true);del.disabled=false}});
    buttons.append(toggle,edit,del);card.append(buttons);list.append(card);
   }timeline.append(list);}
  area.append(timeline);
 }
 function attach(){const id=selectedId(),host=document.getElementById('lkm23Details');if(!uuid(id)||!host||host.querySelector('[data-lkm242]'))return;
  const section=elem('section','lkm242-section');section.dataset.lkm242='';
  section.append(elem('h3','','Project & delivery tracking'),elem('p','lkm242-note','Edit delivery status, planned dates and public progress without leaving the customer card.'));
  const body=elem('div');body.dataset.projectBody='';section.append(body);const info=elem('p','lkm242-status','Loading project…');info.dataset.projectMessage='';info.setAttribute('role','status');section.append(info);
  const portal=host.querySelector('[data-p24-section]');if(portal)portal.after(section);
  else{const anchor=host.querySelector('.lkm23-edit');if(anchor)anchor.before(section);else host.append(section)}
  void load(section,id);
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});attach();
})();
