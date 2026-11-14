/* LilKangooMedia Phase 35.1: responsive image delivery, no source mutation.
 * Existing originals remain the source of truth. CDN failure restores originals.
 * Only site-owned public assets and this project's PUBLIC Supabase portfolio
 * bucket are eligible. No private/signed assets or YouTube previews are changed.
 */
(function () {
  'use strict';
  if (window.LKM35Images) return;
  var SUPABASE = 'nvronzbkvwyyllbuidhw.supabase.co';
  var WIDTHS = [320, 480, 720, 960, 1280, 1680];
  var QUALITY = 86;
  var DEFAULT_SIZES = '(max-width: 740px) 100vw, (max-width: 1200px) 50vw, 42vw';
  var HERO_SIZES = '(max-width: 740px) 100vw, 48vw';

  function sourceFor(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      var url = new URL(value, window.location.href);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      if (!/\.(?:jpe?g|png|webp|avif)(?:$|[?#])/i.test(url.pathname + url.search)) return '';
      if (url.origin === window.location.origin &&
          (url.pathname.startsWith('/assets/images/') ||
           url.pathname.startsWith('/assets/lkm-v3/preview/'))) {
        return url.pathname + url.search;
      }
      if (url.protocol === 'https:' && url.hostname === SUPABASE &&
          url.pathname.startsWith('/storage/v1/object/public/portfolio/')) {
        return url.href;
      }
    } catch (_) { /* leave the original intact */ }
    return '';
  }
  function imageUrl(value, width) {
    var source = sourceFor(value);
    if (!source) return '';
    var w = Number(width);
    if (!Number.isInteger(w) || w < 32 || w > 2500) return '';
    var params = new URLSearchParams();
    params.set('url', source);
    params.set('w', String(w));
    params.set('q', String(QUALITY));
    return '/.netlify/images?' + params.toString();
  }
  function srcset(value) {
    if (!sourceFor(value)) return '';
    return WIDTHS.map(function (w) { return imageUrl(value, w) + ' ' + w + 'w'; }).join(', ');
  }
  function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
  }
  function htmlAttrs(value, sizes) {
    var sources = srcset(value);
    if (!sources) return '';
    return 'srcset="' + escapeAttr(sources) + '" sizes="' +
      escapeAttr(sizes || (String(value).includes('/assets/images/wedding-6.jpeg') ? HERO_SIZES : DEFAULT_SIZES)) +
      '" data-lkm35-original="' + escapeAttr(value) + '"';
  }
  function recover(img) {
    if (!img || !img.dataset || !img.dataset.lkm35Original) return false;
    if (img.dataset.lkm35Retry === '1') return false;
    img.dataset.lkm35Retry = '1';
    var original = img.dataset.lkm35Original;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = original;
    return true;
  }
  function enhance(img, value, sizes) {
    if (!img || img.tagName !== 'IMG' || !sourceFor(value) || img.dataset.lkm35Applied) return false;
    img.dataset.lkm35Applied = '1';
    img.dataset.lkm35Original = value;
    img.addEventListener('error', function () { recover(img); });
    img.sizes = sizes || DEFAULT_SIZES;
    img.srcset = srcset(value);
    return true;
  }
  window.LKM35Images = Object.freeze({
    version: '35.1', sourceFor: sourceFor, url: imageUrl, srcset: srcset,
    htmlAttrs: htmlAttrs, recover: recover, enhance: enhance
  });
})();
