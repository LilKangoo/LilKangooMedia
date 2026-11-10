/** Public non-sensitive readiness check. Payment remains OFF until Netlify env is configured. */
import {json,paymentMode} from '../lib/payments.mjs';
export default async function paymentOptions(request){
  if(request.method!=='GET')return json({ok:false,error:'Method not allowed'},405);
  const mode=paymentMode(process.env);
  return json({enabled:mode!=='off',mode:mode==='test'?'test':mode==='live'?'live':'off'});
}
export const config={path:'/api/payment-options'};
