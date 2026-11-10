/* Phase 22.1 — editorial guidance in the EXISTING gallery manager.
 * Uses the CMS's built-in Related service selection; no new fields or DB writes.
 */
(() => {
  'use strict';
  if (window.__lkm22GalleryGuideLoaded) return;
  window.__lkm22GalleryGuideLoaded = true;
  const root = document.getElementById('cmsRoot');
  if (!root) return;
  let queued = false;
  function enhance() {
    const select = root.querySelector('#galService');
    if (!select || select.dataset.lkm22Guide) return;
    select.dataset.lkm22Guide = '1';
    const help = document.createElement('div');
    help.className = 'lkm22-editor-hint';
    help.style.cssText = 'background:#f5f6f2;border:1px solid #dfe3d8;padding:12px 14px;margin:9px 0 15px;border-radius:9px;color:#3a4337;font-size:13px;line-height:1.5';
    const note = document.createElement('p');
    note.style.margin='0 0 6px';
    note.textContent = 'Portfolio → service: choose a Related service, set the gallery to Public, and publish at least one photo or video. The project will then appear on that service page automatically.';
    const preview = document.createElement('a');
    preview.textContent = 'Preview linked service ↗';
    preview.target = '_blank';
    preview.rel = 'noopener noreferrer';
    preview.style.cssText='font-weight:700;color:#a34a20;text-decoration:underline';
    const refresh = () => {
      const slug = select.value;
      preview.hidden = !/^[a-z0-9-]{1,90}$/.test(slug || '');
      preview.href = preview.hidden ? '#' : '/#/service/' + encodeURIComponent(slug);
    };
    select.addEventListener('change', refresh);
    refresh();
    help.append(note, preview);
    select.closest('.cms-field')?.insertAdjacentElement('afterend', help);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
  new MutationObserver(schedule).observe(root,{childList:true});
  schedule();
})();
