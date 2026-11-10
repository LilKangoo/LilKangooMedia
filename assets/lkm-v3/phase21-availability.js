/* Phase 21.3: public date-block preview in the existing booking request form.
 * This is an availability INDICATOR only; no booking is confirmed automatically.
 * Server validates blocked dates independently when Stripe Checkout is enabled.
 */
(()=>{'use strict';
  if(window.__lkmPhase213Loaded)return;window.__lkmPhase213Loaded=true;
  const root=document.getElementById('main');if(!root)return;
  const memo=new Map();let queued=false;
  const slug=()=>{try{return sessionStorage.getItem('lkm_selected_service')||''}catch{return ''}};
  const validMonth=s=>/^\d{4}-(0[1-9]|1[0-2])$/.test(s||'');
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  async function unavailable(service,month){
    const key=service+'/'+month,cache=memo.get(key);
    if(cache&&Date.now()-cache.at<30000)return cache.dates;
    const response=await fetch('/api/availability?service='+encodeURIComponent(service)+'&month='+month,{cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok||!Array.isArray(payload.blocked_dates))throw Error('Calendar not currently available');
    const dates=new Set(payload.blocked_dates.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)));
    memo.set(key,{at:Date.now(),dates});return dates;
  }
  function attach(){
    if(!/^#\/request(?:[?]|$)/.test(location.hash))return;
    const form=root.querySelector('#bookingForm'),date=form?.querySelector('#requestDate');
    const service=slug();
    if(!date||!service||date.dataset.lkmAvailability)return;
    date.dataset.lkmAvailability='true';
    const status=make('p','lkm21-availability-status','Choose a preferred date to check for known unavailable days.');
    status.id='lkm21-availability-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    date.closest('.field')?.append(status);
    let generation=0;
    const check=async()=>{
      const chosen=date.value,turn=++generation;
      date.setCustomValidity('');
      if(!chosen){status.className='lkm21-availability-status';status.textContent='Choose a preferred date to check for known unavailable days.';return}
      if(!validMonth(chosen.slice(0,7)))return;
      status.className='lkm21-availability-status';status.textContent='Checking unavailable dates…';
      try{
        const dates=await unavailable(service,chosen.slice(0,7));
        if(turn!==generation||!root.contains(date)||date.value!==chosen)return;
        if(dates.has(chosen)){
          date.setCustomValidity('This date is blocked. Please select another preferred date.');
          status.className='lkm21-availability-status is-blocked';
          status.textContent='Unavailable: this date is blocked. Please choose another day.';
        }else{
          status.className='lkm21-availability-status is-open';
          status.textContent='No date block recorded. We will still confirm your booking manually.';
        }
      }catch{
        if(turn!==generation||!root.contains(date))return;
        date.setCustomValidity(''); // Do not prevent ordinary enquiries when calendar is offline.
        status.className='lkm21-availability-status is-unknown';
        status.textContent='Live calendar cannot be verified. You may still send an enquiry; payment checkout will recheck availability.';
      }
    };
    date.addEventListener('change',check);
    date.addEventListener('input',check);
    void check();
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach()})}
  new MutationObserver(schedule).observe(root,{childList:true});
  window.addEventListener('hashchange',schedule);
  schedule();
})();
