import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const at=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=at('supabase/migrations/20261110_lkm_crm_admin_controls.sql');
const crm=at('assets/lkm-v3/phase23-crm.js');
const quotes=at('assets/lkm-v3/phase23-quotes.js');

test('admin controls migration only adds archive/correction fields; does not rewrite lead history or Stripe payments',()=>{
 assert.match(sql,/ADD COLUMN IF NOT EXISTS archived_at/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.lkm_crm_lead_audit/);
 assert.doesNotMatch(sql,/\bTRUNCATE\b|\bDROP TABLE\b|\bUPDATE\s+public\.stripe_orders\b|stripe\.com|\brefund\(/i);
});
test('audit records changed field names only, no personal old/new values',()=>{
 assert.match(sql,/v_fields\s*:=\s*array_append/);
 assert.match(sql,/INSERT INTO public\.lkm_crm_lead_audit/);
 assert.doesNotMatch(sql,/old_customer_name|old_customer_email|old_message|new_message|old_payload/i);
});
test('administrator delete is RPC-only, needs archive and typed confirmation',()=>{
 assert.match(sql,/FUNCTION public\.lkm_crm_admin_remove_lead/);
 assert.match(sql,/auth\.uid\(\) IS NULL OR NOT public\.lkm_is_admin\(\)/);
 assert.match(sql,/p_confirmation IS DISTINCT FROM 'DELETE'/);
 assert.match(sql,/IF v_lead\.archived_at IS NULL THEN/);
 assert.doesNotMatch(sql,/GRANT\s+DELETE\s+ON\s+public\.contact_leads/i);
});
test('protects quotes, booking history, and Stripe orders on deletion',()=>{
 assert.match(sql,/FROM public\.lkm_crm_quotes/);
 assert.match(sql,/FROM public\.lkm_booking_confirmations/);
 assert.match(sql,/FROM public\.stripe_orders/);
});
test('confirmed booking cannot silently change date or service',()=>{
 assert.match(sql,/NEW\.preferred_date IS DISTINCT FROM OLD\.preferred_date/);
 assert.match(sql,/NEW\.service_slug IS DISTINCT FROM OLD\.service_slug/);
 assert.match(sql,/b\.state='confirmed'/);
});
test('sent quotations remain immutable; only draft deletion via admin-checked RPC',()=>{
 assert.match(sql,/FUNCTION public\.lkm_crm_admin_remove_draft_quote/);
 assert.match(sql,/IF v_status <> 'draft'/);
 assert.match(quotes,/Discard draft/);
 assert.match(quotes,/rpc\/lkm_crm_admin_remove_draft_quote/);
});
test('CRM exposes edit, archive, restore, delete controls and inline quotations',()=>{
 for(const x of ['Edit enquiry','Archive enquiry','Restore enquiry','Delete permanently','quoteSummary','archived_at','lkm_crm_lead_audit'])assert.ok(crm.includes(x),x);
});
test('CRM retains manual-only communication and no payment/refund actions',()=>{
 assert.doesNotMatch(crm,/fetch\(['"]https:\/\/api\.stripe\.com/);
 assert.doesNotMatch(crm,/stripe\.refunds|refunds\.create|\/v1\/refunds/);
 assert.match(crm,/mailto:/);
});
test('admin lead screen links to the single workspace',()=>{
 assert.match(at('admin.html'),/phase23-admin-leads-link\.js/);
 assert.match(at('assets/lkm-v3/phase23-admin-leads-link.js'),/\/admin-crm\.html/);
});
