"""Isolated UI smoke tests using the shipped HTML/JS/CSS with mocked admin Supabase.
Browser policy blocks navigations, so we use page.set_content + inline module assembly.
"""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
assets=root/'assets/lkm-v3'
html=(root/'admin-reports.html').read_text()
html=re.sub(r'<script\b[^>]*>(.*?)</script>','',html,flags=re.S|re.I)
html=re.sub(r'<script\b[^>]*/>','',html,flags=re.S|re.I)
html=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>','',html,flags=re.I)
css=(assets/'phase23-reports.css').read_text()
html=html.replace('</head>','<style>body{font-family:Arial,sans-serif;margin:0}.site-header{background:white}.header-inner{padding:13px 25px;display:flex;justify-content:space-between;align-items:center}.identity{display:flex;align-items:center;gap:10px;text-decoration:none;color:#222;font-weight:700}.button{padding:11px 13px;border-radius:9px;background:#fff;border:1px solid #dae1d6;cursor:pointer}'+css+'</style></head>')
core=(assets/'phase23-report-core.mjs').read_text().replace('export const','const').replace('export function','function')
js=(assets/'phase23-reports.js').read_text()
js=re.sub(r'^import .*? from [^\n]+\n','',js,flags=re.M)
script=core+'\n'+js
responses={
    'contact_leads':[
      {'id':'10000000-0000-4000-8000-000000000001','customer_name':'Michael Test','created_at':'2026-11-03T13:00:00Z','service_slug':'commercial-video-reels','submission_type':'business_enquiry','archived_at':None},
      {'id':'10000000-0000-4000-8000-000000000002','customer_name':'Anna Test','created_at':'2026-11-01T13:00:00Z','service_slug':'portrait-photography','submission_type':'booking_enquiry','archived_at':None},
      {'id':'10000000-0000-4000-8000-000000000003','customer_name':'Agency Test','created_at':'2026-10-22T10:00:00Z','service_slug':'commercial-video-reels','submission_type':'business_enquiry','archived_at':None}],
    'lkm_crm_lead_details':[
      {'lead_id':'10000000-0000-4000-8000-000000000001','stage':'proposal','estimated_value_cents':70000,'next_follow_up_date':'2026-11-09'},
      {'lead_id':'10000000-0000-4000-8000-000000000002','stage':'new','estimated_value_cents':None,'next_follow_up_date':None},
      {'lead_id':'10000000-0000-4000-8000-000000000003','stage':'won','estimated_value_cents':120000,'next_follow_up_date':None}],
    'lkm_crm_quotes':[
      {'id':'20000000-0000-4000-8000-000000000001','lead_id':'10000000-0000-4000-8000-000000000001','customer_name':'Michael Test','quote_number':1,'created_at':'2026-11-04T13:00:00Z','valid_until':'2026-11-22','status':'sent','line_items':[{'description':'Reel','quantity':2,'unit_price_cents':35000}],'discount_cents':0}],
    'lkm_quote_approvals':[
      {'quote_id':'20000000-0000-4000-8000-000000000001','decision':'pending','created_at':'2026-11-04T13:00:00Z','expires_at':'2026-11-22T22:00:00Z','decided_at':None}],
    'stripe_orders':[
      {'created_at':'2026-11-05T13:00:00Z','status':'paid_pending_confirmation','paid_amount_cents':17500,'service_slug':'commercial-video-reels'},
      {'created_at':'2026-11-05T13:00:00Z','status':'test_paid_pending_confirmation','paid_amount_cents':100000,'service_slug':'portrait-photography'}]
}
bootstrap='''window.LKM_CONFIG={SUPABASE_URL:"https://mock.supabase.co",SUPABASE_ANON_KEY:"test_public_key"};
window.LKMStore={configured:true,getSession(){return {access_token:"test"}},async isAdmin(){return true},async authenticatedToken(){return "test"},async login(){return {}},logout(){}};
window.fetch=async function(input){const table=String(input).split("/rest/v1/")[1]?.split("?")[0];if(!table||!window.__mockRows[table])return new Response("Not found",{status:404});return new Response(JSON.stringify(window.__mockRows[table]),{status:200,headers:{"content-type":"application/json"}});};'''

def check(browser,width,height,label):
    context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True)
    page=context.new_page()
    problems=[]
    page.on('pageerror',lambda e: problems.append(str(e)))
    page.set_content(html,wait_until='load')
    page.evaluate('(rows)=>{window.__mockRows=rows}',responses)
    page.add_script_tag(content=bootstrap)
    page.add_script_tag(type='module',content=script)
    
    try: page.get_by_role('heading',name='Sales reporting').wait_for(timeout=6000)
    except Exception as e:
        print('REPORT ROOT',page.locator('#lkmReportsRoot').inner_text()[:4000]);print('ERRORS',problems);raise
    assert page.get_by_text('Open opportunities').count()==1
    assert page.get_by_text('€700.00',exact=True).count()>=1
    assert page.get_by_text('Stripe recorded gross').count()==1
    page.get_by_label('Reporting period').select_option('30')
    page.get_by_label('Service').select_option('commercial-video-reels')
    assert page.get_by_text('Enquiries').count()>=1
    with page.expect_download() as received:
        page.get_by_role('button',name='Export summary CSV').click()
    file=received.value.path()
    downloaded=Path(file).read_text(encoding='utf-8-sig')
    assert 'commercial-video-reels' in downloaded and 'Michael Test' not in downloaded
    size=page.evaluate('({viewport:window.innerWidth,width:document.documentElement.scrollWidth})')
    assert size['width']<=size['viewport']+2,size
    assert not problems,problems
    dest=root/'tests'/f'reports_{label}.png'
    page.screenshot(path=str(dest),full_page=True)
    print(label,'PASS',size,'screenshot:',dest)
    context.close()

def check_unauthorized(browser):
    context=browser.new_context(viewport={'width':390,'height':844})
    page=context.new_page()
    page.set_content(html,wait_until='load')
    page.evaluate('window.__mockRows={}')
    guarded=bootstrap.replace('async isAdmin(){return true}', 'async isAdmin(){return false}').replace('window.fetch=async function(input){','window.fetch=async function(input){window.__fetchCount=(window.__fetchCount||0)+1;')
    page.add_script_tag(content=guarded)
    page.add_script_tag(type='module',content=script)
    page.get_by_role('heading',name='Sales overview').wait_for(timeout=8000)
    assert page.locator('.lkm24-kpi').count()==0
    assert page.evaluate('window.__fetchCount||0')==0
    print('unauthorized PASS: sign-in only; zero protected reads')
    context.close()

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    try:
        check(b,1280,900,'desktop')
        check(b,390,844,'mobile')
        check_unauthorized(b)
    finally:b.close()
