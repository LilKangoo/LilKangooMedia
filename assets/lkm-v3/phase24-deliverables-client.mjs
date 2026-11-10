/* LilKangooMedia Phase 24.3: read-only client deliverables.
   List metadata only via verified-email + per-lead-grant RPC.
   Fetch private files with the current client JWT; NEVER use public URLs.
   Revoking access is enforced again at EVERY download by Storage RLS. */
import {BUCKET,cleanFileRecords,formatBytes,browserPreviewable,validHttps} from './phase24-deliverables-core.mjs';
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const add=(p,...children)=>{p.append(...children);return p};
const validDownloadName=raw=>String(raw||'File').replace(/[\x00-\x1f/\\<>]/g,' ').slice(0,200)||'File';
const kindLabel={photo:'Photo',video:'Video',document:'Document',archive:'Gallery archive'};
const kindSymbol={photo:'▧',video:'▶',document:'▤',archive:'▣'};
async function downloadBlob(row,getToken){
  const cfg=window.LKM_CONFIG||{},base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,''),key=String(cfg.SUPABASE_ANON_KEY||'');
  const jwt=await getToken();
  const res=await fetch(`${base}/storage/v1/object/authenticated/${BUCKET}/${row.path}`,{
    headers:{apikey:key,Authorization:`Bearer ${jwt}`},cache:'no-store'
  });
  if(!res.ok)throw Error('This file is no longer available. The team may have withdrawn access.');
  return res.blob();
}
function previewModal(row,blob){
  if(!browserPreviewable(row))return;
  const url=URL.createObjectURL(blob),dialog=node('dialog','lkm243-viewer');
  const bar=node('div','lkm243-viewer-bar');bar.append(node('strong','',row.title));
  const close=node('button','','Close ×');close.type='button';bar.append(close);dialog.append(bar);
  const media=row.mime.startsWith('video/')?node('video'):node('img');
  media.src=url;if(media.tagName==='VIDEO'){media.controls=true;media.preload='metadata';}
  else{media.alt=row.title;}dialog.append(media);
  const cleanup=()=>{if(media.tagName==='VIDEO')media.pause();media.removeAttribute('src');dialog.remove();URL.revokeObjectURL(url)};
  close.onclick=()=>dialog.close();dialog.addEventListener('close',cleanup,{once:true});
  document.body.append(dialog);dialog.showModal();
}
function rowCard(row,getToken){
  const card=node('article','lkm243-client-item');const top=node('div','lkm243-client-item-top');
  top.append(node('span','lkm243-client-type',kindSymbol[row.kind]||'▤'),node('small','',kindLabel[row.kind]||'File'));card.append(top);
  card.append(node('h4','',row.title));if(row.description)card.append(node('p','lkm243-client-desc',row.description));
  const info=node('p','lkm243-client-fileinfo',row.mode==='storage'?`${row.filename} · ${formatBytes(row.size)}`:'External delivery link');card.append(info);
  const actions=node('div','lkm243-client-actions'),status=node('p','lkm243-client-status');status.setAttribute('role','status');
  if(row.mode==='link'){
    const url=validHttps(row.url);if(url){const link=node('a','button button-dark','Open delivery link ↗');link.href=url;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
    card.append(node('small','lkm243-client-warning','External provider permissions apply. Keep shared links private.'));
  }else{
    const dl=node('button','button button-dark','Download');dl.type='button';actions.append(dl);
    dl.addEventListener('click',async()=>{dl.disabled=true;status.textContent='Preparing download…';
      try{const file=await downloadBlob(row,getToken),url=URL.createObjectURL(file),link=node('a');
        link.href=url;link.download=validDownloadName(row.filename);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
        status.textContent='Download prepared.';
      }catch(e){status.textContent=e.message||'Unable to download.'}finally{dl.disabled=false}
    });
    if(browserPreviewable(row)){
      const view=node('button','button button-light','Preview');view.type='button';actions.append(view);
      view.addEventListener('click',async()=>{view.disabled=true;status.textContent='Loading preview…';
        try{const file=await downloadBlob(row,getToken);previewModal(row,file);status.textContent='';}
        catch(e){status.textContent=e.message||'Preview unavailable.'}finally{view.disabled=false}
      });
    }
  }
  card.append(actions,status);return card;
}
export function renderClientDeliverables(host,result,getToken){
  host.replaceChildren();const rows=cleanFileRecords(result);
  host.append(node('p','lkm243-client-kicker','PROJECT DELIVERABLES'),node('h2','','Your files & downloads'),
    node('p','lkm243-client-subtitle','Only materials explicitly shared with you appear here. Private downloads are checked against your access rights each time.'));
  if(!rows.length){host.append(node('p','lkm243-client-empty','No files have been shared for your projects yet. When your delivery is ready, your team will publish it here.'));return 0;}
  const grouped=new Map();for(const r of rows){if(!grouped.has(r.projectId))grouped.set(r.projectId,{name:r.projectTitle,items:[]});grouped.get(r.projectId).items.push(r)}
  for(const group of grouped.values()){
    const sec=node('section','lkm243-client-group');sec.append(node('h3','',group.name));const items=node('div','lkm243-client-grid');
    for(const file of group.items)items.append(rowCard(file,getToken));sec.append(items);host.append(sec);
  }
  host.append(node('p','lkm243-client-smallprint','External downloads may have their own expiry dates and access rules. If you cannot open a delivery, contact LilKangooMedia.'));
  return rows.length;
}
export async function showClientDeliverables(host,api,getToken){
  host.replaceChildren(node('p','lkm243-client-empty','Loading shared files…'));
  try{
    const result=await api('/rest/v1/rpc/lkm_client_deliverables_list',{method:'POST',token:await getToken(),body:{}});
    return renderClientDeliverables(host,result,getToken);
  }catch(error){host.replaceChildren(node('p','lkm243-client-empty','Your private deliveries are temporarily unavailable. Other project information above remains accessible.'));return null}
}
