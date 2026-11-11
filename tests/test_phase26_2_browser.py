"""Local Chromium regression tests. Supabase/Storage are mocked; never writes production."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
BASE=Path(__file__).resolve().parents[1]
MODEL=(BASE/'tests/studio-model.mjs').read_text().replace('export const','const ').replace('export function','function ')
MAIN=re.sub(r'^import \{[^\n]+\} from \'./studio-model.mjs\';\s*','',(BASE/'assets/lkm-v3/studio.mjs').read_text(),count=1,flags=re.M)
BUNDLE=MODEL+'\n'+MAIN
ELEA='3a592d00-9556-423d-a12e-9c58b58ee557'
NATURE='8af8c565-951d-4a7d-8139-3347f7d91512'
ASSET='cb2168ff-55e7-4ddd-8fe9-5cc9ae202b06'
PHOTO='bede1234-0000-4000-8000-000000000001'

def bootstrap(page):
 page.set_content('<!doctype html><html><head><meta charset="utf-8"></head><body class="studio-body"><div id="lkmStudio"></div></body></html>')
 page.add_style_tag(content=(BASE/'assets/lkm-v3/studio.css').read_text())
 page.evaluate('''window.LKM_CONFIG={SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'test-key'};
 window.LKMStore={configured:true,getSession:()=>({access_token:'mock'}),isAdmin:async()=>true,authenticatedToken:async()=> 'mock',login:async()=>{},logout:()=>{}};
 window.crypto.randomUUID=()=> '0a000000-0000-4000-8000-000000000111';
 window.__lkmRequests=[];window.__mock={galleries:%s,services:%s,stories:%s,assets:%s,places:%s};''' % tuple(json.dumps(x) for x in ([
  {'id':ELEA,'title':'Eléa Golf Club','slug':'elea-golf-club','portfolio_kind':'project','visibility':'public','show_in_portfolio':False,'category':'Sports & Hospitality','client_name':'Elea','display_order':20},
  {'id':NATURE,'title':'Nature & Wildlife','slug':'nature-photography','portfolio_kind':'collection','visibility':'public','show_in_portfolio':True,'category':'Nature','client_name':None,'display_order':40}
 ],[{'slug':'commercial-video-reels','title':'Video','active':True}],[{'gallery_id':ELEA,'headline':'Eléa Golf Club project','objective':'Document the championship','approach':'Film aerial course and photography','deliverables':[],'outcomes':'','is_published':True}],
 [{'id':ASSET,'media_type':'image','image_url':'https://lilkangoomedia.com/assets/images/golf.jpg','youtube_id':None,'title':'Golf aerial','alt_text':'Aerial view','description':'','tags':['golf'],'created_at':'2026-11-11T00:00:00Z'}],
 [{'id':PHOTO,'asset_id':ASSET,'gallery_id':ELEA,'service_slug':None,'visibility':'public','display_order':11,'legacy_photo_id':PHOTO,'legacy_video_id':None}])))
 page.evaluate('''window.fetch=async function(url,opt={}){
  if(String(url).includes('/storage/v1/object/portfolio/')){window.__lkmRequests.push({method:opt.method,path:'storage_upload'});return new Response(JSON.stringify({Key:'ok'}),{status:200,headers:{'Content-Type':'application/json'}})}
  const path=String(url).split('/rest/v1/')[1]||'';const method=opt.method||'GET';const m=window.__mock;
  const hdr={'Content-Type':'application/json','Content-Range':'0-0/1'};let rows=[];
  if(path.startsWith('portfolio_galleries')){rows=m.galleries;
   if(path.includes('id=eq.'))rows=rows.filter(x=>path.includes(x.id));
   if(method==='PATCH'){let x=rows[0],record=JSON.parse(opt.body);Object.assign(x,record);window.__lkmRequests.push({method,path,record});rows=[];}}
  else if(path.startsWith('services'))rows=m.services;
  else if(path.startsWith('lkm_case_studies'))rows=m.stories;
  else if(path.startsWith('lkm_studio_audit'))rows=[];
  else if(path.startsWith('lkm_studio_assets')){rows=m.assets;if(path.includes('media_type=eq.youtube'))rows=[];hdr['Content-Range']='0-'+(rows.length-1)+'/'+rows.length;}
  else if(path.startsWith('lkm_studio_placements')){rows=m.places;if(path.includes('asset_id=eq.'))rows=rows.filter(x=>path.includes(x.asset_id));if(path.includes('gallery_id=eq.'))rows=rows.filter(x=>path.includes(x.gallery_id));}
  else if(path.startsWith('rpc/lkm_studio_register_asset')){window.__lkmRequests.push({method,path,record:JSON.parse(opt.body)});rows='90000000-0000-4000-8000-000000000001';}
  else if(path.startsWith('rpc/lkm_studio_assign')){const record=JSON.parse(opt.body);window.__lkmRequests.push({method,path,record});let row=m.places.find(x=>x.asset_id===record.p_asset_id&&x.gallery_id===record.p_gallery_id);if(!row){row={id:'10000000-0000-4000-8000-000000000123',asset_id:record.p_asset_id,gallery_id:record.p_gallery_id,display_order:record.p_display_order,legacy_photo_id:'bede1234-0000-4000-8000-000000000002'};m.places.push(row)}row.visibility=record.p_visibility;rows='10000000-0000-4000-8000-000000000123';}
  return new Response(JSON.stringify(rows),{status:200,headers:hdr});
 }''')
 page.add_script_tag(content=BUNDLE)
 page.locator('.studio-shell').wait_for(timeout=9000)

def contrast(page,sel):
 return page.locator(sel).evaluate('''e=>{let c=x=>{const v=getComputedStyle(x);let s=v.color.match(/[0-9.]+/g).slice(0,3).map(Number),node=x,back='';while(node){let bs=getComputedStyle(node).backgroundColor;if(bs&&bs!=='rgba(0, 0, 0, 0)'&&bs!=='transparent'){back=bs;break}node=node.parentElement}let b=(back||'rgb(9, 15, 16)').match(/[0-9.]+/g).slice(0,3).map(Number);let lum=p=>{const n=p/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)};let L=a=>.2126*lum(a[0])+.7152*lum(a[1])+.0722*lum(a[2]);let fg=L(s),bg=L(b);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};return c(e)}''')

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':960});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  bootstrap(page)
  page.get_by_role('button',name='Master Media Library').first.click()
  page.locator('.studio-media-quickdrop').wait_for()
  assert page.locator('#studioMediaQuickDrop').count()==1
  print('PASS 1 Main library drop zone visible')
  page.get_by_role('button',name='Upload photos').click()
  assert page.locator('#studioUploadDropzone').count()==1
  assert page.locator('#studioUploadInput[multiple]').count()==1
  print('PASS 2 Upload dialog supports multiple file selection')
  page.locator('#studioUploadInput').set_input_files([
   {'name':'golf-1.png','mimeType':'image/png','buffer':bytes([137,80,78,71,13,10,26,10])+bytes(36)},
   {'name':'golf-2.png','mimeType':'image/png','buffer':bytes([137,80,78,71,13,10,26,10])+bytes(35)}])
  assert '2 photo(s) ready' in page.locator('#studioUploadQueue').inner_text()
  assert page.locator('#studioUploadForm button[type=submit]').is_enabled()
  print('PASS 3 Browse selects and queues two files without publishing')
  # Drag one file onto the modal (same event path as Finder drop).
  page.evaluate('''()=>{const z=document.querySelector('#studioUploadDropzone'),dt=new DataTransfer();dt.items.add(new File(['abc'],'golf-3.png',{type:'image/png'}));z.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));z.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));}''')
  assert '3 photo(s) ready' in page.locator('#studioUploadQueue').inner_text()
  print('PASS 4 Drag & drop adds to queue (no upload yet)')
  page.get_by_role('button',name='Clear selection').click()
  assert 'No photos selected' in page.locator('#studioUploadQueue').inner_text()
  assert page.locator('#studioUploadForm button[type=submit]').is_disabled()
  page.get_by_role('button',name='Close modal').click()
  print('PASS 5 Clear queue disables upload button')
  page.evaluate('''()=>{const z=document.querySelector('#studioMediaQuickDrop'),dt=new DataTransfer();dt.items.add(new File(['abc'],'from-grid.png',{type:'image/png'}));z.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));}''')
  assert page.locator('dialog[open] #studioUploadQueue').count()==1
  assert '1 photo(s) ready' in page.locator('#studioUploadQueue').inner_text()
  print('PASS 6 Direct drop on Media Library opens populated upload dialog')
  page.get_by_role('button',name='Upload into master library').click()
  page.wait_for_timeout(180)
  assert page.locator('dialog[open]').count()==0
  events=page.evaluate('window.__lkmRequests')
  assert any(x['path']=='storage_upload' for x in events)
  assert any('lkm_studio_register_asset' in x['path'] for x in events)
  assert not any('lkm_studio_assign' in x['path'] for x in events), 'Uploading must not auto-publish'
  print('PASS 7 Drop uploads once to storage and indexes asset without public assignment')
  # Inspector is shown for the first media item.
  if page.get_by_role('button',name='Set as cover photo').count()==0:page.locator('.studio-asset-button').first.click()
  page.get_by_role('button',name='Set as cover photo').click()
  assert page.locator('#studioCoverForm select[name=gallery_id] option').count()==2
  page.locator('#studioCoverForm select[name=gallery_id]').select_option(NATURE)
  page.get_by_role('button',name='Set cover photo').click()
  page.wait_for_timeout(150)
  writes=page.evaluate('window.__lkmRequests')
  assert any('lkm_studio_assign' in x['path'] and x['record']['p_gallery_id']==NATURE and x['record']['p_visibility']=='public' for x in writes),writes
  assert any(x['method']=='PATCH' and x['record']['cover_image_id']=='bede1234-0000-4000-8000-000000000002' for x in writes),writes
  print('PASS 8 Cover assignment reuses photo, then sets verified gallery cover')
  assert not errors,errors
  print('PASS 9 No browser JavaScript errors')
  # Actual CSS, simulated legacy article and review DOM. Assertions on computed styles.
  def fixture(html,legacy=False):
   x=browser.new_page(viewport={'width':1200,'height':900});x.set_content('<!doctype html><html class="'+('lkm-legacy-embed lkm-unified-embedded' if legacy else 'lkm-unified-embedded')+'"><body>'+html+'</body></html>');x.add_style_tag(content=(BASE/'assets/lkm-v3/studio-embedded.css').read_text());return x
  article=fixture('<div class="cms-root"><div class="lkm-blog-editor"><div class="lkm-blog-toolbar"><button>Bold</button></div><div class="lkm-rich-body" contenteditable="true"><h2>Product photography</h2><p>Photographs for your customers.</p></div><div class="cms-field"><label>Title<input value="Real content"></label></div></div></div>',True)
  assert contrast(article,'.lkm-rich-body')>6.5,contrast(article,'.lkm-rich-body')
  assert article.locator('.lkm-rich-body h2').evaluate('(e)=>getComputedStyle(e).color') == 'rgb(237, 247, 239)'
  print('PASS 10 Articles rich editor uses high-contrast readable text')
  review=fixture('<div class="admin-shell"><aside class="admin-sidebar">Old sidebar</aside><section class="admin-main"><section class="lkm-reviews-admin-main"><div class="lkm-review-admin-stats"><div><strong>121</strong><small>Reviews</small></div></div><div class="lkm-review-admin-row"><div class="lkm-review-admin-row-main"><strong>Customer</strong><p>Very professional photo session.</p></div></div></section></section></div>')
  assert review.locator('.admin-sidebar').evaluate('e=>getComputedStyle(e).display')=='none'
  assert contrast(review,'.lkm-review-admin-row')>6.5
  assert contrast(review,'.lkm-review-admin-stats strong')>6.5
  print('PASS 11 Reviews navigation deduplicated; cards and metrics readable')
  modules=[('.lkm23-card','.lkm23-card strong'),('.lkm23q-editor','.lkm23q-editor strong'),('.lkm24-kpi','.lkm24-kpi strong'),('.lkmcal-card','.lkmcal-card strong')]
  for card,txt in modules:
   x=fixture(f'<div class="{card.strip(".")}"><strong>Project information</strong></div>')
   assert contrast(x,txt)>6.5,(card,contrast(x,txt))
   x.close()
  print('PASS 12 CRM, Quotes, Reports and Calendar panels readable')
  page.set_viewport_size({'width':390,'height':844})
  page.wait_for_timeout(120)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
  print('PASS 13 Mobile dashboard has no horizontal overflow')
  article.close();review.close();browser.close()
if __name__=='__main__':run()
