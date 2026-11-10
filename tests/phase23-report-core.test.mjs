import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeReport,dateMinus,cyprusToday,quoteTotal,exportSummaryCsv} from '../assets/lkm-v3/phase23-report-core.mjs';
const today='2026-11-10';
const id=i=>`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
const L=(i,date,slug='photography',archived=null,name='Test Person')=>({id:id(i),customer_name:name,created_at:date+'T10:20:00Z',service_slug:slug,submission_type:'booking_enquiry',archived_at:archived});
const D=(i,stage='new',value=null,date=null)=>({lead_id:id(i),stage,estimated_value_cents:value,next_follow_up_date:date});
const Q=(i,lead,status='sent',when='2026-10-20',items=[{description:'Reel',quantity:2.5,unit_price_cents:15000}],discount=500)=>({id:id(i+100),lead_id:id(lead),customer_name:'Customer',status,quote_number:i,created_at:when+'T09:00:00Z',valid_until:'2026-12-01',line_items:items,discount_cents:discount});
const A=(i,decision)=>({quote_id:id(i+100),decision});
const O=(status,amount=10000,when='2026-10-20',slug='photography')=>({created_at:when+'T09:00:00Z',status,paid_amount_cents:amount,service_slug:slug});
const empty=()=>({leads:[],details:[],quotes:[],approvals:[],orders:[]});
const run=(data,opts={})=>makeReport(data,{today,period:'90',...opts});
test('Cyprus calendar dates and inclusive reporting window',()=>{
 assert.equal(dateMinus('2026-11-10',0),'2026-11-10');assert.equal(dateMinus('2026-03-01',1),'2026-02-28');
 assert.equal(cyprusToday(new Date('2026-11-09T22:40:00Z')),'2026-11-10');
 assert.throws(()=>dateMinus('2026-02-30',1));
});
test('Empty dataset returns explicit zero and undefined approval rate',()=>{
 const r=run(empty());assert.equal(r.totals.leads,0);assert.equal(r.totals.grossStripeCents,0);assert.equal(r.totals.acceptedRate,null);assert.equal(r.stages.length,6);
});
test('Missing table fails closed rather than inventing a report',()=>assert.throws(()=>run({leads:[]}),/missing/));
test('Lead window counts created on inclusive day and excludes previous day',()=>{
 const d=empty();d.leads=[L(1,'2026-08-13'),L(2,'2026-08-12'),L(3,'2026-11-10'),L(4,'2026-11-11')];
 const r=run(d);assert.equal(r.totals.leads,2);assert.equal(r.window.from,'2026-08-13');
});
test('Open pipeline excludes archived, won, lost and distinguishes estimated values',()=>{
 const d=empty();d.leads=[L(1,'2026-11-01'),L(2,'2026-11-01', 'photography','2026-11-02'),L(3,'2026-11-01'),L(4,'2026-11-01')];
 d.details=[D(1,'qualified',230000),D(2,'new',80000),D(3,'won',30000),D(4,'lost',10000)];
 const r=run(d);assert.equal(r.totals.leads,4);assert.equal(r.totals.open,1);assert.equal(r.totals.openEstimatedCents,230000);assert.equal(r.totals.won,1);assert.equal(r.totals.archived,1);
});
test('Quote sums and acceptance are versions, NOT sales revenue',()=>{
 const d=empty();d.leads=[L(1,'2026-11-01')];d.quotes=[Q(1,1),Q(2,1),Q(3,1,'draft')];d.approvals=[A(1,'accepted'),A(2,'declined')];
 const r=run(d);assert.equal(r.totals.quotesSent,2);assert.equal(r.totals.quotesDraft,1);assert.equal(r.totals.quotesAccepted,1);assert.equal(r.totals.quotesDeclined,1);assert.equal(r.totals.quotedSentCents,74000);assert.equal(r.totals.acceptedQuoteCents,37000);assert.equal(r.totals.acceptedRate,.5);assert.equal(r.totals.grossStripeCents,0);
});
test('Quote totals handle quarter-hour rounding and refuse invalid data',()=>{
 assert.equal(quoteTotal(Q(1,1)),37000);
 assert.equal(quoteTotal(Q(1,1,'sent','2026-10-20',[{quantity:0.25,unit_price_cents:101}],0)),25);
 assert.equal(quoteTotal(Q(1,1,'sent','2026-10-20',[{quantity:0,unit_price_cents:10}],0)),null);
 assert.equal(quoteTotal(Q(1,1,'sent','2026-10-20',[{quantity:1,unit_price_cents:10}],100)),null);
});
test('Live Stripe order gross excludes test-mode and never claims net after refunds',()=>{
 const d=empty();d.orders=[O('paid_pending_confirmation',50000),O('test_paid_pending_confirmation',100000),O('cancelled_refund_review_required',12000)];
 const r=run(d);assert.equal(r.totals.livePaidOrders,2);assert.equal(r.totals.grossStripeCents,62000);assert.equal(r.totals.excludedTestOrders,1);
});
test('Service filtering includes newer quotes for older leads and matching orders',()=>{
 const d=empty();d.leads=[L(1,'2026-01-04','websites'),L(2,'2026-11-01','photography')];d.quotes=[Q(1,1),Q(2,2)];d.orders=[O('paid_pending_confirmation',9000,'2026-10-20','websites'),O('paid_pending_confirmation',13000,'2026-10-20','photography')];
 const r=run(d,{service:'websites'});assert.equal(r.totals.leads,0);assert.equal(r.totals.quotesSent,1);assert.equal(r.totals.livePaidOrders,1);assert.equal(r.totals.grossStripeCents,9000);
});
test('Follow-ups only for active leads in selected cohort and known dates',()=>{
 const d=empty();d.leads=[L(1,'2026-11-01'),L(2,'2026-11-01'),L(3,'2026-11-01')];d.details=[D(1,'qualified',3000,'2026-11-10'),D(2,'won',3000,'2026-11-09'),D(3,'new',3000,'2026-11-11')];
 assert.equal(run(d).totals.followupsDue,1);
});
test('CSV contains summaries only and neutralizes formulas',()=>{
 const d=empty();d.leads=[L(1,'2026-11-01','=HYPERLINK("x")',null,'Private Name')];
 const csv=exportSummaryCsv(run(d));assert.ok(csv.includes("'=HYPERLINK"));assert.ok(!csv.includes('Private Name'));assert.ok(!csv.includes('customer_email'));
});
test('No forbidden Stripe refunds or data mutations in reporting module',()=>{
 const s=readFileSync(new URL('../assets/lkm-v3/phase23-reports.js',import.meta.url),'utf8');
 assert.ok(!/method\s*:\s*['"](POST|PATCH|PUT|DELETE)['"]/.test(s));assert.ok(!/api\.stripe\.com|refunds\s*\(/i.test(s));
 assert.match(s,/store\.isAdmin\(\)/);assert.match(s,/exportSummaryCsv/);
});
test('Published dashboard assets and nav remain aligned',()=>{
 const html=readFileSync(new URL('../admin-reports.html',import.meta.url),'utf8');
 assert.match(html,/phase23-reports\.js/);assert.match(html,/noindex,nofollow/);assert.match(html,/referrer.*no-referrer/);
 for(const name of ['admin.html','admin-crm.html','admin-quotes.html']){assert.match(readFileSync(new URL('../'+name,import.meta.url),'utf8'),/admin-reports\.html|phase23-reports-admin-nav\.js/)}
});
