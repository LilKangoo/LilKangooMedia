/* LilKangooMedia Phase 17 — public reviews. Native Supabase RLS; no Google API. */
(()=>{
'use strict';
const GOOGLE='https://www.google.com/maps/place/LilKangooMedia/@35.1688,33.4252,9z/data=!4m8!3m7!1s0x14e083213d8d68e1:0xc5fa68230e0cfed8!8m2!3d35.1688!4d33.4252!9m1!1b1!16s%2Fg%2F11n88nph87';
const WRITE='https://g.page/r/Cdj-DA4jaPrFEAE/review';
const cfg=window.LKM_CONFIG||{};
const configured=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'';
let cached,all=[],error=false,view='all',search='',shown=12;
function load(){if(cached)return cached;
 if(!configured){cached=fetch('/assets/lkm-v3/reviews-preview.json').then(r=>{if(!r.ok)throw Error('No preview data');return r.json()});return cached;}
 const uri=String(cfg.SUPABASE_URL).replace(/\/$/,'')+'/rest/v1/lkm_reviews?select=id,google_review_id,reviewer_name,rating,body_en,body_original,is_google_translation,edited_for_site,reviewed_at,owner_reply,visible,featured,sort_order,source,source_url&visible=eq.true&order=reviewed_at.desc&limit=500';
 cached=fetch(uri,{headers:{'apikey':cfg.SUPABASE_ANON_KEY,'Accept':'application/json'}}).then(r=>{if(!r.ok)throw Error('Review service unavailable: '+r.status);return r.json()});return cached;
}
function href(r){const url=String(r.source_url||GOOGLE);return /^https:\/\//i.test(url)?url:GOOGLE;}
function score(){const google=all.filter(r=>r.source==='google_takeout');const count=google.length,avg=count?google.reduce((s,r)=>s+Number(r.rating||0),0)/count:0;
 return {count,avg,written:google.filter(r=>String(r.body_en||'').trim()).length};}
function labelFor(r){return r.edited_for_site?'Edited for website':r.is_google_translation?'Translated by Google':(r.source==='google_takeout'||r.source==='google_manual')?'Google review':'Client review';}
function avatar(name){const letters=(name||'G').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();return esc(letters);}
function card(r,short=false){const body=String(r.body_en||'').trim();const reviewId=String(r.google_review_id||r.id||'').replace(/[^A-Za-z0-9_-]/g,'');
 return `<article class="lkm-review-card ${!body?'lkm-review-rating-only':''}" id="lkm-review-${reviewId}" aria-label="Review by ${esc(r.reviewer_name)}">
   <div class="lkm-review-card-top"><span class="lkm-review-stars" aria-label="${Number(r.rating)||0} out of 5 stars">${'★'.repeat(Math.min(5,Number(r.rating)||0))}</span><span class="lkm-review-date">${esc(date(r.reviewed_at))}</span></div>
   ${body?`<p class="lkm-review-quote ${short?'lkm-review-clamp':''}">${esc(body)}</p>`:'<p class="lkm-review-no-text">Star rating without a written comment.</p>'}
   <div class="lkm-review-author"><div class="lkm-review-avatar" aria-hidden="true">${avatar(r.reviewer_name)}</div><div><strong>${esc(r.reviewer_name)}</strong><small>${esc(labelFor(r))}</small></div></div>
   ${short?`<a class="lkm-review-read" href="/reviews.html#review-${reviewId}">Read full review <span aria-hidden="true">↗</span></a>`:
    `${r.owner_reply?`<details class="lkm-review-response"><summary>Response from LilKangooMedia</summary><p>${esc(r.owner_reply)}</p></details>`:''}
     ${(r.source==='google_takeout'||r.source==='google_manual')?`<a class="lkm-review-read" href="${esc(href(r))}" target="_blank" rel="noopener noreferrer">Google Maps <span aria-hidden="true">↗</span></a>`:''}`}
 </article>`;
}
function banner(prefix='Our clients'){const s=score();return `<div class="lkm-review-heading"><div><p class="lkm-review-eyebrow">REAL STORIES · REAL EXPERIENCE</p><h2>${prefix==='Our clients'?'Words that matter.':prefix}</h2><p>Customer ratings imported from our Google Business Profile. Reviews originally written in other languages are marked as translated.</p></div>
 <div class="lkm-review-rating"><div class="lkm-review-rating-number">${s.count?s.avg.toFixed(1):'—'}<span>/5</span></div><div class="lkm-review-stars" aria-label="Google reviews">★★★★★</div><small>${s.count?`${s.count} Google ratings in our imported archive`:'View reviews on Google Maps'}</small></div></div>`;}
function homeHtml(){if(error||!all.length)return `<div class="lkm-reviews-inner">${banner()}<p class="lkm-review-unavailable">Our review archive is temporarily unavailable. You can still see all reviews directly on Google.</p><div class="lkm-review-actions"><a href="${GOOGLE}" target="_blank" rel="noopener noreferrer" class="button button-dark">See Google reviews ↗</a></div></div>`;
 const written=all.filter(r=>String(r.body_en||'').trim());const sorted=written.slice().sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||(Number.isFinite(Number(a.sort_order))?Number(a.sort_order):100)-(Number.isFinite(Number(b.sort_order))?Number(b.sort_order):100)||String(b.reviewed_at).localeCompare(String(a.reviewed_at))); const picked=sorted.slice(0,12);
 return `<div class="lkm-reviews-inner">${banner()}<div class="lkm-reviews-carousel-controls"><span>From personal moments to brand collaborations</span><div class="lkm-reviews-nav"><button type="button" data-review-slide="prev" aria-label="Previous reviews">←</button><button type="button" data-review-slide="next" aria-label="Next reviews">→</button></div></div>
 <div class="lkm-reviews-carousel" id="lkmReviewsTrack" tabindex="0" aria-label="Customer reviews carousel">${picked.map(r=>card(r,true)).join('')}</div><div class="lkm-review-actions"><a href="/reviews.html" class="button button-dark">Explore all ${score().count} Google ratings ↗</a><a href="${WRITE}" target="_blank" rel="noopener noreferrer" class="button button-light">Leave a Google review ↗</a></div><p class="lkm-review-source">Source: Google Business Profile Takeout export. Not a live Google feed.</p></div>`;
}
function attachHome(){const root=document.getElementById('main');if(!root)return;
 const home=(!location.hash||location.hash==='#/'||location.hash==='#/home');if(!home)return;
 const anchor=root.querySelector('.portfolio-grid')?.closest('section');if(!anchor||root.querySelector('#lkmReviewsHome'))return;
 const el=document.createElement('section');el.id='lkmReviewsHome';el.className='lkm-reviews-section';el.setAttribute('aria-labelledby','lkmReviewsTitle');el.innerHTML=homeHtml();
 anchor.insertAdjacentElement('afterend',el);
 const h=el.querySelector('.lkm-review-heading h2');if(h)h.id='lkmReviewsTitle';
}
function initHome(){const root=document.getElementById('main');if(!root)return;
 let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;attachHome();});}).observe(root,{childList:true});
 attachHome();
 root.addEventListener('click',e=>{const btn=e.target.closest('[data-review-slide]');if(!btn)return;const track=root.querySelector('#lkmReviewsTrack');if(!track)return;const card=track.querySelector('.lkm-review-card');const step=(card?.getBoundingClientRect().width||310)+18;track.scrollBy({left:btn.dataset.reviewSlide==='next'?step:-step,behavior:'smooth'});});
}
function listData(){let r=all.filter(x=>view==='all'||(view==='written'?String(x.body_en||'').trim():!String(x.body_en||'').trim()));
 if(search){const q=search.toLocaleLowerCase();r=r.filter(x=>(x.reviewer_name+' '+x.body_en+' '+x.body_original).toLocaleLowerCase().includes(q));}
 return r;
}
function directory(){const root=document.getElementById('reviewsMain');if(!root)return;
 const s=score();let r=listData();const slice=r.slice(0,shown);
 root.innerHTML=`<div class="lkm-review-directory"><div class="lkm-review-dir-hero"><p class="lkm-review-eyebrow">LILKANGOOMEDIA · CUSTOMER FEEDBACK</p><h1>Every kind word.<br><em>Every shared experience.</em></h1><p>Reviews from our Google Business Profile, preserved with the original authors, dates and ratings.</p><div class="lkm-review-hero-stats"><div><strong>${s.count?s.avg.toFixed(1):'—'}/5</strong><span>Average Google rating in export</span></div><div><strong>${s.count}</strong><span>Google ratings</span></div><div><strong>${s.written}</strong><span>Written Google reviews</span></div></div><div class="lkm-review-actions"><a class="button button-dark" href="${GOOGLE}" target="_blank" rel="noopener noreferrer">See us on Google Maps ↗</a><a class="button button-light" href="${WRITE}" target="_blank" rel="noopener noreferrer">Write your review ↗</a></div></div>
 <div class="lkm-review-dir-tools"><div class="lkm-review-filter" role="group" aria-label="Filter reviews"><button data-review-filter="all" class="${view==='all'?'active':''}">All ratings (${all.length})</button><button data-review-filter="written" class="${view==='written'?'active':''}">With comments (${all.filter(x=>x.body_en?.trim()).length})</button><button data-review-filter="rating" class="${view==='rating'?'active':''}">Stars only</button></div><label><span>Search reviews</span><input type="search" id="lkmReviewSearch" placeholder="Name or keyword" value="${esc(search)}"></label></div>
 ${error?`<div class="lkm-review-empty">Our saved reviews could not be loaded. Visit Google Maps to read them.</div>`:!all.length?`<div class="lkm-review-empty">No reviews are published yet. Visit our Google Maps profile.</div>`:
  `<p class="lkm-review-count">Showing ${slice.length} of ${r.length} matching ratings</p><div class="lkm-review-directory-grid">${slice.map(x=>card(x,false)).join('')}</div>${slice.length<r.length?'<button type="button" class="lkm-review-more" id="lkmMoreReviews">Load more reviews ↓</button>':''}`}
 <p class="lkm-review-source">Google Takeout snapshot; not synchronized automatically. English text marked “Translated by Google” is supplied by Google; the original is preserved in our archive. Star-only reviews have no customer comment.</p></div>`;
 const target=(location.hash||'').match(/^#review-([A-Za-z0-9_-]+)$/)?.[1];if(target){const index=r.findIndex(x=>(x.google_review_id||x.id)===target);if(index>=shown){shown=Math.ceil((index+1)/12)*12;directory();return}const el=document.getElementById('lkm-review-'+target);if(el)requestAnimationFrame(()=>el.scrollIntoView({block:'center'}));}
}
function initDirectory(){const root=document.getElementById('reviewsMain');if(!root)return;
 root.addEventListener('click',e=>{const t=e.target.closest('[data-review-filter]');if(t){view=t.dataset.reviewFilter;shown=12;directory();return}if(e.target.closest('#lkmMoreReviews')){shown+=12;directory();}});
 root.addEventListener('input',e=>{if(e.target.id!=='lkmReviewSearch')return;search=e.target.value;shown=12;
 const prevPos=e.target.selectionStart;directory();const field=root.querySelector('#lkmReviewSearch');if(field){field.focus();field.setSelectionRange(prevPos,prevPos);}
 });
 window.addEventListener('hashchange',directory);
 directory();
}
function start(){initHome();initDirectory();load().then(rows=>{all=Array.isArray(rows)?rows.filter(x=>x.visible!==false):[];all.sort((a,b)=>String(b.reviewed_at||'').localeCompare(String(a.reviewed_at||'')));if(document.getElementById('main')){document.getElementById('lkmReviewsHome')?.remove();attachHome();}if(document.getElementById('reviewsMain'))directory();}).catch(e=>{error=true;console.warn('LilKangooMedia reviews could not be loaded',e);document.getElementById('lkmReviewsHome')?.remove();attachHome();if(document.getElementById('reviewsMain'))directory();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
