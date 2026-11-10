import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script = readFileSync(new URL('../assets/lkm-v3/phase22-trust-reviews.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
class Element {
  constructor(tag='div') {this.tagName=tag.toLowerCase(); this.children=[]; this.parentNode=null; this.dataset={};this.attrs={};this.className='';this._text='';this.href='';}
  set textContent(x) {this.children=[]; this._text=String(x)}
  get textContent(){return this._text + this.children.map(n=>n.textContent).join('')}
  get id(){return this.attrs.id||''}
  set id(s){this.attrs.id=s}
  setAttribute(name,val){this.attrs[name]=val}
  append(...nodes){for(const n of nodes){n.parentNode=this;this.children.push(n)} return this}
  before(n){const a=this.parentNode.children;a.splice(a.indexOf(this),0,n);n.parentNode=this.parentNode}
  after(n){const a=this.parentNode.children;a.splice(a.indexOf(this)+1,0,n);n.parentNode=this.parentNode}
  querySelector(query){const parts=query.split(',').map(s=>s.trim());const test=n=>parts.some(q=>{
    if(q.startsWith('#'))return n.id===q.slice(1);
    if(q.includes('[data-service-slug=')){const m=q.match(/\[data-service-slug="([^"]+)"\]/);return n.className.split(' ').includes('lkm-v14') && n.dataset.serviceSlug===m?.[1]}
    if(q.startsWith('.'))return n.className.split(' ').includes(q.slice(1));
    return false;
  }); const walk=node=>{for(const c of node.children){if(test(c))return c;const d=walk(c);if(d)return d}return null};return walk(this)}
  querySelectorAll(q){const all=[];const walk=node=>{for(const c of node.children){if((q.startsWith('.')&&c.className.split(' ').includes(q.slice(1)))||(q.startsWith('#')&&c.id===q.slice(1)))all.push(c);walk(c)}};walk(this);return all}
}
function fixture(reviewRows){
  const root=new Element('main');root.id='main';const detail=new Element();detail.className='lkm-v14';detail.dataset.serviceSlug='portrait-photography';root.append(detail);
  const projects=new Element('section');projects.id='lkm22-projects';detail.append(projects);
  const packages=new Element('section');packages.className='lkm-v14-packages';detail.append(packages);
  const window={LKM_CONFIG:{SUPABASE_URL:'https://fake.supabase.co',SUPABASE_ANON_KEY:'publishable'},addEventListener(){}};
  const location={hash:'#/service/portrait-photography'};
  let captured='';
  const context={window,location,document:{getElementById:()=>root,createElement:tag=>new Element(tag)},fetch:async url=>{captured=String(url);return {ok:true,json:async()=>reviewRows}},MutationObserver:class{observe(){}},requestAnimationFrame:callback=>callback(),console};
  vm.runInNewContext(script,context);
  return {root,detail,projects,packages,location,query:()=>captured};
}
const rows=[
  {id:'123',google_review_id:'google_123',reviewer_name:'Alice <script>bad</script>',body_en:'Great work!',rating:5,visible:true,featured:true,source:'google_takeout',reviewed_at:'2026-09-01T00:00:00Z'},
  {id:'456',reviewer_name:'Ben',body_en:'Very professional!',rating:4,visible:true,is_google_translation:true,source:'google_manual',reviewed_at:'2026-10-01T00:00:00Z'},
  {id:'789',reviewer_name:'Hidden',body_en:'PRIVATE',rating:5,visible:false},
  {id:'abc',reviewer_name:'Star only',body_en:'',rating:5,visible:true}
];
async function mounted(data){const r=fixture(data);await new Promise(resolve=>setTimeout(resolve,0));return {...r,section:r.detail.querySelector('#lkm222-reviews')}}
test('Phase 22.2 HTML includes one CSS and JS for both entry pages',()=>{
  for(const f of ['index.html','home.html']){
    const source=readFileSync(new URL('../'+f,import.meta.url),'utf8');
    for(const asset of ['phase22-trust-reviews.js','phase22-trust-reviews.css','phase22-related-work.js','phase21-payments.js'])
      assert.equal(source.split(asset).length-1,1, `${f} ${asset}`);
  }
});
test('only visible reviews with written content appear; company-wide disclaimer is clear',async()=>{
  const {section,query}=await mounted(rows);assert.ok(section);
  assert.equal(section.querySelectorAll('.lkm222-card').length,2);
  assert.match(section.textContent,/Great work/);assert.match(section.textContent,/Very professional/);
  assert.doesNotMatch(section.textContent,/PRIVATE/);
  assert.doesNotMatch(section.textContent,/Star only/);
  assert.match(section.textContent,/not necessarily reviews of this particular service/);
  assert.match(query(),/visible=eq.true/);
});
test('untrusted strings are inserted as text only, without HTML interpretation',async()=>{
  const {section}=await mounted(rows);assert.ok(section);
  assert.match(section.textContent,/Alice <script>bad<\/script>/);
  const card=section.querySelector('.lkm222-card');assert.ok(card);
  assert.equal(card.querySelector('script'),null);
  assert.equal(card.querySelector('.lkm222-read').href,'/reviews.html#review-google_123');
});
test('review section stays after related projects and before packages',async()=>{
  const {section,detail,projects,packages}=await mounted(rows);
  assert.equal(detail.children[0],projects);assert.equal(detail.children[1],section);assert.equal(detail.children[2],packages);
  assert.equal(section.querySelector('.lkm222-cta').href,'#/quote');
});
test('empty or unavailable archive shows honest fallback, no fabricated quote or rating',async()=>{
  const {section}=await mounted([]);assert.ok(section);
  assert.equal(section.querySelectorAll('.lkm222-card').length,0);
  assert.match(section.textContent,/not currently available/);
  assert.equal(section.textContent.includes('5.0'),false);
});
test('static module does not include secrets, changes to Stripe or refund mechanisms',()=>{
  assert.doesNotMatch(script,/service_role|secret_key|refunds\.create|\/v1\/refunds/i);
  assert.doesNotMatch(script,/innerHTML\s*=/);
  assert.doesNotMatch(script,/fetch\(\s*['"]\/?api\/(checkout|enquiry)/);
});
