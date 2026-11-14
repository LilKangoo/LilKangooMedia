import assert from 'node:assert/strict';
import {test} from 'node:test';
import {filterProjectDirectory} from '../assets/lkm-v3/studio-model.mjs';

const entries=[
 {id:'x',title:'Éléa Golf Club',client_name:'Eléa',slug:'elea-golf',portfolio_kind:'project',visibility:'public',created_at:'2026-11-13T19:00:00Z'},
 {id:'y',title:'Portraits',client_name:'',slug:'portraits',portfolio_kind:'collection',visibility:'review',created_at:'2026-11-09T12:00:00Z'},
 {id:'z',title:'Sejwa Wedding Film',client_name:'Joanna',slug:'wedding',portfolio_kind:'project',visibility:'private',created_at:'2026-11-14T09:00:00Z'},
 {id:'w',title:'Historic collection',client_name:'',slug:'historic',portfolio_kind:'collection',visibility:'public',created_at:null},
];
test('mixed directory: newest first, undated last, does not mutate original data',()=>{
 const copy=[...entries];assert.deepEqual(filterProjectDirectory(entries).map(e=>e.id),['z','x','y','w']);
 assert.deepEqual(entries,copy);
});
test('distinct Work Gallery and Portfolio collections filters',()=>{
 assert.deepEqual(filterProjectDirectory(entries,{type:'project'}).map(e=>e.id),['z','x']);
 assert.deepEqual(filterProjectDirectory(entries,{type:'collection'}).map(e=>e.id),['y','w']);
});
test('case-insensitive, accent-insensitive name, client and slug lookup',()=>{
 assert.deepEqual(filterProjectDirectory(entries,{search:'elea'}).map(e=>e.id),['x']);
 assert.deepEqual(filterProjectDirectory(entries,{search:'JOANNA'}).map(e=>e.id),['z']);
 assert.deepEqual(filterProjectDirectory(entries,{search:'PORTRAITS'}).map(e=>e.id),['y']);
});
test('date added range and exact day filter work in UTC',()=>{
 assert.deepEqual(filterProjectDirectory(entries,{from:'2026-11-14',to:'2026-11-14'}).map(e=>e.id),['z']);
 assert.deepEqual(filterProjectDirectory(entries,{from:'2026-11-10',to:'2026-11-13'}).map(e=>e.id),['x']);
});
test('publication status and alphabetical sorting',()=>{
 assert.deepEqual(filterProjectDirectory(entries,{visibility:'public',sort:'title-asc'}).map(e=>e.id),['x','w']);
 assert.deepEqual(filterProjectDirectory(entries,{sort:'oldest'}).map(e=>e.id),['y','x','z','w']);
});
