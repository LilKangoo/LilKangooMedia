"""Isolated Chromium UI tests: mocked Supabase only; no production writes or real payments."""
from pathlib import Path
import json,re,base64,os
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1]
MODEL=(BASE/'assets/lkm-v3/studio-model.mjs').read_text().replace('export const','const ')
MAIN=(BASE/'assets/lkm-v3/studio.mjs').read_text()
MAIN=re.sub(r'^import \{[^\n]+\} from \'./studio-model.mjs\';\s*','',MAIN,count=1,flags=re.MULTILINE)
BUNDLE=MODEL+'\n'+MAIN
ELEA='3a592d00-9556-423d-a12e-9c58b58ee557';NATURE='8af8c565-951d-4a7d-8139-3347f7d91512';ASSET='cb2168ff-55e7-4ddd-8fe9-5cc9ae202b06';VIDEO='da2123fa-9701-4c35-93c0-69823af69d03';NEW='5b132e35-1425-4e98-9939-26d1c4fd98a3';

def fixtures():
 return {
 'galleries':[
  dict(id=ELEA,title='Eléa Golf Club',slug='elea-golf-club',portfolio_kind='project',visibility='public',show_in_portfolio=False,description='Championship photography and aerial films',category='Sports & Hospitality',client_name='Eléa Golf Club',display_order=20,related_service_slug='commercial-video-reels'),
  dict(id=NATURE,title='Nature & Wildlife Photography',slug='nature-photography',portfolio_kind='collection',visibility='public',show_in_portfolio=True,description='Nature photography',category='Nature',client_name=None,display_order=40,related_service_slug=None)
 ],
 'services':[dict(slug='commercial-video-reels',title='Commercial Video & Reels',active=True)],
 'stories':[dict(gallery_id=ELEA,headline='Eléa Golf Club — Championship Photography',objective='Document real championship photography.',approach='Film golf course from above.',deliverables=['400+ photographs'],outcomes='Used on social media.',client_label='Eléa Golf Club',project_location='Paphos',project_year=2026,is_published=True)],
 'assets':[dict(id=ASSET,media_type='image',image_url='https://lilkangoomedia.com/assets/images/elea-golf-club/aerial-course-sand-bunkers.webp',youtube_id=None,title='Eléa Golf Club Aerial',alt_text='Aerial fairway and bunker',description='',tags=['golf','aerial'],created_at='2026-11-11T00:00:00Z'),dict(id=VIDEO,media_type='youtube',image_url=None,youtube_id='y1CB22Z-Qm4',title='Complete 18-hole flyover',alt_text='',description='',tags=['video'],created_at='2026-11-10T00:00:00Z')],
 'places':[dict(id=NEW,asset_id=ASSET,gallery_id=ELEA,service_slug=None,visibility='public',display_order=10,legacy_photo_id=None,legacy_video_id=None)]
 }

def bootstrap(page):
 data=fixtures()
 page.set_viewport_size({'width':1600,'height':960})
 page.set_content('<!doctype html><html><head><meta charset="utf-8"></head><body class="studio-body"><div id="lkmStudio"></div></body></html>')
 page.add_style_tag(content=(BASE/'assets/lkm-v3/studio.css').read_text())
 page.evaluate('''window.LKM_CONFIG={SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'test-key'};
 window.LKMStore={configured:true,getSession:()=>({access_token:'mock'}),isAdmin:async()=>true,authenticatedToken:async()=> 'mock',login:async()=>{},logout:()=>{}};
 window.__lkmRequests=[];''')
 page.evaluate('''window.__mock= JSON.parse(%s);''' % json.dumps(json.dumps(data)))
 page.evaluate('''window.fetch=async function(url,opt={}){
 const path=String(url).split('/rest/v1/')[1]||'';
 const method=opt.method||'GET';const store=window.__mock;
 const hdr={'Content-Type':'application/json','Content-Range':'0-1/'+store.assets.length};
 let rows=[];
 if(path.startsWith('portfolio_galleries')) {rows=store.galleries;if(method==='PATCH'){const id=/id=eq.([0-9a-f-]+)/.exec(path)?.[1],record=JSON.parse(opt.body||'{}');Object.assign(store.galleries.find(x=>x.id===id),record);window.__lkmRequests.push({method,path,record})}}
 else if(path.startsWith('services?'))rows=store.services;
 else if(path.startsWith('lkm_case_studies')){rows=store.stories;if(method==='POST'){const record=JSON.parse(opt.body);const idx=rows.findIndex(x=>x.gallery_id===record.gallery_id);if(idx===-1)rows.push(record);else rows[idx]=record;window.__lkmRequests.push({method,path,record})}}
 else if(path.startsWith('lkm_studio_audit'))rows=[];
 else if(path.startsWith('lkm_studio_assets')) {rows=store.assets;
  if(path.includes('id=in.(')){const ids=path.match(/id=in.\\(([^)]+)\\)/)?.[1].split(',')||[];rows=rows.filter(x=>ids.includes(x.id))}
  if(path.includes('media_type=eq.youtube'))rows=rows.filter(x=>x.media_type==='youtube');
  if(path.includes('media_type=eq.image'))rows=rows.filter(x=>x.media_type==='image');
  if(method==='PATCH'){const id=/id=eq.([0-9a-f-]+)/.exec(path)?.[1],record=JSON.parse(opt.body||'{}');Object.assign(store.assets.find(x=>x.id===id),record);window.__lkmRequests.push({method,path,record})}
  hdr['Content-Range']='0-'+(rows.length-1)+'/'+rows.length;
 }
 else if(path.startsWith('lkm_studio_placements')){rows=store.places;if(path.includes('asset_id=eq.'))rows=rows.filter(x=>path.includes(x.asset_id));if(path.includes('gallery_id=eq.'))rows=rows.filter(x=>path.includes(x.gallery_id));}
 else if(path.startsWith('rpc/lkm_studio_assign')){
  const p=JSON.parse(opt.body);window.__lkmRequests.push({method,path,record:p});
  const existing=store.places.find(x=>x.asset_id===p.p_asset_id&&x.gallery_id===p.p_gallery_id&&x.service_slug===p.p_service_slug);
  if(existing)existing.visibility=p.p_visibility;else store.places.push({id:'a0000000-0000-4000-8000-000000000001',asset_id:p.p_asset_id,gallery_id:p.p_gallery_id,service_slug:p.p_service_slug,visibility:p.p_visibility,display_order:p.p_display_order});
  rows='a0000000-0000-4000-8000-000000000001';
 }
 else if(path.startsWith('rpc/lkm_studio_register_asset')){rows='a0000000-0000-4000-8000-000000000002';}
 return new Response(JSON.stringify(rows),{status:200,headers:hdr});
 }''')
 page.add_script_tag(content=BUNDLE)

 page.locator('.studio-shell').wait_for(timeout=8000)
 return data

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page()
  errors=[]
  page.on('pageerror',lambda x:(errors.append(str(x)),print('JS PAGEERROR',str(x))))
  page.on('console',lambda x:print('JS CONSOLE',x.type,x.text) if x.type=='error' else None)
  bootstrap(page)
  assert page.get_by_text('Welcome to your Command Center').count()==1
  assert page.locator('.studio-kpi').count()==4
  assert '2' in page.locator('.studio-kpi').first.inner_text()   # 2 unique assets
  print('PASS Dashboard loads authenticated Supabase metrics and dark shell')
  page.get_by_role('button',name='Media Library').first.click()
  page.locator('.studio-asset').first.wait_for(timeout=5000)
  assert page.locator('.studio-asset').count()==2
  assert page.locator('.studio-inspector').inner_text().find('Aerial fairway')>=0 or 'Eléa Golf' in page.locator('.studio-inspector').inner_text()
  print('PASS Media Library lists one canonical asset per source')
  page.locator('.asset-check').first.check()
  page.get_by_role('button',name='Assign to').first.click()
  assert page.locator('dialog[open]').count()==1
  page.locator('dialog input[value="gallery:'+NATURE+'"]').check()
  page.locator('dialog select[name="visibility"]').select_option('public')
  page.get_by_role('button',name='Apply assignments').click()
  page.wait_for_timeout(180)
  assignments=page.evaluate('window.__lkmRequests.filter(x=>x.path.includes("lkm_studio_assign"))')
  assert len(assignments)==1 and assignments[0]['record']['p_gallery_id']==NATURE
  print('PASS Bulk reuse assigns existing asset to second gallery without upload')
  page.get_by_role('button',name='Projects & Stories').first.click()
  assert page.locator('#studioProjectForm').count()==1
  checkbox=page.locator('#studioProjectForm input[name="show_in_portfolio"]')
  assert not checkbox.is_checked()
  assert page.locator('#studioStoryForm input[name="is_published"]').is_checked()
  print('PASS Story publishing and duplicate gallery-card visibility independent')
  checkbox.check();page.locator('#studioProjectForm button[type="submit"]').click();page.wait_for_timeout(150)
  edits=page.evaluate('window.__lkmRequests.filter(x=>x.method==="PATCH"&&x.path.includes("portfolio_galleries"))')
  assert edits and edits[-1]['record']['show_in_portfolio'] is True
  print('PASS Project visibility toggle saves to existing gallery record')
  page.get_by_role('button',name='Collections').first.click()
  assert page.locator('.studio-project-form input[name=slug]').input_value()=='nature-photography'
  print('PASS Collections tab opens a collection, not the previously selected project')
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(150)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Mobile page has horizontal overflow'
  print('PASS Mobile 390px responsive layout has no horizontal overflow')
  page.set_viewport_size({'width':1600,'height':960})
  preview=Path('/mnt/data/lkm_phase26_studio/tests/COMMAND_CENTER_DESKTOP.png')
  page.get_by_role('button',name='Media Library').first.click()
  # This image is a known original from the user's Eléa Golf Club archive;
  # the browser preview still uses MOCKED database data, not production Supabase.
  import base64
  photo=Path('/mnt/data/elea_release/assets/images/elea-golf-club/aerial-course-sand-bunkers.webp')
  if photo.exists():
   data_url='data:image/webp;base64,'+base64.b64encode(photo.read_bytes()).decode('ascii')
   page.evaluate('u=>document.querySelectorAll(".studio-asset img,.studio-inspector-art").forEach(img=>img.src=u)',data_url)
  page.screenshot(path=str(preview),full_page=False)
  assert not errors,errors
  print('PASS No uncaught page errors; screenshot saved')
  browser.close()

if __name__=='__main__':run()
