/* LKM Phase 24.3 — private client deliverables inside the EXISTING CRM card.
   Admin RLS + private Storage; no service-role credentials in the browser.
   Does not touch bookings, Stripe, refunds, quotes or customer CRM notes. */
(async()=>{'use strict';
 const core=await import('/assets/lkm-v3/phase24-deliverables-core.mjs');
 const {BUCKET,validateUpload,privatePath,validHttps,UUID_RE,formatBytes,TYPES}=core;
 const root=document.getElementById('lkmCrmRoot');if(!root||window.__lkm243Admin)return;
 window.__lkm243Admin=true;
 const store=window.LKMStore,cfg=window.LKM_CONFIG||{},base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,''),key=String(cfg.SUPABASE_ANON_KEY||'');
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const add=(p,...children)=>{p.append(...children);return p};
 const selected=()=>root.querySelector('.lkm23-card.is-selected[data-lead-id]')?.dataset.leadId||'';
 const notice=(section,msg,bad=false)=>{const el=section.querySelector('[data-d243-status]');if(el){el.textContent=msg||'';el.classList.toggle('error',bad)}};
 const safeName=x=>String(x||'').replace(/[\x00-\x1f/\\<>]/g,' ').trim().slice(0,200)||'Delivered file';
 const categories=[['photo','Photographs'],['video','Videos'],['document','Documents'],['archive','Full gallery / archive']];
 function label(text,control){const out=node('label','lkm243-label');out.append(node('span','',text),control);return out}
 function inp(type,value='',max=200){const n=node('input');n.type=type;n.value=value||'';if(type!=='file')n.maxLength=max;return n;}
 function sel(options,initial){const s=node('select');for(const [value,text] of options){const o=node('option','',text);o.value=value;s.append(o)}s.value=initial||options[0][0];return s}
 function area(value='',max=900){const e=node('textarea');e.value=value;e.rows=2;e.maxLength=max;return e}
 async function rest(path,options={}){
   if(!store?.configured||!base.startsWith('https://')||!key)throw Error('Supabase is not configured.');
   const jwt=await store.authenticatedToken();
   const res=await fetch(`${base}/rest/v1/${path}`,{method:options.method||'GET',cache:'no-store',headers:{apikey:key,Authorization:`Bearer ${jwt}`,Accept:'application/json','Content-Type':'application/json',...(options.body!==undefined?{Prefer:'return=representation'}:{})},...(options.body!==undefined?{body:JSON.stringify(options.body)}:{})});
   if(!res.ok){const error=await res.json().catch(()=>({}));throw Error(String(error.message||`Supabase error ${res.status}. Check Phase 24.3 SQL.`).slice(0,240));}
   const body=await res.text();return body?JSON.parse(body):null;
 }
 async function storage(path,{method='GET',body,mime}={}){
   const jwt=await store.authenticatedToken();
   const res=await fetch(`${base}/storage/v1/object/${method==='GET'?'authenticated/':''}${BUCKET}/${path}`,{
     method,cache:'no-store',headers:{apikey:key,Authorization:`Bearer ${jwt}`,...(mime?{'Content-Type':mime,'cache-control':'no-cache','x-upsert':'false'}:{})},...(body!==undefined?{body}:{})
   });
   if(!res.ok){const detail=await res.json().catch(()=>({}));throw Error(String(detail.message||detail.error||`Private storage error ${res.status}`).slice(0,220));}
   return res;
 }
 async function deleteStorage(path){try{await storage(path,{method:'DELETE'});return true}catch{return false}}
 async function downloadFile(row){const response=await storage(row.storage_path);const blob=await response.blob();const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download=safeName(row.filename);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
 function basicStatus(project){return project?.client_visible?'Project shared (requires active client access)':'Project private';}
 function fileCard(section,leadId,row,project){
   const card=node('article','lkm243-card');const heading=node('div','lkm243-card-title');
   const left=node('div');add(left,node('strong','',row.title),node('small','',`${row.media_type} · ${row.delivery_mode==='storage'?formatBytes(row.size_bytes):'External link'} · ${safeName(row.filename)}`));
   heading.append(left,node('span','lkm243-pill'+(row.client_visible?' live':''),row.client_visible?'Published':'Private'));card.append(heading);
   if(row.description)card.append(node('p','lkm243-desc',row.description));
   const actions=node('div','lkm243-buttons');
   const toggle=node('button','button button-light',row.client_visible?'Unpublish':'Publish');toggle.type='button';
   toggle.addEventListener('click',async()=>{
     if(row.client_visible&&!confirm('Hide this file from the client portal?'))return;
     toggle.disabled=true;notice(section,'Saving visibility…');
     try{await rest('lkm_client_deliverables?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',body:{client_visible:!row.client_visible}});await refresh(section,leadId)}
     catch(e){notice(section,e.message,true);toggle.disabled=false}
   });actions.append(toggle);
   const edit=node('button','button button-light','Edit');edit.type='button';actions.append(edit);
   edit.addEventListener('click',()=>{
     if(card.querySelector('.lkm243-inline'))return;
     const f=node('form','lkm243-inline');const t=inp('text',row.title,150),d=area(row.description),c=sel(categories,row.media_type);
     t.required=true;t.minLength=2;f.append(label('Title',t),label('Description',d),label('Media type',c));
     let link=null;if(row.delivery_mode==='link'){link=inp('url',row.external_url,2000);link.required=true;f.append(label('External HTTPS address',link));}
     const submit=node('button','button button-dark','Save details');submit.type='submit';const cancel=node('button','button button-light','Cancel');cancel.type='button';cancel.onclick=()=>f.remove();
     add(f,submit,cancel);card.append(f);
     f.addEventListener('submit',async e=>{e.preventDefault();if(!f.reportValidity())return;const url=link?validHttps(link.value):null;
       if(link&&!url){notice(section,'Use a valid HTTPS address without credentials.',true);return;}
       submit.disabled=true;notice(section,'Saving file details…');
       try{const body={title:t.value.trim(),description:d.value.trim(),media_type:c.value,...(link?{external_url:url}:{})};
         await rest('lkm_client_deliverables?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',body});await refresh(section,leadId);
       }catch(error){notice(section,error.message,true);submit.disabled=false}
     });
   });
   const open=node('button','button button-light',row.delivery_mode==='link'?'Open external link':'Download');open.type='button';actions.append(open);
   open.addEventListener('click',async()=>{
     try{if(row.delivery_mode==='link'){const url=validHttps(row.external_url);if(!url)throw Error('Invalid link.');window.open(url,'_blank','noopener,noreferrer');}else{open.disabled=true;await downloadFile(row);}}
     catch(e){notice(section,e.message,true)}finally{open.disabled=false}
   });
   const remove=node('button','button lkm243-destructive','Remove');remove.type='button';actions.append(remove);
   remove.addEventListener('click',async()=>{
     if(prompt(`Remove ${row.client_visible?'this PUBLISHED':'this private'} deliverable?\nThis action removes client access and cannot be undone.\n\nType DELETE to confirm:`)!=='DELETE')return;
     remove.disabled=true;notice(section,'Removing file record…');
     try{
       await rest('lkm_client_deliverables?id=eq.'+encodeURIComponent(row.id),{method:'DELETE'});
       const deleted=row.delivery_mode==='storage'?await deleteStorage(row.storage_path):true;
       await refresh(section,leadId);
       if(!deleted)notice(section,'Metadata removed; Storage deletion failed. The now-inaccessible private object can be cleaned in Supabase Storage.');
     }catch(e){notice(section,e.message,true);remove.disabled=false}
   });card.append(actions);return card;
 }
 function uploadForm(section,leadId,project){
   const shell=node('div','lkm243-create');shell.append(node('h4','','Add a private file'));
   const info=node('p','lkm243-hint','Upload up to 20 photos or other supported files at once, each under 45 MB. For large videos or archives, use an external link below. Files remain private unless you publish them.');shell.append(info);
   const form=node('form','lkm243-entry'),f=inp('file');f.accept='.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.pdf,.zip';f.required=true;f.multiple=true;
   const title=inp('text','',150);title.required=true;title.minLength=2;
   const description=area(),category=sel(categories,'photo');
   const visible=node('input');visible.type='checkbox';visible.checked=false;
   f.addEventListener('change',()=>{if(!f.files?.[0])return;const file=f.files[0];title.value=safeName(file.name.replace(/\.[^.]+$/,''));try{const found=validateUpload(file);category.value=found.kind;notice(section,f.files.length+' file(s) selected. Multiple files use their filenames as titles.')}catch(err){notice(section,err.message,true)}});
   form.append(label('Choose file',f),label('Displayed title',title),label('Category',category),label('Short description (optional)',description));
   const share=label('Publish for client after upload',visible);share.classList.add('lkm243-checkbox');form.append(share);
   const send=node('button','button button-dark','Upload privately');send.type='submit';form.append(send);shell.append(form);
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(!form.reportValidity())return;
     const files=Array.from(f.files||[]);if(!files.length||files.length>20){notice(section,'Select between 1 and 20 files per batch.',true);return;}
     let specs;try{specs=files.map(validateUpload)}catch(err){notice(section,err.message,true);return;}
     if(typeof crypto.randomUUID!=='function'){notice(section,'Secure HTTPS browser context is required for uploads.',true);return;}
     send.disabled=true;let completed=0,problem='';
     for(let i=0;i<files.length;i++){
       const file=files[i],meta=specs[i],path=privatePath(project.id,crypto.randomUUID(),meta.extension);
       notice(section,'Uploading file '+(i+1)+' of '+files.length+'…');
       try{
         await storage(path,{method:'POST',body:file,mime:meta.mime});
         const label=files.length===1?title.value.trim():safeName(file.name.replace(/\.[^.]+$/,''));
         const entry={project_id:project.id,delivery_mode:'storage',media_type:files.length===1?category.value:meta.kind,title:label.slice(0,150),
           description:description.value.trim(),filename:safeName(file.name),mime_type:meta.mime,size_bytes:file.size,storage_path:path,client_visible:visible.checked};
         try{await rest('lkm_client_deliverables',{method:'POST',body:entry})}
         catch(error){await deleteStorage(path);throw error}
         completed++;
       }catch(err){problem=err.message||'Upload failed.';break}
     }
     await refresh(section,leadId);
     notice(section,completed+' of '+files.length+' file(s) uploaded'+(problem?'. Next file failed: '+problem:'.'));
     if(problem)send.disabled=false;
   });return shell;
 }
 function externalForm(section,leadId,project){
   const shell=node('div','lkm243-create');shell.append(node('h4','','Add an external delivery link'));
   shell.append(node('p','lkm243-hint','For very large videos or entire galleries. Link access is controlled by the external provider: revoking our portal cannot revoke an already copied external URL. Use restricted or expiring links.'));
   const form=node('form','lkm243-entry');const title=inp('text','',150),url=inp('url','',2000),description=area(),category=sel(categories,'archive');
   title.required=true;title.minLength=2;url.required=true;url.placeholder='https://…';
   const visible=node('input');visible.type='checkbox';visible.checked=false;
   form.append(label('Display title',title),label('External HTTPS link',url),label('Category',category),label('Description',description));
   const share=label('Publish for client immediately',visible);share.classList.add('lkm243-checkbox');form.append(share);
   const send=node('button','button button-dark','Save link privately');send.type='submit';form.append(send);shell.append(form);
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(!form.reportValidity())return;const safe=validHttps(url.value.trim());if(!safe){notice(section,'Enter an HTTPS link without credentials.',true);return;}
     send.disabled=true;notice(section,'Saving delivery link…');
     try{const data={project_id:project.id,delivery_mode:'link',media_type:category.value,title:title.value.trim(),description:description.value.trim(),filename:safeName(title.value),mime_type:'',size_bytes:0,external_url:safe,client_visible:visible.checked};
       await rest('lkm_client_deliverables',{method:'POST',body:data});await refresh(section,leadId);notice(section,'Link saved'+(visible.checked?' and published.':' privately.'));
     }catch(error){notice(section,error.message,true);send.disabled=false}
   });return shell;
 }
 async function refresh(section,leadId){
   if(!section.isConnected||selected()!==leadId)return;
   const host=section.querySelector('[data-d243-body]');host.replaceChildren(node('p','lkm243-hint','Loading deliverables…'));
   try{
     if(!await store.isAdmin())throw Error('Administrator permission required.');
     const p=await rest('lkm_client_projects?select=id,title,client_visible&lead_id=eq.'+encodeURIComponent(leadId)+'&limit=1');
     if(!section.isConnected||selected()!==leadId)return;
     const project=p?.[0];host.replaceChildren();
     if(!project){host.append(node('p','lkm243-empty','Create and save the project in “Project & delivery tracking” above, then click Refresh files. Every delivery must belong to one real project.'));const btn=node('button','button button-light','Refresh files');btn.type='button';btn.onclick=()=>void refresh(section,leadId);host.append(btn);return;}
     const rows=await rest('lkm_client_deliverables?select=*&project_id=eq.'+encodeURIComponent(project.id)+'&order=created_at.desc&limit=250');
     if(!section.isConnected||selected()!==leadId)return;
     host.replaceChildren();host.append(node('p','lkm243-hint',basicStatus(project)+'. Individual file publication is controlled separately.'));
     const controls=node('div','lkm243-overview');controls.append(node('strong','',''+(rows?.length||0)+' delivery item(s)'));
     const reload=node('button','button button-light','Refresh files');reload.type='button';reload.onclick=()=>void refresh(section,leadId);controls.append(reload);host.append(controls);
     if(Array.isArray(rows)&&rows.length){const list=node('div','lkm243-list');for(const item of rows)list.append(fileCard(section,leadId,item,project));host.append(list)}
     else host.append(node('p','lkm243-empty','No files have been added yet. Use one of the options below.'));
     host.append(uploadForm(section,leadId,project),externalForm(section,leadId,project));
     notice(section,'');
   }catch(err){host.replaceChildren(node('p','lkm243-empty','Unable to load deliverables. Check that the new SQL has been installed.'));notice(section,err.message,true)}
 }
 function attach(){const id=selected(),host=document.getElementById('lkm23Details');if(!UUID_RE.test(id)||!host||host.querySelector('[data-lkm243]'))return;
   const section=node('section','lkm243-section');section.dataset.lkm243='';
   section.append(node('h3','','Files & client deliveries'),node('p','lkm243-hint','Upload, publish, edit and remove project deliverables without leaving this customer card.'));
   const body=node('div');body.dataset.d243Body='';section.append(body);
   const status=node('p','lkm243-status','Loading…');status.dataset.d243Status='';status.setAttribute('role','status');section.append(status);
   const anchor=host.querySelector('[data-lkm242]');if(anchor)anchor.after(section);else{const end=host.querySelector('.lkm23-edit');if(end)end.before(section);else host.append(section)}
   void refresh(section,id);
 }
 let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});attach();
})();
