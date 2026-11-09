const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const code=fs.readFileSync(require('node:path').join(__dirname,'./pricing-core.js'),'utf8');
const context={window:{}};
vm.runInNewContext(code,context);
const P=context.window.LKMPricing;
test('historic fixed package stays fixed and keeps its amount',()=>{
 const pkg={id:'photo-basic-1h',name:'Photo Basic',price_cents:14900};
 assert.equal(P.mode(pkg),'fixed');assert.equal(P.priceText(pkg),'€149');
 assert.equal(P.estimate(pkg).oneTime,14900);
 assert.equal(P.directPaymentEligible(pkg),true);
});
test('hourly price respects quantity and minimum',()=>{
 const pkg={name:'Photography',pricing_model:'hour',price_cents:15000,min_quantity:2,quantity_step:.5};
 assert.equal(P.estimate(pkg,[],[],1).qty,2);
 assert.equal(P.estimate(pkg,[],[],3.5).oneTime,52500);
 assert.equal(P.priceText({...pkg,show_from:true}),'From €150/hour');
 assert.equal(P.directPaymentEligible(pkg),false);
});
test('monthly plan separates recurring fee, setup and extras',()=>{
 const pkg={name:'Social media',pricing_model:'month',price_cents:25000,setup_fee_cents:10000,minimum_term_months:3};
 const addons=[{id:'a',name:'More posts',price_cents:5000,billing_model:'month'}, {id:'b',name:'Start-up photo session',price_cents:15000,billing_model:'once'}];
 const est=P.estimate(pkg,addons,['a','b']);
 assert.equal(est.monthly,30000);assert.equal(est.oneTime,25000);assert.equal(est.yearly,0);
 assert.equal(P.directPaymentEligible(pkg,addons,['a']),false);
});
test('annual subscription and per-unit extra calculations',()=>{
 const annual={name:'Website maintenance',pricing_model:'year',price_cents:30000};
 assert.equal(P.estimate(annual).yearly,30000);
 const hourly={name:'Film',pricing_model:'hour',price_cents:25000,min_quantity:1};
 assert.equal(P.estimate(hourly,[{id:'travel',name:'Travel',price_cents:1000,billing_model:'unit'}],['travel'],2).oneTime,52000);
});
test('custom quote shows no invented price',()=>{
 const pkg={name:'Campaign',pricing_model:'quote',price_cents:0};
 assert.equal(P.priceText(pkg),'Custom quote');assert.equal(P.estimate(pkg).available,false);
});
test('quantity stays within min and max even when max is not a step multiple',()=>{
 const pkg={pricing_model:'hour',price_cents:15000,min_quantity:1,max_quantity:3.5,quantity_step:1};
 assert.ok(P.safeQty(pkg,99)<=3.5);assert.ok(P.safeQty(pkg,-1)>=1);
});
test('legacy service catalog price labels',()=>{
 const pkg=[{name:'Photo Basic',price_cents:14900},{name:'Photo Combo',price_cents:34900}];
 assert.equal(P.servicePrice({packages:pkg}),'€149');
 assert.equal(P.servicePriceLabel({packages:pkg}),'Packages from');
 assert.equal(P.servicePrice({packages:[]}), 'Custom quote');
});
