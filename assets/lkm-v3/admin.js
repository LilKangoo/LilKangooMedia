(function(){
'use strict';
const root=document.getElementById('adminRoot'),store=window.LKMStore,live=store.configured;
let services=[],leads=[],orders=[],picker=null,tab=(["services","leads","articles","galleries","media"].includes(location.hash.slice(1))?location.hash.slice(1):"services"),selected='',newMode=false,authorized=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:n%100?2:0}).format(n/100);
const banner=()=>live?'<div class="notice good">Changes to published services are reflected on the website.</div>':'<div class="notice">DEMO MODE. Your changes appear on the public preview only in this browser. They are NOT saved to Supabase or visible to customers on other devices. Configure <code>config.js</code> and the SQL schema to enable the real shared admin.</div>';
const input=(label,id,value='',type='text',extras='')=>`<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}" ${extras}></div>`;
const select=(label,id,items,val)=>`<div class="field"><label for="${id}">${label}</label><select id="${id}">${items.map(o=>`<option value="${esc(o[0])}" ${val===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;
const act=(name,buttonClass='button-dark')=>`<button class="button ${buttonClass}" type="button" data-admin="${name}">`;
const slugify=v=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
function show(msg){const x=document.getElementById('toast');x.textContent=msg;x.hidden=false;clearTimeout(x.t);x.t=setTimeout(()=>x.hidden=true,4500)}
function adminLogin(){root.innerHTML=`<div class="admin-auth"><img src="./assets/lkm-v3/brand/logo-black-orange.png" alt="LilKangooMedia" style="width:96px;height:96px;display:block;margin:0 auto 20px"><h1>Admin sign-in</h1><p style="color:var(--muted);margin-bottom:23px">Sign in with your Supabase Auth account. Only listed administrators can manage services.</p><form id="authForm">${input('Email address','authEmail','','email','required autocomplete="email"')}${input('Password','authPassword','','password','required autocomplete="current-password"')}<button class="button button-dark" type="submit" style="width:100%">Sign in securely</button></form><p id="authError" role="alert" style="color:#a53636"></p></div>`}
const bar=()=>`<aside class="admin-sidebar" aria-label="Administration sections">
  <div class="admin-nav-label">MANAGEMENT</div>
  <a class="${tab==='services'?'active':''}" href="#services" data-tab="services">▣ Services & pricing</a>
  <a class="${tab==='leads'?'active':''}" href="#leads" data-tab="leads">▤ Enquiries & bookings</a>
  <div class="admin-nav-label">CONTENT</div>
  <a class="${tab==='articles'?'active':''}" href="#articles" data-tab="articles">▤ Articles & SEO</a>
  <a class="${tab==='galleries'?'active':''}" href="#galleries" data-tab="galleries">▧ Portfolio & galleries</a>
  <a class="${tab==='media'?'active':''}" href="#media" data-tab="media">▦ Media library</a>
  <div class="admin-nav-label">PREVIEW</div>
  <a href="/blog.html" target="_blank" rel="noopener">↗ Public articles</a>
  <a href="/portfolio.html" target="_blank" rel="noopener">↗ Public portfolio</a>
  <a href="/" target="_blank" rel="noopener">↗ Website</a>
  <a href="#" data-admin="logout">⇥ ${live?'Sign out':'Reset preview'}</a>
</aside>`;
function getCurrent(){if(newMode)return {slug:'',title:'',audience:'business',category:'Photography',summary:'',description:'',cover_url:'',gallery_urls:[],packages:[],addons:[],booking_mode:'enquiry',deposit_percent:0,active:true,featured:false,sort_order:(services.length+1)*10};return services.find(x=>x.slug===selected)||services[0]}
const pkgRow=(p={},i=0)=>`<div class="package-editor" data-package-row><div class="package-editor-grid"><div class="field"><label>Package name</label><input data-pkg-name value="${esc(p.name||'')}"></div><div class="field"><label>Price (€)</label><input data-pkg-price type="number" min="0" step="0.01" value="${Number(p.price_cents||0)/100}"></div></div><div class="field"><label>Included / description</label><textarea data-pkg-desc rows="2">${esc(p.description||'')}</textarea></div><button type="button" class="button button-light" data-remove-package style="min-height:31px;padding:6px 11px">Remove package</button></div>`;
const thumbHtml=(url,index,canRemove=true)=>`<div class="lkm-service-thumb"><img src="${esc(url)}" alt="Service photograph" loading="lazy"><small title="${esc(url)}">${esc(url.split('/').pop().split('?')[0].replace(/%20/gi,' ').slice(0,36))}</small>${canRemove?`<button type="button" data-service-image-remove="${index}" aria-label="Remove image from service">Remove ×</button>`:''}</div>`;
function serviceThumbs(){
 const gallery=(root.querySelector('#svcGallery')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const current=root.querySelector('#svcCover')?.value.trim();const coverBox=root.querySelector('#svcCoverPreview');const galleryBox=root.querySelector('#svcGalleryPreview');
 if(coverBox)coverBox.innerHTML=current?thumbHtml(current,'cover',true):'<p class="hint">No cover selected.</p>';
 if(galleryBox)galleryBox.innerHTML=gallery.map((url,i)=>thumbHtml(url,i)).join('')||'<p class="hint">No gallery images selected.</p>';
}
let pickerSearch='',pickerGallery='all',pickerSource='galleries',pickerShow=60,pickerImages=[],pickerGalleries=[],pickerCatalog=[];
async function pickerFetch(){
 if(!live)throw new Error('Sign in to Supabase first.');
 const token=await store.authenticatedToken();const base=window.LKM_CONFIG.SUPABASE_URL.replace(/\/$/,'');
 const req=async path=>{const r=await fetch(base+'/rest/v1/'+path,{headers:{apikey:window.LKM_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+token}});if(!r.ok)throw new Error('Unable to load photos ('+r.status+')');return r.json()};
 const [g,photos]=await Promise.all([req('portfolio_galleries?select=id,title&limit=1000'),req('portfolio_images?select=image_url,gallery_id,alt_text&order=display_order.asc&limit=1000')]);
 pickerGalleries=g;pickerImages=photos;
}
function pickerResults(){
 if(!picker)return '';
 const query=pickerSearch.toLowerCase();
 const all=pickerSource==='galleries'?pickerImages.filter(x=>pickerGallery==='all'||x.gallery_id===pickerGallery).map(x=>({url:x.image_url,label:x.alt_text||x.image_url.split('/').pop()})):
  pickerCatalog.map(x=>({url:x.url,label:x.file}));
 const filtered=all.filter(x=>!query||(x.label||'').toLowerCase().includes(query)||x.url.toLowerCase().includes(query));
 return `<p class="hint">${filtered.length.toLocaleString()} available photos · choose a thumbnail to use it.</p><div class="lkm-picker-grid">${filtered.slice(0,pickerShow).map(x=>`<button type="button" data-pick-url="${esc(x.url)}" title="Choose ${esc(x.label)}"><img loading="lazy" src="${esc(x.url)}" alt="${esc(x.label)}"><small>${esc(x.label)}</small></button>`).join('')}</div>${filtered.length>pickerShow?'<button class="button button-light" type="button" data-picker-action="more">Load more photos</button>':''}`;
}
function pickerView(){
 if(!picker)return;
 const modal=document.getElementById('lkmServiceImagePicker');if(!modal)return;
 modal.innerHTML=`<div class="lkm-picker-dialog" role="dialog" aria-modal="true" aria-label="Choose service image">
 <div class="lkm-picker-head"><h2>Choose ${picker==='cover'?'cover photo':'gallery photos'}</h2><button type="button" data-picker-action="close" aria-label="Close">×</button></div>
 <div class="lkm-picker-controls"><label>Source<select id="pickerSource"><option value="galleries" ${pickerSource==='galleries'?'selected':''}>Portfolio galleries</option><option value="library" ${pickerSource==='library'?'selected':''}>Media Library (GitHub)</option></select></label>
 ${pickerSource==='galleries'?`<label>Gallery<select id="pickerGallery"><option value="all">All galleries</option>${pickerGalleries.map(x=>`<option value="${esc(x.id)}" ${pickerGallery===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`:''}
 <label>Search<input type="search" id="pickerSearch" placeholder="Search images" value="${esc(pickerSearch)}"></label></div>
 <div class="lkm-picker-results">${pickerResults()}</div></div>`;
}
async function openImagePicker(kind){
 picker=kind;pickerSearch='';pickerShow=60;pickerGallery='all';pickerSource='galleries';
 let modal=document.createElement('div');modal.id='lkmServiceImagePicker';modal.className='lkm-picker-overlay';root.appendChild(modal);
 modal.innerHTML='<div class="lkm-picker-dialog"><p>Loading available photographs…</p></div>';
 try{await pickerFetch();pickerView()}catch(err){modal.innerHTML=`<div class="lkm-picker-dialog"><p role="alert">${esc(err.message)}</p><button type="button" data-picker-action="close">Close</button></div>`}
}
function closeImagePicker(){document.getElementById('lkmServiceImagePicker')?.remove();picker=null}
function addPickedImage(url){if(picker==='cover'){root.querySelector('#svcCover').value=url}else{
 const textarea=root.querySelector('#svcGallery');const prev=textarea.value.split('\n').map(x=>x.trim()).filter(Boolean);if(!prev.includes(url))textarea.value=[...prev,url].join('\n');}
 serviceThumbs();show('Photo selected. Click Save changes to publish this service.');
}
const addonRow=(a={})=>`<div class="package-editor" data-addon-row><div class="package-editor-grid"><div class="field"><label>Optional extra</label><input data-addon-name value="${esc(a.name||'')}"></div><div class="field"><label>Extra price (€)</label><input data-addon-price type="number" min="0" step="0.01" value="${Number(a.price_cents||0)/100}"></div></div><button type="button" class="button button-light" data-remove-addon style="min-height:31px;padding:6px 11px">Remove extra</button></div>`;
function editor(){let x=getCurrent();return `<div class="panel admin-editor"><h3>${newMode?'Create new service':'Edit service'}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${input('Service name *','svcTitle',x?.title||'','text','required maxlength="120"')}${input('URL slug *','svcSlug',x?.slug||'','text','required maxlength="90"')}</div>${select('Customer category','svcAudience',[['personal','Personal'],['business','Business']],x?.audience||'business')}${select('Service category','svcCategory',['Photography','Videography','Wedding','Experiences','Events','Social Media','Design','Web Design','Business Setup','Marketing'].map(x=>[x,x]),x?.category||'Photography')}<div class="field"><label for="svcSummary">Short summary</label><textarea id="svcSummary" rows="2">${esc(x?.summary||'')}</textarea></div><div class="field"><label for="svcDescription">Full description</label><textarea id="svcDescription" rows="4">${esc(x?.description||'')}</textarea></div><div class="field"><label>Cover photograph</label><div id="svcCoverPreview" class="lkm-service-image-grid">${x?.cover_url?thumbHtml(x.cover_url,'cover'):''}</div><button type="button" class="button button-light" data-admin="pick-cover">Choose existing photo</button><details class="lkm-service-urls"><summary>Advanced: cover URL</summary><input id="svcCover" value="${esc(x?.cover_url||'')}"></details></div><div class="field"><label>Service gallery photographs</label><div id="svcGalleryPreview" class="lkm-service-image-grid">${(x?.gallery_urls||[]).map((url,i)=>thumbHtml(url,i)).join('')}</div><button type="button" class="button button-light" data-admin="pick-gallery">+ Add from existing photos</button><details class="lkm-service-urls"><summary>Advanced: gallery URLs</summary><textarea id="svcGallery" rows="4">${esc((x?.gallery_urls||[]).join('\n'))}</textarea></details></div>${live?`<div class="field"><label for="imageUpload">Upload image to Supabase Storage</label><input type="file" id="imageUpload" accept="image/jpeg,image/png,image/webp"><button class="button button-light" type="button" data-admin="upload" style="margin-top:10px">Upload to gallery</button><small>Uses authenticated admin account and private storage upload policy.</small></div>`:''}<hr><h3>Packages & prices</h3><p class="hint">Enter your current package prices. Leave packages empty when pricing is quoted individually.</p><div id="packagesEditor">${(x?.packages||[]).map(pkgRow).join('')}</div><button type="button" class="button button-light" data-admin="addpackage">+ Add package</button><hr><h3>Optional extras</h3><div id="addonsEditor">${(x?.addons||[]).map(addonRow).join('')}</div><button type="button" class="button button-light" data-admin="addaddon">+ Add extra</button><hr>${select('Booking behaviour','svcMode',[['enquiry','Enquiry only — no payment'],['deposit','Stripe deposit — availability pending confirmation'],['full','Stripe full payment — availability pending confirmation']],x?.booking_mode||'enquiry')}${input('Deposit percent (0–100)','svcDeposit',x?.deposit_percent||0,'number','min="0" max="100" step="1"')}${input('Display order','svcOrder',x?.sort_order||10,'number','step="1"')}<div class="field"><label><input id="svcFeatured" type="checkbox" ${x?.featured?'checked':''}> Feature on homepage</label></div><div class="field"><label><input id="svcActive" type="checkbox" ${x?.active!==false?'checked':''}> Published / visible</label></div><p class="notice">Changes to a published service will appear on the website. Online payments are available only after payment processing has been activated.</p><div class="form-actions"><button class="button button-dark" type="button" data-admin="save">${newMode?'Create service':'Save changes'}</button><button class="button button-light" type="button" data-admin="cancel">Cancel</button>${!newMode?`<button class="button button-light" type="button" data-admin="hide">Unpublish</button>`:''}</div><p id="editorStatus" role="alert" style="color:#a23e2f"></p></div>`}
function servicesView(){return `<div class="admin-header"><div><div class="label-kicker">LilKangooMedia</div><h1 style="font-size:34px;letter-spacing:-1.6px;margin:5px 0">Services & pricing</h1><p style="color:var(--muted);margin:0">Manage catalog cards, price packages, photography, videos and booking modes.</p></div><button class="button button-dark" data-admin="new">+ New service</button></div>${banner()}<div class="admin-list"><div>${services.map(x=>`<div class="admin-item"><img src="${esc(x.cover_url||'./assets/lkm-v3/preview/brand.jpg')}" alt="" onerror="this.onerror=null;this.src='./assets/lkm-v3/preview/brand.jpg'"><div class="grow"><strong>${esc(x.title)}</strong><small>${esc(x.audience)} · ${esc(x.category)} · ${x.active===false?'Hidden':(x.packages||[]).length?'From '+money(Math.min(...x.packages.map(p=>p.price_cents))):'Quote only'}</small></div><button data-select="${esc(x.slug)}">Edit</button></div>`).join('')}</div>${editor()}</div>`}
function leadsView(){return `<div class="admin-header"><div><div class="label-kicker">Customer requests</div><h1 style="font-size:34px;letter-spacing:-1.6px;margin:5px 0">Enquiries & bookings</h1><p style="color:var(--muted)">Requests saved by the secure server endpoint.</p></div><button class="button button-light" data-admin="refresh">Refresh</button></div>${banner()}${live&&orders.length?`<div class="subhead" style="margin-top:25px">Stripe payment requests (${orders.length})</div>${orders.map(o=>`<article class="panel" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h3>${esc(o.customer_name||o.customer_email)}</h3><span class="feature-label">${esc(o.status||'paid')}</span></div><p>${esc(o.service_slug)} / ${esc(o.package_id)}</p><div class="estimate-row"><span>Amount paid</span><strong>${money(o.paid_amount_cents||0)}</strong></div><div class="estimate-row"><span>Preferred date</span><strong>${esc(o.preferred_date||'Not supplied')}</strong></div><div class="hint">${esc(o.customer_email)}</div></article>`).join('')}`:''}${!live?'<div class="notice">Demo mode cannot receive real leads. Configure the backend and its API keys first.</div>':leads.length?leads.map(l=>`<article class="panel" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3>${esc(l.customer_name||'Unknown customer')}</h3><span class="feature-label">${esc(l.status||'new')}</span></div><p><a href="mailto:${esc(l.customer_email)}" style="text-decoration:underline">${esc(l.customer_email)}</a> · ${esc(l.service_slug||l.service_type||'General enquiry')}</p><p class="hint">${esc(l.created_at||'')}</p><p style="margin-top:13px;white-space:pre-wrap">${esc(l.message||'')}</p></article>`).join(''):'<div class="status-empty">No customer enquiries found.</div>'}`}
function dashboard(){
  const cms=document.getElementById('cmsRoot');
  // Keep the CMS DOM alive across sidebar changes; never lose its listeners or unsaved inputs by destroying its root.
  if(cms&&root.contains(cms)){
    cms.hidden=true;
    const toast=document.getElementById('toast');
    document.body.insertBefore(cms,toast||null);
  }
  const cmsTab=['articles','galleries','media'].includes(tab);
  root.innerHTML=`<div class="admin-shell">${bar()}<section class="admin-main">${cmsTab?'<div id="cmsMount"></div>':tab==='services'?servicesView():leadsView()}</section></div>`;
  if(cmsTab){
    if(!cms){show('Content module missing. Please deploy cms.js.');return;}
    root.querySelector('#cmsMount').appendChild(cms);
    cms.hidden=false;
    if(window.LKMCMS){window.LKMCMS.setTab(tab==='articles'?'posts':tab).catch(e=>show('Content module: '+e.message));}
    else show('CMS module not loaded. Check the browser console.');
  }
}
async function refresh(){services=await store.adminServices();if(!selected)selected=services[0]?.slug||'';if(live){leads=await store.getLeads();orders=await store.getOrders()}dashboard()}
function collect(){const get=id=>root.querySelector('#'+id);let title=get('svcTitle').value.trim(),slug=slugify(get('svcSlug').value||title);if(!title||!slug)throw new Error('Service name and slug are required.');let packages=[...root.querySelectorAll('[data-package-row]')].map((el,i)=>{let name=el.querySelector('[data-pkg-name]').value.trim(),val=Number(el.querySelector('[data-pkg-price]').value);if(!name||!Number.isFinite(val)||val<0)throw new Error('Fill in each package name and valid non-negative price.');return {id:slugify(name)||'package-'+i,name,price_cents:Math.round(val*100),description:el.querySelector('[data-pkg-desc]').value.trim()}});let addons=[...root.querySelectorAll('[data-addon-row]')].map((el,i)=>{let name=el.querySelector('[data-addon-name]').value.trim(),val=Number(el.querySelector('[data-addon-price]').value);if(!name||!Number.isFinite(val)||val<0)throw new Error('Each extra requires a name and valid price.');return {id:slugify(name)||'extra-'+i,name,price_cents:Math.round(val*100)}});let mode=get('svcMode').value,deposit=Number(get('svcDeposit').value||0);if(mode==='deposit'&&(deposit<=0||deposit>100))throw new Error('Deposit percentage must be between 1 and 100 for deposit bookings.');return {slug,title,audience:get('svcAudience').value,category:get('svcCategory').value,summary:get('svcSummary').value.trim(),description:get('svcDescription').value.trim(),cover_url:get('svcCover').value.trim(),gallery_urls:get('svcGallery').value.split('\n').map(t=>t.trim()).filter(Boolean),packages,addons,booking_mode:mode,deposit_percent:deposit,sort_order:Number(get('svcOrder').value)||10,active:get('svcActive').checked,featured:get('svcFeatured').checked}}
async function upload(){if(!live)return;let input=root.querySelector('#imageUpload'),file=input?.files?.[0];if(!file)return show('Select an image.');if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)return show('Use JPEG, PNG or WebP under 8 MB.');let slug=slugify(root.querySelector('#svcSlug').value)||'media';let key=slug+'/'+Date.now()+'-'+slugify(file.name.replace(/\.[^.]+$/,''))+'.'+file.name.split('.').pop().toLowerCase();let jwt=await store.authenticatedToken();let base=window.LKM_CONFIG.SUPABASE_URL.replace(/\/$/,'');let r=await fetch(base+'/storage/v1/object/portfolio/'+key,{method:'POST',headers:{apikey:window.LKM_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt,'Content-Type':file.type,'x-upsert':'false'},body:file});if(!r.ok)throw new Error((await r.text()).slice(0,200));let url=base+'/storage/v1/object/public/portfolio/'+key;
 try{
   let width=null,height=null;
   try{const im=await createImageBitmap(file);width=im.width;height=im.height;im.close()}catch{}
   const saved=await fetch(base+'/rest/v1/portfolio_images',{method:'POST',headers:{apikey:window.LKM_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({gallery_id:null,image_url:url,visibility:'review',alt_text:file.name.replace(/[-_]/g,' ').slice(0,150),storage_path:key,file_size_bytes:file.size,image_width:width,image_height:height})});
   if(!saved.ok)throw new Error('Media registration failed ('+saved.status+'): '+(await saved.text()).slice(0,180));
 }catch(err){show('Uploaded to Storage but not registered: '+err.message);return}
 let x=root.querySelector('#svcGallery');x.value+=(x.value.trim()?'\n':'')+url;if(!root.querySelector('#svcCover').value.trim())root.querySelector('#svcCover').value=url;serviceThumbs();show('Photo uploaded. Click Save changes to publish.');}
root.addEventListener('submit',async e=>{if(e.target.id!=='authForm')return;e.preventDefault();root.querySelector('#authError').textContent='';try{await store.login(root.querySelector('#authEmail').value.trim(),root.querySelector('#authPassword').value);if(!await store.isAdmin())throw new Error('This account is not listed in admin_users.');authorized=true;await refresh()}catch(err){store.logout();root.querySelector('#authError').textContent=err.message}});
root.addEventListener('change',e=>{
 if(e.target.id==='pickerSource'){pickerSource=e.target.value;pickerShow=60;if(pickerSource==='library'&&!pickerCatalog.length){fetch('/api/media-catalog').then(r=>r.json()).then(r=>{pickerCatalog=r.images||[];pickerView()}).catch(err=>show('Could not load library: '+err.message))}pickerView()}
 if(e.target.id==='pickerGallery'){pickerGallery=e.target.value;pickerShow=60;pickerView()}
});
root.addEventListener('input',e=>{if(e.target.id==='pickerSearch'){pickerSearch=e.target.value;pickerShow=60;const area=root.querySelector('.lkm-picker-results');if(area)area.innerHTML=pickerResults()}
 if(e.target.id==='svcCover'||e.target.id==='svcGallery')serviceThumbs();});
root.addEventListener('click',async e=>{
 const modalAction=e.target.closest('[data-picker-action]');if(modalAction){if(modalAction.dataset.pickerAction==='close')closeImagePicker();if(modalAction.dataset.pickerAction==='more'){pickerShow+=60;pickerView()}return}
 const chosen=e.target.closest('[data-pick-url]');if(chosen){addPickedImage(chosen.dataset.pickUrl);if(picker==='cover')closeImagePicker();return}
 const remove=e.target.closest('[data-service-image-remove]');if(remove){let i=remove.dataset.serviceImageRemove;if(i==='cover'){root.querySelector('#svcCover').value=''}else{let area=root.querySelector('#svcGallery');let urls=area.value.split('\n').map(x=>x.trim()).filter(Boolean);urls.splice(Number(i),1);area.value=urls.join('\n')};serviceThumbs();return}
 const item=e.target.closest('[data-select]');if(item){selected=item.dataset.select;newMode=false;dashboard();return}
 const t=e.target.closest('[data-tab]');if(t){e.preventDefault();if(!authorized&&live)return;tab=t.dataset.tab;location.hash=tab;dashboard();return}
 if(e.target.closest('[data-remove-package]')){e.target.closest('[data-package-row]').remove();return}
 if(e.target.closest('[data-remove-addon]')){e.target.closest('[data-addon-row]').remove();return}
 const btn=e.target.closest('[data-admin]');if(!btn)return;
 try{switch(btn.dataset.admin){case 'new':newMode=true;dashboard();break;
 case 'cancel':newMode=false;dashboard();break;
 case 'addpackage':root.querySelector('#packagesEditor').insertAdjacentHTML('beforeend',pkgRow({}));break;
 case 'addaddon':root.querySelector('#addonsEditor').insertAdjacentHTML('beforeend',addonRow({}));break;
 case 'save':{let obj=collect(),old=newMode?null:selected;if(!newMode&&old!==obj.slug&&services.some(x=>x.slug===obj.slug))throw new Error('This slug is already in use.');btn.disabled=true;btn.textContent='Saving...';await store.saveService(obj,old);selected=obj.slug;newMode=false;await refresh();show('Saved. Changes '+(live?'are visible on the website.':'are saved in this browser.'));break}
 case 'hide':{if(!confirm('Unpublish this service? Existing leads will not be deleted.'))return;await store.deleteService(selected);await refresh();show('Service unpublished.');break}
 case 'refresh':await refresh();break;
 case 'upload':await upload();break;
 case 'pick-cover':await openImagePicker('cover');break;
 case 'pick-gallery':await openImagePicker('gallery');break;
 case 'logout':store.logout();if(live){authorized=false;const cms=document.getElementById('cmsRoot');if(cms){cms.hidden=true;if(root.contains(cms))document.body.insertBefore(cms,document.getElementById('toast')||null);cms.textContent='';}adminLogin()}else{localStorage.removeItem('LKM_V3_DEMO_SERVICES');window.location.reload()}break;
 }}catch(err){let status=root.querySelector('#editorStatus');if(status)status.textContent=err.message;else show('Operation failed: '+err.message);if(btn){btn.disabled=false;btn.textContent=btn.dataset.admin==='save'?'Save changes':btn.textContent}}
});
(async()=>{if(!live){authorized=true;if(['articles','galleries','media'].includes(tab))tab='services';await refresh();return}if(store.getSession()){try{authorized=await store.isAdmin();if(authorized){await refresh();return}}catch(e){console.warn(e)}}adminLogin()})();
})();
