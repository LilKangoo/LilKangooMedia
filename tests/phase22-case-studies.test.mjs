import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {slugOK,uuidOK,clean,imageURL,youtubeID,lines,publishedCase,readyToPublish,yearValue,selectedPhotos} from '../assets/lkm-v3/case-studies-data.mjs';
const path = p => new URL('../'+p,import.meta.url);
const read = p => readFileSync(path(p),'utf8');
const ID='6f6b882c-5b5b-4f6a-a96f-bf8f5f70a4e4';
const gallery={id:ID,slug:'commercial-video-reels',visibility:'public'};
const story={gallery_id:ID,is_published:true};
test('only valid, URL-safe gallery slugs are accepted',()=>{
  for(const x of ['commercial-video-reels','abc','one-2'])assert.equal(slugOK(x),true);
  for(const x of ['/abc','%2Fetc','abc?x=1','abc\\hello','A-BC',''])assert.equal(slugOK(x),false);
});
test('UUID parser rejects injected identifiers',()=>{
  assert.equal(uuidOK(ID),true);assert.equal(uuidOK("deadbeef'OR 1=1"),false);
});
test('image URLs reject HTML, JavaScript, traversal and protocol relative paths',()=>{
  assert.equal(imageURL('/assets/images/product.jpg'),'/assets/images/product.jpg');
  assert.equal(imageURL('https://example.com/image.jpg'),'https://example.com/image.jpg');
  for(const v of ['javascript:alert(1)','data:text/html,x','//example.com/a','/assets/../secret','https://foo.com/\" onerror=alert(1)'])assert.equal(imageURL(v),'');
});
test('YouTube IDs require exact 11 chars',()=>{
  assert.equal(youtubeID('AbCdefgh123'),'AbCdefgh123');assert.equal(youtubeID('https://youtu.be/AbCdefgh123'),'');
});
test('deliverables are deduplicated and capped',()=>{
  assert.deepEqual(lines('Reels\nPhotos\nPhotos\n\nWebsite'),['Reels','Photos','Website']);
  assert.equal(lines(Array.from({length:30},(_,i)=>'Task '+i).join('\n')).length,18);
});
test('draft and private gallery cannot be published publicly',()=>{
  assert.equal(publishedCase(story,gallery),true);
  assert.equal(publishedCase({...story,is_published:false},gallery),false);
  assert.equal(publishedCase(story,{...gallery,visibility:'review'}),false);
  assert.equal(publishedCase({...story,gallery_id:'other'},gallery),false);
});
test('editor requires real project narrative before publishing',()=>{
  const meaningful={headline:'Professional photo shoot',objective:'Client needed a useful product catalogue.',approach:'We photographed the original products and delivered edited files.'};
  assert.equal(readyToPublish(meaningful,gallery),true);
  assert.equal(readyToPublish({...meaningful,approach:''},gallery),false);
  assert.equal(readyToPublish(meaningful,{...gallery,visibility:'private'}),false);
});
test('years validate and empty year stays absent',()=>{
  assert.equal(yearValue('2026'),2026);assert.equal(yearValue(''),null);
  assert.equal(yearValue('1800'),null);assert.equal(yearValue('2026.2'),null);
});
test('only matching, public, safe images display, in saved order',()=>{
  const photos=[{gallery_id:ID,image_url:'/assets/a.jpg',visibility:'public',display_order:20},
    {gallery_id:ID,image_url:'/assets/b.jpg',visibility:'public',display_order:10},
    {gallery_id:ID,image_url:'/assets/private.jpg',visibility:'review',display_order:1},
    {gallery_id:'other',image_url:'/assets/other.jpg',visibility:'public'},
    {gallery_id:ID,image_url:'javascript:bad',visibility:'public'}];
  assert.deepEqual(selectedPhotos(photos,gallery).map(x=>x.image_url),['/assets/b.jpg','/assets/a.jpg']);
});
test('existing phases are retained in both homepage variants',()=>{
  for(const file of ['index.html','home.html']){
    const html=read(file);
    for(const phase of ['phase20-conversion','phase21-payments','phase21-availability','phase22-related-work','phase22-trust-reviews'])assert.match(html,new RegExp(phase));
    assert.match(html,/\/case-studies\.html/);
  }
});
test('editor and public pages use module scripts and dedicated CSS',()=>{
  assert.match(read('admin-case-studies.html'),/case-studies-admin\.mjs/);
  assert.match(read('case-studies.html'),/case-studies-public\.mjs/);
  assert.match(read('admin.html'),/phase22-case-admin-nav\.js/);
  for(const name of ['case-studies-public.mjs','case-studies-admin.mjs','case-studies-data.mjs','case-studies.css','phase22-case-admin-nav.js'])assert.ok(existsSync(path('assets/lkm-v3/'+name)));
});
test('public page queries only public galleries and published case study rows',()=>{
  const js=read('assets/lkm-v3/case-studies-public.mjs');
  assert.match(js,/is_published=eq\.true/);assert.match(js,/visibility=eq\.public/);
  assert.match(js,/publishedCase\(s,state\.galleries\.get\(s\.gallery_id\)\)/);
  assert.doesNotMatch(js,/api\.stripe\.com|refunds?|STRIPE_SECRET_KEY/i);
});
test('no fake results or client names are hardcoded',()=>{
  const js=read('assets/lkm-v3/case-studies-public.mjs');
  assert.match(js,/if\(clean\(story\.outcomes\)\)/);
  assert.match(js,/if\(story\.project_year\)/);
  assert.match(js,/story\.client_label\?/);
});
test('database uses authenticated RLS for edits, public published gallery-only read',()=>{
  const sql=read('supabase/migrations/20261110_lkm_case_studies.sql');
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/is_published AND EXISTS/i);
  assert.match(sql,/g\.visibility='public'/);
  assert.match(sql,/FOR ALL TO authenticated USING \(public\.lkm_is_admin\(\)\)/);
  assert.match(sql,/is_published boolean NOT NULL DEFAULT false/i);
  assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM public\.portfolio/i);
});
test('published related-service cards point to case studies, fallback to portfolio',()=>{
  const source=read('assets/lkm-v3/phase22-related-work.js');
  assert.match(source,/storyIds\.has\(g\.id\)/);
  assert.match(source,/project\.hasStory \? `\/case-studies\.html/);
  assert.match(source,/\: `\/portfolio\.html/);
});
