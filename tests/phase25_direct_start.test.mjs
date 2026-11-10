import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../assets/lkm-v3/phase25-direct-start.js',import.meta.url),'utf8');
function run(search,hash,blocked=false){
 const values={};let replaced='',fallback='';
 const win={location:{pathname:'/',search,hash,replace(s){fallback=s}},sessionStorage:{setItem(k,v){if(blocked)throw Error('blocked');values[k]=v}},history:{state:{},replaceState(_,__,href){replaced=href}}};
 vm.runInNewContext(script,{window:win,URLSearchParams},{timeout:500});
 return {values,replaced,fallback};
}
test('direct start selects exactly the clicked service and cleans URL before SPA boot',()=>{
 const r=run('?lkm_service=website-design','#/quote');assert.equal(r.values.lkm_selected_service,'website-design');assert.equal(r.replaced,'/#/quote');assert.equal(r.fallback,'');
});
test('query parameter is not interpreted as an email or quote record',()=>{
 const r=run('?src=portfolio&lkm_service=portrait-photography','#/quote');assert.equal(r.values.lkm_selected_service,'portrait-photography');assert.equal(r.replaced,'/?src=portfolio#/quote');
});
test('unsafe slug cannot enter session or quote page',()=>{
 const r=run('?lkm_service=abc%2F%2E%2E%2Frequest','#/quote');assert.deepEqual(r.values,{});assert.equal(r.replaced,'/#/services');
});
test('no service query makes no modifications',()=>{
 const r=run('?src=social','#/services');assert.equal(r.replaced,'');assert.deepEqual(r.values,{});
});
test('storage unavailable falls back to ordinary service detail',()=>{
 const r=run('?lkm_service=social-media-management','#/quote',true);assert.equal(r.fallback,'/#/service/social-media-management');assert.equal(r.replaced,'');
});
