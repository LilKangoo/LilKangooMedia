import assert from 'node:assert/strict';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
globalThis.document={querySelector:()=>null};
const {cleanServiceResponse,renderServiceState}=await import(pathToFileURL(resolve('assets/lkm-v3/service-seo.mjs')).href);
test('only exactly active, matching service shown',()=>{
 const rows=[{slug:'photography',active:false,packages:[{name:'Hidden'}]},{slug:'photography',active:true,title:'Current',packages:[{name:'Package A',description:'Details'}]}];
 assert.equal(cleanServiceResponse(rows,'photography').packages[0].name,'Package A');
 assert.equal(cleanServiceResponse(rows,'other'),null);
});
test('malformed slugs are rejected',()=>{
 for(const slug of ['../../admin','photo?key=123','photo space','<svg>',''])assert.equal(cleanServiceResponse([],slug),null);
});
test('catalogue package name and description are bounded',()=>{
 const p=cleanServiceResponse([{slug:'x',active:true,title:'x'.repeat(1000),packages:[{name:'A'.repeat(500),description:'B'.repeat(1000)}]}],'x');
 assert.equal(p.title.length,210);
 assert.equal(p.packages[0].name.length,210);
 assert.equal(p.packages[0].description.length,210);
});
test('rejects unknown records and non-arrays',()=>{
 assert.equal(cleanServiceResponse({slug:'x'},'x'),null);
 assert.equal(cleanServiceResponse([{slug:'x',active:'true'}],'x'),null);
});
test('does not display pricing invented by frontend',()=>{
 const s=cleanServiceResponse([{slug:'photo',active:true,packages:[{name:'One',price_cents:5000}]}],'photo');
 assert.deepEqual(s.packages,[{name:'One',description:''}]);
});
