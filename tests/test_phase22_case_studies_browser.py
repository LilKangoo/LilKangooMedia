"""In-memory Chromium smoke test with synthetic Supabase responses. No network or production changes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parent.parent
GALLERY_ID='6f6b882c-5b5b-4f6a-a96f-bf8f5f70a4e4'
GALLERY={'id':GALLERY_ID,'slug':'test-project','title':'Documented original project','visibility':'public',
         'category':'Photography','cover_image_id':None,'related_service_slug':'product-brand-photography'}
STORY={'gallery_id':GALLERY_ID,'headline':'Real products photographed in Cyprus',
       'objective':'Client needed catalogue photos of products for their website.',
       'approach':'Our team used controlled lighting and edited selected product images.',
       'deliverables':['Edited catalogue images','Web-ready exports'],'outcomes':'','client_label':'',
       'project_location':'Cyprus','project_year':2026,'is_published':True}
PHOTO={'id':'692f4b66-9970-46c9-809c-3fd84af5123b','gallery_id':GALLERY_ID,'visibility':'public',
       'image_url':'https://images.example.test/original.jpg','alt_text':'Product photo',
       'caption':'Documented original picture','display_order':1}

helpers=(ROOT/'assets/lkm-v3/case-studies-data.mjs').read_text().replace('export function','function')
def compiled(which):
    text=(ROOT/f'assets/lkm-v3/case-studies-{which}.mjs').read_text()
    text='\n'.join(x for x in text.splitlines() if not x.startswith('import '))
    return '(async()=>{\n'+helpers+'\n'+text+'\n})().catch(e=>{document.body.dataset.scriptError=e.message;console.error(e)})'

mock_js = f'''window.LKM_CONFIG={{SUPABASE_URL:"https://test.supabase.co",SUPABASE_ANON_KEY:"public_test"}};
window.LKMStore={{configured:true,getSession:()=>({{access_token:'test'}}),authenticatedToken:async()=> 'test',isAdmin:async()=>true,login:async()=>true,logout:()=>{{}}}};
window.fetch=async(input,opts)=>{{
 const path=String(input);
 let data=[];
 if(path.includes('/portfolio_galleries?'))data={json.dumps([GALLERY])};
 if(path.includes('/lkm_case_studies?'))data={json.dumps([STORY])};
 if(path.includes('/portfolio_images?'))data={json.dumps([PHOTO])};
 return new Response(JSON.stringify(data),{{status:200,headers:{{'content-type':'application/json'}}}});
}};'''

if __name__=='__main__':
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height,label in [(1280,850,'desktop'),(390,844,'mobile')]:
      page=browser.new_page(viewport={'width':width,'height':height})
      page.set_content('<html><head></head><body><main id="lkmCasesPublic"></main></body></html>')
      page.add_style_tag(content=(ROOT/'assets/lkm-v3/case-studies.css').read_text())
      page.evaluate(mock_js)
      page.add_script_tag(content=compiled('public'))
      page.get_by_text('Real products photographed in Cyprus').wait_for(timeout=10000)
      assert page.locator('.lkm-case-card').count()==1
      assert page.locator('.lkm-case-outcome').count()==0
      assert not page.locator('body').get_attribute('data-script-error')
      page.evaluate("location.hash='#/test-project';window.dispatchEvent(new Event('hashchange'))")
      page.get_by_text('Our approach').wait_for(timeout=10000)
      assert page.get_by_text('Edited catalogue images').count()==1
      assert page.get_by_text('Documented original picture').count()==1
      assert page.locator('.lkm-case-outcome').count()==0
      assert not page.locator('body').get_attribute('data-script-error')
      print('PUBLIC CASE STUDY '+label+': PASS')
      page.close()
      page=browser.new_page(viewport={'width':width,'height':height})
      page.set_content('<html><head></head><body><main id="lkmCasesAdmin"></main></body></html>')
      page.add_style_tag(content=(ROOT/'assets/lkm-v3/case-studies.css').read_text())
      page.evaluate(mock_js)
      page.add_script_tag(content=compiled('admin'))
      page.get_by_role('heading',name='Case studies').wait_for(timeout=10000)
      assert page.get_by_text('Documented original project').count()>=1
      assert page.get_by_label('Project objective *').count()==1
      assert page.get_by_label('Our approach *').count()==1
      assert not page.locator('body').get_attribute('data-script-error')
      print('ADMIN CASE STUDY EDITOR '+label+': PASS')
      page.close()
    browser.close()
