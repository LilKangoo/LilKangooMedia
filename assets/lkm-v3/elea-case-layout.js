/* Additive Elea Golf Club case-study media layout: 2 films first, photographs below. */
(()=>{'use strict';
 const root=document.getElementById('lkmCasesPublic');if(!root||window.__LKM_ELEA_LAYOUT)return;
 window.__LKM_ELEA_LAYOUT=true;
 const order=['y1CB22Z-Qm4','kU3ACgDkxDo'],known=new Set(order);
 let queued=false;
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const active=()=>{try{return decodeURIComponent(location.hash.replace(/^#\/?/,''))==='elea-golf-club'}catch{return false}};
 const videoId=a=>{try{const u=new URL(a.href);if(!['youtube.com','www.youtube.com'].includes(u.hostname))return '';const id=u.searchParams.get('v')||'';return known.has(id)?id:''}catch{return ''}};
 function videoCard(a){const id=videoId(a);if(!id)return a;
  const short=id==='kU3ACgDkxDo',title=short?'Eléa Golf Club — Social Media Short':'Eléa Golf Club — Complete 18-Hole Flyover';
  const card=node('article','lkm-elea-film-card'),button=node('button','lkm-elea-film-poster');button.type='button';button.setAttribute('aria-label','Play '+title);
  const img=node('img');img.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';img.alt=title;img.loading='lazy';button.append(img,node('span','lkm-elea-play','▶ Play video'));
  const caption=node('div','lkm-elea-film-caption'),link=node('a','','Watch on YouTube ↗');link.href=short?'https://www.youtube.com/shorts/'+id:'https://www.youtube.com/watch?v='+id;link.target='_blank';link.rel='noopener noreferrer';
  caption.append(node('strong','',title),link);card.append(button,caption);
  button.addEventListener('click',()=>{const player=node('div','lkm-elea-player'+(short?' is-short':'')),iframe=node('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1';iframe.title=title;iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';player.append(iframe);button.replaceWith(player)},{once:true});
  return card;
 }
 function enhance(){if(!active())return;const region=root.querySelector('.lkm-case-visuals');if(!region||region.dataset.eleaLayoutDone==='yes')return;
  const original=region.querySelector('.lkm-case-media-grid');if(!original)return;
  const anchors=Array.from(original.children),videos=anchors.filter(a=>a.matches?.('a.lkm-case-video')&&videoId(a));if(!videos.length)return;
  region.dataset.eleaLayoutDone='yes';region.classList.add('lkm-elea-visuals');const title=region.querySelector(':scope > h2');if(title)title.textContent='Project films & selected photography';
  const films=node('section','lkm-elea-films'),filmGrid=node('div','lkm-elea-film-grid');films.append(node('h3','','Featured films'));
  for(const id of order){const video=videos.find(x=>videoId(x)===id);if(video)filmGrid.append(videoCard(video))}films.append(filmGrid);
  const photos=node('section','lkm-elea-photos'),remaining=anchors.filter(a=>!videos.includes(a));if(remaining.length){photos.append(node('h3','','Selected photographs'));const grid=node('div','lkm-elea-photo-grid');remaining.forEach(x=>grid.append(x));photos.append(grid)}
  original.replaceWith(films,photos);
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);schedule();
})();
