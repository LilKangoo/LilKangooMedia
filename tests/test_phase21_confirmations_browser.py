"""Phase 21.4 browser smoke with MOCK Supabase: no real writes or payments."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from datetime import datetime
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parent.parent
js=(root/'assets/lkm-v3/admin-calendar.js').read_text()
css=(root/'assets/lkm-v3/admin-calendar.css').read_text()
today=datetime.now(ZoneInfo('Asia/Nicosia')).strftime('%Y-%m-%d')
lead_id='12345678-1234-4234-8234-000000000001'
order_id='12345678-1234-4234-8234-000000000002'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1210,390]:
  page=browser.new_page(viewport={'width':width,'height':950});page.set_default_timeout(9000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html><body><main id="lkmAdminCalendar"></main></body></html>')
  page.add_style_tag(content=css)
  page.evaluate('''({today,leadId,orderId})=>{
    window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'anon'};
    window.LKMStore={configured:true,authenticatedToken:async()=> 'fake-jwt',isAdmin:async()=>true,
      adminServices:async()=>[{slug:'photo',title:'Photography',active:true}]};
    window.confirm=()=>true;
    window.__leads=[{id:leadId,customer_name:'Alice',customer_email:'alice@example.com',service_slug:'photo',preferred_date:today,status:'new'}];
    window.__orders=[{id:orderId,customer_name:'Bob',customer_email:'bob@example.com',service_slug:'photo',preferred_date:today,status:'test_paid_pending_confirmation',paid_amount_cents:5000}];
    window.__bookings=[];window.__calls=[];
    window.fetch=async(url,opts={})=>{
      const path=String(url),method=opts.method||'GET';let records=[];
      window.__calls.push({path,method});
      if(path.includes('rpc/lkm_admin_booking_decision')){
        const data=JSON.parse(opts.body),source=data.p_source_type,id=data.p_source_id,decision=data.p_decision;
        const item=(source==='lead'?window.__leads:window.__orders).find(x=>x.id===id);
        if(decision==='confirm'){
          if(window.__bookings.some(x=>x.state==='confirmed'&&x.service_slug===item.service_slug&&x.source_id!==id))
            return new Response(JSON.stringify({message:'Already booked'}),{status:409});
          window.__bookings.push({source_type:source,source_id:id,service_slug:'photo',booking_date:today,state:'confirmed'});
          item.status=source==='order'?'test_confirmed':'confirmed';
        }else{
          window.__bookings=window.__bookings.map(x=>x.source_id===id?{...x,state:'cancelled'}:x);
          item.status=source==='order'?'test_refund_review_required':decision==='decline'?'declined':'cancelled';
        }
        records={ok:true,state:decision};
      }else if(path.includes('lkm_booking_confirmations'))records=window.__bookings.filter(x=>x.state==='confirmed');
      else if(path.includes('lkm_availability_blocks'))records=[];
      else if(path.includes('contact_leads'))records=window.__leads;
      else if(path.includes('stripe_orders'))records=window.__orders;
      else throw Error('Unexpected '+path);
      return new Response(JSON.stringify(records),{status:200});
    };
  }''',{'today':today,'leadId':lead_id,'orderId':order_id})
  page.evaluate(js)
  page.wait_for_selector('.lkmcal-day')
  page.locator(f'[data-date="{today}"]').click()
  assert page.locator('.lkmcal-stat').count()==4
  page.locator(f'[data-source-id="{lead_id}"][data-decision="confirm"]').click()
  page.wait_for_function('window.__bookings.some(x=>x.state==="confirmed")')
  page.wait_for_selector('.lkmcal-tag-confirmed')
  assert 'Email confirmation to client' in page.locator('.lkmcal-aside').inner_text()
  page.locator(f'[data-source-id="{order_id}"][data-decision="confirm"]').click()
  page.wait_for_selector('.lkmcal-alert.error')
  assert 'unavailable' in page.locator('.lkmcal-alert.error').inner_text().lower()
  page.locator(f'[data-source-id="{lead_id}"][data-decision="cancel"]').click()
  page.wait_for_function('window.__bookings.every(x=>x.state==="cancelled")')
  page.locator(f'[data-source-id="{order_id}"][data-decision="decline"]').click()
  page.wait_for_function('window.__orders[0].status==="test_refund_review_required"')
  assert not errors,errors
  print('PASS Phase 21.4 admin',width,flush=True)
  page.close()
 browser.close()
