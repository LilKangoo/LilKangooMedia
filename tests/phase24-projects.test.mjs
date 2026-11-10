import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {cleanProjects} from '../assets/lkm-v3/phase24-project-tracking.mjs';
const sql=readFileSync(new URL('../supabase/migrations/20261110_lkm_client_projects.sql',import.meta.url),'utf8');
const admin=readFileSync(new URL('../assets/lkm-v3/phase24-admin-projects.js',import.meta.url),'utf8');
const client=readFileSync(new URL('../assets/lkm-v3/phase24-client.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../admin-crm.html',import.meta.url),'utf8');
const uuid='11111111-1111-4111-8111-111111111111';
const project={project_id:uuid,request_id:uuid,title:'Test Project',phase:'in_progress',progress:45,summary:'Sample',order:null,updates:[]};
test('read-only sanitization requires authorized response',()=>{
 assert.throws(()=>cleanProjects(null));assert.throws(()=>cleanProjects({ok:false,projects:[project]}));
 assert.throws(()=>cleanProjects({ok:true,projects:{}}));
});
test('only stable UUID projects survive validation',()=>{
 const values=cleanProjects({ok:true,projects:[{...project,project_id:'invalid'},project]});assert.equal(values.length,1);
});
test('status and progress are whitelisted',()=>{
 const [p]=cleanProjects({ok:true,projects:[{...project,phase:'<script>',progress:120}]});
 assert.equal(p.phase,'planning');assert.equal(p.progress,0);
});
test('strings are bounded and order status verified',()=>{
 const [p]=cleanProjects({ok:true,projects:[{...project,title:'z'.repeat(600),order:{status:'test_paid_pending_confirmation',paid_amount_cents:100000}}]});
 assert.equal(p.title.length,160);assert.equal(p.order,null);
});
test('valid linked live paid order display is gross amount only',()=>{
 const [p]=cleanProjects({ok:true,projects:[{...project,order:{status:'paid_pending_confirmation',paid_amount_cents:15000,payment_kind:'deposit'}}]});
 assert.equal(p.order.paidCents,15000);assert.equal(p.order.kind,'deposit');
});
test('unverified project updates with wrong ID are ignored',()=>{
 const [p]=cleanProjects({ok:true,projects:[{...project,updates:[{id:'bad',title:'bad'}, {id:uuid,title:'Valid',detail:'Public',created_at:'2026-11-10'}]}]});
 assert.equal(p.updates.length,1);
});
test('project records stay private to admin RLS',()=>{
 assert.match(sql,/ALTER TABLE public\.lkm_client_projects ENABLE ROW LEVEL SECURITY/i);
 assert.match(sql,/ALTER TABLE public\.lkm_client_project_updates ENABLE ROW LEVEL SECURITY/i);
 assert.match(sql,/REVOKE ALL ON public\.lkm_client_projects FROM PUBLIC,anon,authenticated/i);
 assert.match(sql,/USING\(public\.lkm_is_admin\(\)\)/);
});
test('public client has RPC only and does not receive direct SELECT grants',()=>{
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.lkm_client_project_dashboard\(\) FROM PUBLIC,anon/i);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.lkm_client_project_dashboard\(\) TO authenticated/i);
 assert.doesNotMatch(sql,/GRANT SELECT ON public\.lkm_client_projects TO anon/i);
});
test('RPC requires verified Supabase identity and email',()=>{
 assert.match(sql,/auth\.uid\(\) IS NULL/);
 assert.match(sql,/u\.email_confirmed_at IS NOT NULL/);
 assert.match(sql,/lower\(btrim\(u\.email\)\)=v_email/);
});
test('RPC filters publication, grant and archived leads',()=>{
 assert.match(sql,/g\.active=true AND g\.client_email=v_email/);
 assert.match(sql,/l\.archived_at IS NULL AND p\.client_visible=true/);
 assert.match(sql,/u\.client_visible=true/);
});
test('linked payment email and test/live guards',()=>{
 assert.match(sql,/v_order_email IS DISTINCT FROM v_email/);
 assert.match(sql,/v_order_status LIKE 'test_%'/);
 assert.match(sql,/o\.customer_email\)\)=v_email/);
});
test('no payment/refund writes in phase24.2 SQL',()=>{
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|INSERT INTO)\s+public\.(?:stripe_orders|contact_leads|lkm_booking_confirmations|lkm_crm_quotes)\b/i);
 assert.doesNotMatch(admin,/(api\.stripe\.com|\/v1\/refunds|\/api\/checkout)/i);
});
test('admin UI has explicit visibility and draft deletion protection',()=>{
 assert.match(admin,/Visible to granted client/);
 assert.match(admin,/Private — admin only/);
 assert.match(sql,/IF OLD\.client_visible OR EXISTS/);
});
test('client portal preserves 24.1 summary while loading projects separately',()=>{
 assert.match(client,/lkm_client_portal_summary/);
 assert.match(client,/showProjectTracking\(projects,t,api\)/);
 assert.match(client,/root\.append\(list\)/);
});
test('new admin controls are additive to deployed Phase24.1 and CRM',()=>{
 assert.match(html,/phase24-admin-portal\.js/);
 assert.match(html,/phase24-admin-projects\.js/);
 assert.match(html,/phase23-crm\.js/);
});
