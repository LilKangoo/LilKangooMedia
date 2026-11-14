#!/usr/bin/env python3
"""Add safe responsive image delivery to the *deployed* output.

Run last in Netlify's build command. Project source files remain unchanged in
Git; the build workspace gets tiny, guarded, idempotent patches to image calls.
The original JPG/PNG/WebP in assets and Supabase is never edited/deleted.
Any unexpected upstream-code change stops deployment before a broken release.
"""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
TAG = '<script defer src="/assets/lkm-v3/phase35-images.js?v=35-1"></script>'


def replace_once(relative: str, before: str, after: str) -> None:
    path = ROOT / relative
    text = path.read_text(encoding='utf-8')
    if after in text:
        return
    count = text.count(before)
    if count != 1:
        raise RuntimeError(f'{relative}: expected exactly one verified anchor, got {count}. '
                           'Stop to avoid damaging a modified site.')
    path.write_text(text.replace(before, after, 1), encoding='utf-8')
    print('  patched', relative)


def add_head_loader(relative: str) -> None:
    path = ROOT / relative
    content = path.read_text(encoding='utf-8')
    if TAG in content:
        return
    start = content.lower().find('<head>')
    if start < 0 or content.lower().find('</head>') < start:
        raise RuntimeError(relative + ': missing head tag')
    pos = start + len('<head>')
    path.write_text(content[:pos] + '\n' + TAG + '\n' + content[pos:], encoding='utf-8')
    print('  loader', relative)


def main() -> None:
    print('[LKM Phase 35.1] Netlify Image CDN responsive delivery')
    if not (ROOT / 'assets/lkm-v3/phase35-images.js').is_file():
        raise RuntimeError('Image delivery helper missing. Copy both folders from ZIP.')

    # HTML loader placed FIRST among the deferred scripts, including admin.
    for name in ('index.html', 'home.html', 'portfolio.html', 'blog.html', 'admin.html'):
        add_head_loader(name)

    # In the SPA all Home and service card <img> elements are emitted by this
    # shared helper. Preserve native src, alt, and existing preview fallback.
    before = '''const img=(src,alt,fb='',cl='',lazy=true)=>`<img ${cl?'class="'+cl+'"':''} src="${esc(src||fb)}" alt="${esc(alt)}" ${lazy?'loading="lazy"':''} onerror="this.onerror=null;this.src='${esc(fb||'./assets/lkm-v3/preview/brand.jpg')}'">`;'''
    after = '''const img=(src,alt,fb='',cl='',lazy=true)=>{
 const original=src||fb;
 const responsive=window.LKM35Images?.htmlAttrs(original)||'';
 const priority=!lazy&&original==='/assets/images/wedding-6.jpeg'?'fetchpriority="high"':'';
 return `<img ${cl?'class="'+cl+'"':''} src="${esc(original)}" ${responsive} alt="${esc(alt)}" ${lazy?'loading="lazy"':''} ${priority} onerror="if(this.dataset.lkm35Original && this.dataset.lkm35Retry!=='1'){window.LKM35Images.recover(this)}else{this.onerror=null;this.src='${esc(fb||'./assets/lkm-v3/preview/brand.jpg')}' }">`;
};'''
    replace_once('assets/lkm-v3/site.js', before, after)

    # Avoid preloading the 2-4 MB full JPG while the rendered <img> requests
    # a lightweight variant. The browser selects the same srcset candidate.
    preload_before = "heroPreload.href = '/assets/images/wedding-6.jpeg';"
    preload_after = '''heroPreload.href = '/.netlify/images?url=%2Fassets%2Fimages%2Fwedding-6.jpeg&w=960&q=86';
    heroPreload.setAttribute('imagesrcset', [320,480,720,960,1280,1680].map(w => '/.netlify/images?url=%2Fassets%2Fimages%2Fwedding-6.jpeg&w='+w+'&q=86 '+w+'w').join(', '));
    heroPreload.setAttribute('imagesizes', '(max-width: 740px) 100vw, 48vw');'''
    for html in ('index.html', 'home.html'):
        replace_once(html, preload_before, preload_after)

    # Public portfolio image helper. No changes to click/lightbox behaviour.
    replace_once('assets/lkm-v3/cms-public.js',
        '''const img=(url,alt,cl='')=>safeImage(url)?`<img class="${cl}" src="${esc(url)}" alt="${esc(alt)}" loading="lazy">`:'';''',
        '''const img=(url,alt,cl='')=>safeImage(url)?`<img class="${cl}" src="${esc(url)}" ${window.LKM35Images?.htmlAttrs(url,'(max-width:740px) 90vw, 34vw')||''} alt="${esc(alt)}" loading="lazy" onerror="window.LKM35Images?.recover(this)">`:'';''')

    # Homepage's curated stories and services' related-work cards.
    replace_once('assets/lkm-v3/phase31-public.js',
        "img.src=media.src;img.alt=media.alt;img.loading='lazy';img.decoding='async';",
        "window.LKM35Images?.enhance(img,media.src,'(max-width:740px) 90vw, 40vw');img.src=media.src;img.alt=media.alt;img.loading='lazy';img.decoding='async';")
    replace_once('assets/lkm-v3/phase31-public.js',
        "img.src=g.media.src;img.alt=g.media.alt;img.loading='lazy';",
        "window.LKM35Images?.enhance(img,g.media.src,'(max-width:740px) 90vw, 32vw');img.src=g.media.src;img.alt=g.media.alt;img.loading='lazy';")

    # Case Study index and the cover image at the top of each story.
    replace_once('assets/lkm-v3/portfolio-stories.mjs',
        "img.src=media.image;img.alt=media.alt;img.loading='lazy';img.decoding='async';",
        "window.LKM35Images?.enhance(img,media.image,'(max-width:740px) 90vw, 36vw');img.src=media.image;img.alt=media.alt;img.loading='lazy';img.decoding='async';")
    replace_once('assets/lkm-v3/portfolio-stories.mjs',
        "image.src=media.image;image.alt=media.alt;image.decoding='async';",
        "window.LKM35Images?.enhance(image,media.image,'(max-width:740px) 100vw, 55vw');image.src=media.image;image.alt=media.alt;image.decoding='async';")

    # Master Media Library displays small previews using source originals today.
    # Keep upload byte stream, storage path, metadata and click actions intact.
    replace_once('assets/lkm-v3/studio.mjs',
        '''return url?`<img loading="lazy" src="${h(url)}" alt="${h(a.alt_text||a.title||'Portfolio media')}">`:'<div class="studio-asset-placeholder">▣</div>'}''',
        '''return url?`<img loading="lazy" src="${h(url)}" ${window.LKM35Images?.htmlAttrs(url,'(max-width:740px) 45vw, 200px')||''} alt="${h(a.alt_text||a.title||'Portfolio media')}" onerror="window.LKM35Images?.recover(this)">`:'<div class="studio-asset-placeholder">▣</div>'}''')

    print('[LKM Phase 35.1] Success. Original URLs and upload files untouched.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError) as exc:
        print('IMAGE OPTIMIZATION ABORTED:', exc, file=sys.stderr)
        sys.exit(1)
