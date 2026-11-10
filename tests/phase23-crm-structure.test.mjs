import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=file('supabase/migrations/20261110_lkm_sales_crm.sql');
const js=file('assets/lkm-v3/phase23-crm.js');
const page=file('admin-crm.html');
test('CRM is a private admin area, not indexable',()=>{
 assert.match(page,/name="robots" content="noindex,nofollow"/);
 assert.match(js,/store\.isAdmin\(\)/);
 assert.match(js,/authenticatedToken\(\)/);
 assert.match(js,/Authorization:`Bearer \$\{token\}`/);
});
test('CRM stores metadata separately; no destructive changes to bookings, lead or payments',()=>{
 assert.match(sql,/create table if not exists public\.lkm_crm_lead_details/i);
 assert.match(sql,/create table if not exists public\.lkm_crm_activities/i);
 assert.doesNotMatch(sql.split('\n').filter(x=>!x.trim().startsWith('--')).join('\n'),/\b(?:update|delete|truncate)\s+(?:public\.)?(?:contact_leads|stripe_orders)\b/i);
 assert.doesNotMatch(js,/api\.stripe\.com|stripe-refund|\/api\/refund/i);
});
test('RLS and permissions: only admin role can access CRM tables',()=>{
 assert.match(sql,/enable row level security/ig);
 assert.match(sql,/revoke all on public\.lkm_crm_lead_details from public,anon/i);
 assert.match(sql,/revoke all on public\.lkm_crm_activities from public,anon/i);
 assert.match(sql,/public\.lkm_is_admin\(\)/);
 assert.doesNotMatch(sql,/grant (?:select|insert|update|delete)\b[^\n]*\bto\s+anon\b/i);
});
test('CRM displays only existing lead records; no invented sample customers',()=>{
 assert.match(js,/paged\('contact_leads','select=/);
 assert.doesNotMatch(js,/Alice Restaurant|Bob Hotel|Jane Doe/);
 assert.match(js,/state\.leads=leads/);
});
test('Manual sales activity cannot send mail or WhatsApp automatically',()=>{
 assert.match(js,/mailto:/);assert.match(js,/wa\.me/);
 assert.doesNotMatch(js,/api\.resend\.com|fetch\(['"]mailto|\.location\.assign\([^)]*wa\.me/i);
});
test('Separate admin navigation preserves existing admin features',()=>{
 const html=file('admin.html');
 assert.match(html,/phase23-crm-admin-nav\.js/);
 assert.match(html,/admin\.js/);
 assert.match(html,/cms\.js/);
 assert.match(html,/admin-calendar-nav\.js/);
 assert.match(html,/phase22-case-admin-nav\.js/);
});
