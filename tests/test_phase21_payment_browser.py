"""Offline Chromium smoke: desktop/mobile, payments OFF and TEST modes.
No real network and no real Stripe payment are attempted.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from datetime import datetime
from zoneinfo import ZoneInfo
ROOT = Path(__file__).resolve().parent.parent
booking=(ROOT/'assets/lkm-v3/phase21-booking.js').read_text()
payments=(ROOT/'assets/lkm-v3/phase21-payments.js').read_text()
html='''<!doctype html><html><body><div id="main"><div class="form-grid"><form id="bookingForm">
<label>Name <input name="name" value="Test Client" required></label>
<label>Email <input name="email" type="email" value="client@example.com" required></label>
<div class="field"><label>Date <input id="requestDate" name="preferred_date" type="date" required></label></div>
<label>Message <textarea name="message" required>My real message</textarea></label>
<label>Consent <input name="consent" type="checkbox" checked required></label>
<button type="submit" id="requestSubmit">Send enquiry</button><button type="button" id="checkoutButton">Legacy pay</button>
</form><aside></aside></div></div></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for mode in ('off','test'):
  for width in (1280,390):
   page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(4000);print('START',mode,width,flush=True)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate('''(mode)=>{
     const store=new Map([['lkm_selected_service','photo'],['lkm_phase18_main_photo',JSON.stringify({pkgId:'standard',addons:['prints'],qty:1})]]);
     Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
     window.LKMStore={publicServices:async()=>[{slug:'photo',title:'Photography',active:true,booking_mode:'deposit',packages:[{id:'standard',pricing_model:'fixed',price_cents:14900}],addons:[{id:'prints',billing_model:'once',price_cents:2500}]}]};
     window.__checkoutCalls=[];
     window.fetch=async(url,opts)=>{
       if(url==='/api/payment-options')return {ok:true,json:async()=>({enabled:mode==='test',mode})};
       if(url==='/api/checkout'){window.__checkoutCalls.push(JSON.parse(opts.body));return {ok:false,json:async()=>({ok:false,error:'Mock unavailable — no money taken'})};}
       throw Error('Unexpected call '+url);
     };
     location.hash='#/request';
   }''',mode)
   page.evaluate(booking);print('booking injected',flush=True)
   page.evaluate(payments);print('payments injected',flush=True)
   page.wait_for_selector('#lkm21-preferences');print('found prefs',flush=True)
   assert page.locator('#checkoutButton').is_hidden()
   if mode=='off':
    page.wait_for_timeout(200)
    assert page.locator('#lkm21-pay').count()==0
    print('PASS Chromium checkout disabled',width)
   else:
    page.wait_for_selector('#lkm21-pay');print('found pay',flush=True)
    assert page.locator('#lkm21-pay').inner_text().startswith('Test Stripe')
    page.locator('#requestDate').fill(datetime.now(ZoneInfo('Asia/Nicosia')).strftime('%Y-%m-%d'))
    page.locator('[name=booking_time]').select_option('morning')
    page.locator('#lkm21-pay').click()
    page.wait_for_function('window.__checkoutCalls.length===1')
    calls=page.evaluate('window.__checkoutCalls')
    assert calls[0]['service_slug']=='photo',calls
    assert calls[0]['package_id']=='standard'
    assert calls[0]['addon_ids']==['prints']
    assert calls[0]['booking_time']=='morning'
    assert calls[0]['payment_request_id']
    assert page.locator('#lkm21-payment-status').is_visible()
    assert 'no money taken' in page.locator('#lkm21-payment-status').inner_text()
    print('PASS Chromium test checkout form',width)
   assert not errors,errors
   page.close()
 browser.close()
