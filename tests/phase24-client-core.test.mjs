import test from 'node:test';
import assert from 'node:assert/strict';
import {validEmail,cleanEmail,validOtp,sessionFromFragment,cleanItems,statusLabel} from '../assets/lkm-v3/phase24-client-core.mjs';
test('validEmail accepts real addresses, rejects bad or too long',()=>{
 assert.equal(validEmail('customer@example.com'),true);assert.equal(validEmail('customer@'),false);
 assert.equal(validEmail('x'.repeat(210)+'@example.com'),false);
 assert.equal(cleanEmail(' Customer@Example.COM '),'customer@example.com');
});
test('OTP requires 6-8 digits',()=>{assert.equal(validOtp('123456'),true);assert.equal(validOtp('12345678'),true);assert.equal(validOtp('1234'),false);assert.equal(validOtp('abcdef'),false);});
test('implicit URL session parsing accepts only access+refresh tokens',()=>{
 const s=sessionFromFragment('#access_token=one&refresh_token=two&token_type=bearer&expires_in=3600');
 assert.equal(s.access_token,'one');assert.equal(s.refresh_token,'two');
 assert.equal(sessionFromFragment('#access_token=one&token_type=bearer&expires_in=3600'),null);
 assert.equal(sessionFromFragment('#access_token=one&refresh_token=two&token_type=evil&expires_in=3600'),null);
});
test('safe summary filters items lacking valid ids',()=>{
 const x=cleanItems({ok:true,items:[{request_id:'12345678-1234-1234-1234-123456789012',service:'Photo',status:'confirmed'},{request_id:'nope',service:'Other'}]});
 assert.equal(x.length,1);assert.equal(x[0].status,'confirmed');assert.equal(x[0].service,'Photo');
});
test('unknown service statuses are not displayed as booking confirmation',()=>{
 assert.equal(statusLabel('not-real'),'Request received');
 assert.equal(cleanItems({ok:true,items:[{request_id:'12345678-1234-1234-1234-123456789012',status:'paid'}]})[0].status,'received');
});
test('unexpected response cannot be shown as any client record',()=>{
 assert.deepEqual(cleanItems({ok:false,items:[{request_id:'12345678-1234-1234-1234-123456789012'}]}),[]);
 assert.deepEqual(cleanItems({ok:true,items:null}),[]);
});
