"""Offline desktop/mobile Chromium smoke for Phase 21.3.
Mock Supabase and public API: NO real customer data, payments, emails, or writes.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parent.parent
admin_js=(ROOT/'assets/lkm-v3/admin-calendar.js').read_text()
public_js=(ROOT/'assets/lkm-v3/phase21-availability.js').read_text()
admin_css=(ROOT/'assets/lkm-v3/admin-calendar.css').read_text()
public_css=(ROOT/'assets/lkm-v3/phase21-availability.css').read_text()
today=datetime.now(ZoneInfo('Asia/Nicosia')).strftime('%Y-%m-%d')

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1200,390):
  # Admin calendar reads records and supports blocking/unblocking from mock Supabase.
  page=browser.new_page(viewport={'width':width,'height':950});page.set_default_timeout(6000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html lang="en"><body><main id="lkmAdminCalendar"></main></body></html>')
  page.add_style_tag(content=admin_css)
  page.evaluate('''(today)=>{
    window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'anon'};
    window.LKMStore={configured:true,authenticatedToken:async()=> 'fake-jwt',isAdmin:async()=>true,
      adminServices:async()=>[{slug:'photo',title:'Photography',active:true},{slug:'video',title:'Video',active:true}]};
    window.__blocks=[];window.__requests=[];
    window.confirm=()=>true;
    window.fetch=async(url,opts={})=>{
      const path=String(url),method=opts.method||'GET';
      window.__requests.push({path,method});
      let result=[];
      if(path.includes('lkm_availability_blocks')){
        if(method==='POST'){
          const record=JSON.parse(opts.body); record.id='12345678-1234-4234-8234-'+String(window.__blocks.length+1).padStart(12,'0');
          window.__blocks.push(record);result=[record];
        }else if(method==='DELETE'){
          const id=new URL(path).searchParams.get('id').replace('eq.','');
          window.__blocks=window.__blocks.filter(b=>b.id!==id);
        }else result=window.__blocks;
      }else if(path.includes('contact_leads')){
        result=[{id:'lead1',customer_name:'Alice',service_slug:'photo',preferred_date:today,status:'new'}];
      }else if(path.includes('stripe_orders')){
        result=[{id:'order1',customer_name:'Bob',service_slug:'photo',preferred_date:today,status:'test_paid_pending_confirmation',paid_amount_cents:3000}];
      }else throw Error('Unexpected fetch '+path);
      return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
    };
  }''',today)
  page.evaluate(admin_js)
  page.wait_for_selector('.lkmcal-days .lkmcal-day')
  assert page.locator('.lkmcal-day').count()>=28
  assert page.locator('.lkmcal-stat').count()==3
  page.locator(f'[data-date="{today}"]').click()
  assert 'Alice' in page.locator('.lkmcal-aside').inner_text()
  assert 'Bob' in page.locator('.lkmcal-aside').inner_text()
  page.locator('#lkmcal-block-form select[name="scope"]').select_option('photo')
  page.locator('#lkmcal-block-form input[name="note"]').fill('Private admin note')
  page.locator('#lkmcal-block-form button[type="submit"]').click()
  page.wait_for_function('window.__blocks.length===1')
  page.wait_for_selector('.lkmcal-day-blocked')
  assert page.locator('.lkmcal-tag-blocked').count()>=1
  page.locator('[data-unblock]').click()
  page.wait_for_function('window.__blocks.length===0')
  page.wait_for_function("document.querySelectorAll('.lkmcal-day-blocked').length===0")
  assert not errors, errors
  print('PASS ADMIN',width, flush=True)
  page.close()

  # Public booking form shows block only for selected date.
  page=browser.new_page(viewport={'width':width,'height':950});page.set_default_timeout(6000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html><body><main id="main"><form id="bookingForm"><div class="field"><input type="date" id="requestDate" name="preferred_date"></div><button type="submit">Enquire</button></form></main></body></html>')
  page.add_style_tag(content=public_css)
  page.evaluate('''(today)=>{
    Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:key=>key==='lkm_selected_service'?'photo':null}});
    window.fetch=async(url)=>new Response(JSON.stringify({ok:true,blocked_dates:[today]}),{status:200,headers:{'Content-Type':'application/json'}});
    location.hash='#/request';
  }''',today)
  page.evaluate(public_js)
  page.wait_for_selector('#lkm21-availability-status')
  page.locator('#requestDate').fill(today)
  page.wait_for_function("document.querySelector('#requestDate').validationMessage.includes('blocked')")
  assert 'Unavailable' in page.locator('#lkm21-availability-status').inner_text()
  assert not errors, errors
  print('PASS PUBLIC',width,flush=True)
  page.close()
 browser.close()
