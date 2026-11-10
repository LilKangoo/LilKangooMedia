import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261110_lkm_client_portal_foundation.sql',import.meta.url),'utf8');
const client=readFileSync(new URL('../assets/lkm-v3/phase24-client.mjs',import.meta.url),'utf8');
const admin=readFileSync(new URL('../assets/lkm-v3/phase24-admin-portal.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../client.html',import.meta.url),'utf8');
test('portal is explicit-grant only and bound to JWT email',()=>{
 assert.match(sql,/g\.active=true\s+AND g\.client_email=v_email/i);
 assert.match(sql,/auth\.jwt\(\)->>'email'/);
 assert.match(sql,/u\.email_confirmed_at IS NOT NULL/);
 assert.match(sql,/REVOKE ALL ON public\.lkm_client_grants FROM PUBLIC,anon,authenticated/i);
 assert.match(sql,/revoke all on function public\.lkm_client_portal_summary\(\) from public,anon/i);
});
test('no broad client read of customer enquiries or finance',()=>{
 assert.doesNotMatch(sql,/GRANT\s+SELECT\s+ON\s+public\.(contact_leads|stripe_orders|lkm_crm_quotes)\s+TO\s+(anon|authenticated)/i);
 assert.doesNotMatch(client,/(stripe_orders|contact_leads|lkm_crm_quotes|crm_activities)/);
});
test('auto revoke on email change or archive',()=>{assert.match(sql,/AFTER UPDATE OF customer_email,archived_at/);assert.match(sql,/SET active=false/i);});
test('admin grant emails must match stored lead email',()=>{assert.match(sql,/NEW\.client_email IS DISTINCT FROM v_email/);assert.match(admin,/customer_email/);});
test('clients never see admin notes',()=>{assert.doesNotMatch(sql,/['"]internal_notes['"]/);assert.match(html,/noindex,nofollow/);});
test('no payments or refund APIs',()=>{assert.doesNotMatch(client+admin,/\/(refund|checkout|stripe-webhook)(\b|\/)/);});
