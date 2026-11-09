(()=>{'use strict';
  const measurement='G-VB93M2KSMX';
  let pref='';try{pref=localStorage.getItem('lkm_analytics_consent')||''}catch{}
  function enable(){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',measurement);const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurement;document.head.append(script)}
  if(pref==='yes'){enable();return}if(pref==='no')return;
  const bar=document.createElement('div');bar.className='article-cookie';bar.setAttribute('role','region');bar.setAttribute('aria-label','Privacy preferences');bar.innerHTML='<p>Optional analytics help us understand site usage. You can choose which cookies to allow.</p><button data-consent="no">Essential only</button><button data-consent="yes">Allow analytics</button>';
  document.body.append(bar);bar.addEventListener('click',e=>{const consent=e.target.closest('[data-consent]')?.dataset.consent;if(!consent)return;try{localStorage.setItem('lkm_analytics_consent',consent)}catch{}bar.remove();if(consent==='yes')enable()});
})();
