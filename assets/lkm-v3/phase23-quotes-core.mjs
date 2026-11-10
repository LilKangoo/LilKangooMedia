/** LilKangooMedia Phase 23.2 — quotation math and input validation.
 * No taxes or VAT are calculated or implied. A quote is NOT a paid order.
 */
export function euroToCents(raw){
 const str=String(raw??'').trim().replace(',','.');
 if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(str))throw Error('Enter a valid EUR amount (up to 2 decimal places).');
 const [whole,cents='']=str.split('.');
 const amount=Number(whole)*100+Number(cents.padEnd(2,'0'));
 if(!Number.isSafeInteger(amount)||amount>1000000000)throw Error('Amount is outside the allowed range.');
 return amount;
}
export function centsToEuro(value){return (Number(value||0)/100).toFixed(2)}
export function validQuoteDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const d=new Date(value+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function validLeadId(id){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')}
export function computeQuote(lines,discount=0){
 if(!Array.isArray(lines)||lines.length>30)throw Error('Maximum 30 quotation lines.');
 let subtotal=0;const normalized=[];
 for(const input of lines){
  const description=String(input.description??'').trim();
  const quantity=Number(input.quantity);
  const unit=Number(input.unit_price_cents);
  if(description.length<2||description.length>180)throw Error('Each quotation line needs a description (2–180 characters).');
  if(!Number.isFinite(quantity)||quantity<=0||quantity>1000||!Number.isInteger(quantity*4))throw Error('Quantity must be from 0.25 to 1,000, in quarter-unit steps.');
  if(!Number.isSafeInteger(unit)||unit<0||unit>1000000000)throw Error('Invalid unit price.');
  const lineTotal=Math.round(unit*quantity);
  subtotal+=lineTotal;
  if(!Number.isSafeInteger(subtotal)||subtotal>1000000000)throw Error('Total exceeds the allowed maximum.');
  normalized.push({description,quantity,unit_price_cents:unit});
 }
 if(!Number.isSafeInteger(discount)||discount<0||discount>subtotal)throw Error('Discount cannot exceed the subtotal.');
 return {lines:normalized,subtotal,discount,total:subtotal-discount};
}
export function validateQuote(quote,requireComplete=false){
 const title=String(quote.title||'').trim();
 const name=String(quote.customer_name||'').trim();
 const email=String(quote.customer_email||'').trim();
 const company=String(quote.customer_company||'').trim();
 const phone=String(quote.customer_phone||'').trim();
 if(!validLeadId(quote.lead_id))throw Error('Choose an existing CRM enquiry.');
 if(title.length>180||name.length>120||email.length>200||company.length>160||phone.length>50)throw Error('A field is too long.');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Check the customer email address.');
 if(!validQuoteDate(quote.issue_date)||!validQuoteDate(quote.valid_until)||quote.valid_until<quote.issue_date)throw Error('Choose valid issue and expiry dates.');
 if(quote.currency!=='EUR')throw Error('Quotations must use EUR.');
 if(String(quote.introduction||'').length>1600||String(quote.scope_notes||'').length>3000||String(quote.terms||'').length>3000)throw Error('A notes field is too long.');
 const amounts=computeQuote(quote.line_items||[],quote.discount_cents||0);
 if(requireComplete&&(!title||!name||!email||!amounts.lines.length))throw Error('Fill in title, customer name, email and at least one item before sending or exporting.');
 return amounts;
}
export function quoteCode(n){if(!Number.isSafeInteger(Number(n))||Number(n)<=0)return 'DRAFT';return 'LKM-Q-'+String(n).padStart(6,'0')}
