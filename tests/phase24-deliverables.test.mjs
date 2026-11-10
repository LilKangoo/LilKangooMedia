import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BUCKET,MAX_FILE_BYTES,validateUpload,privatePath,validPath,validHttps,cleanFileRecords,browserPreviewable,formatBytes} from '../assets/lkm-v3/phase24-deliverables-core.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const id='11111111-1111-4111-8111-111111111111';const fid='22222222-2222-4222-8222-222222222222';
const read=x=>readFileSync(join(root,x),'utf8');
const sql=read('supabase/migrations/20261110_lkm_client_deliverables.sql');
const admin=read('assets/lkm-v3/phase24-deliverables-admin.js');
const client=read('assets/lkm-v3/phase24-deliverables-client.mjs');
const clientOld=read('assets/lkm-v3/phase24-client.mjs');
test('private bucket name is stable and assets are allowed only below the upload limit',()=>{
 assert.equal(BUCKET,'lkm-client-deliverables');assert.equal(MAX_FILE_BYTES,45*1024*1024);
 assert.deepEqual(validateUpload({name:'portrait.webp',size:1000,type:'image/webp'}),{extension:'webp',mime:'image/webp',kind:'photo'});
 assert.equal(validateUpload({name:'film.mp4',size:1000,type:'video/mp4'}).kind,'video');
 assert.equal(validateUpload({name:'full-gallery.zip',size:1000,type:''}).kind,'archive');
 assert.throws(()=>validateUpload({name:'a.jpg',size:MAX_FILE_BYTES+1,type:'image/jpeg'}),/45 MB/);
 assert.throws(()=>validateUpload({name:'script.svg',size:1000,type:'image/svg+xml'}),/Allowed/);
 assert.throws(()=>validateUpload({name:'script.html',size:123,type:'text/html'}),/Allowed/);
 assert.throws(()=>validateUpload({name:'a.png',size:2,type:'text/html'}),/does not match/);
});
test('private object path cannot contain client names or traversal',()=>{
 const path=privatePath(id,fid,'jpg');assert.equal(path,`${id}/${fid}.jpg`);assert.ok(validPath(path));
 assert.equal(validPath('../foo.jpg'),false);assert.equal(validPath(`${id}/../file.png`),false);
 assert.throws(()=>privatePath(id,'../../other','jpg'));
});
test('external links require HTTPS, no embedded credentials or HTML',()=>{
 assert.equal(validHttps('https://adobe.ly/gallery123'),'https://adobe.ly/gallery123');
 for(const x of ['http://example.com','javascript:alert(1)','https://a.com/<script>','https://user:pass@example.com','https://x.test/hi\nbye'])assert.equal(validHttps(x),'');
});
test('client list refuses malformed records and script URLs',()=>{
 const good={id:fid,project_id:id,project_title:'Studio',title:'Album',filename:'client.zip',media_type:'archive',delivery_mode:'storage',storage_path:`${id}/${fid}.zip`,size_bytes:2400,mime_type:'application/zip'};
 const evil={...good,id:'33333333-3333-4333-8333-333333333333',storage_path:'../attack.zip'};
 const link={...good,id:'44444444-4444-4444-8444-444444444444',delivery_mode:'link',external_url:'https://drive.google.com/example',storage_path:null};
 const result=cleanFileRecords({ok:true,files:[good,evil,link]});assert.equal(result.length,2);assert.equal(result[0].filename,'client.zip');assert.equal(result[1].mode,'link');
 assert.throws(()=>cleanFileRecords({ok:false,files:[]}));
 assert.equal(browserPreviewable({mode:'storage',mime:'image/jpeg'}),true);assert.equal(browserPreviewable({mode:'storage',mime:'application/pdf'}),false);assert.equal(formatBytes(1024*1024),'1.0 MB');
});
test('SQL new private bucket, RLS and verified email gate; old tables never mutated',()=>{
 assert.match(sql,/storage\.buckets/);assert.match(sql,/public=false/);assert.match(sql,/ALTER TABLE public\.lkm_client_deliverables ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/CREATE POLICY "lkm private files admin or client read"/);assert.match(sql,/public\.lkm_client_can_fetch_file\(name\)/);
 assert.match(sql,/email_confirmed_at IS NOT NULL/);assert.match(sql,/g\.active=true/);assert.match(sql,/d\.client_visible=true/);assert.match(sql,/p\.client_visible=true/);assert.match(sql,/l\.archived_at IS NULL/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.lkm_client_deliverables_list\(\) TO authenticated/);
 assert.doesNotMatch(sql,/GRANT (?:SELECT|EXECUTE)[^\n]+ TO anon/);
 assert.doesNotMatch(sql,/ALTER TABLE public\.(?:stripe_orders|contact_leads|lkm_crm_quotes)/);
 assert.doesNotMatch(sql,/CREATE POLICY [^\n]+FOR SELECT TO anon/);
});
test('client downloads use authenticated Storage, never a public or permanent signed URL',()=>{
 assert.match(client,/\/storage\/v1\/object\/authenticated\//);assert.match(client,/Authorization:`Bearer \$\{jwt\}`/);
 assert.doesNotMatch(client,/createSignedUrl|\/object\/public\//);
 assert.match(client,/URL\.revokeObjectURL/);assert.match(client,/showClientDeliverables/);
 assert.match(clientOld,/showClientDeliverables\(deliveries,api,\(\)=>token\(\)\)/);
});
test('admin add/edit/revoke/remove controls, with no auto payments/refunds',()=>{
 for(const t of ['Upload privately','Save link privately','Unpublish','Publish','Edit','Remove','Download','Refresh files'])assert.ok(admin.includes(t),t);
 assert.match(admin,/client_visible:visible\.checked/);assert.match(admin,/crypto\.randomUUID\(\)/);
 assert.match(admin,/prompt\(/);assert.match(admin,/Type DELETE/);
 assert.doesNotMatch(admin,/\/api\/stripe|\/v1\/refunds|refunds\.create/);
});
test('HTML references all new modules and preserves the earlier client project tracking',()=>{
 const c=read('client.html'),a=read('admin-crm.html');
 assert.match(c,/phase24-deliverables-client\.css/);assert.match(c,/phase24-client\.mjs/);
 assert.match(a,/phase24-deliverables-admin\.js/);assert.match(a,/phase24-admin-projects\.js/);
 assert.match(clientOld,/showProjectTracking\(projects,t,api\)/);
 assert.ok(existsSync(join(root,'README-START-TUTAJ-PL.md')));
});
