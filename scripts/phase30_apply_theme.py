#!/usr/bin/env python3
"""LilKangooMedia Phase 30.0 — safe PUBLIC build-time theme injection.

Invoked after build_articles.py and build_service_pages.py in netlify.toml.
Does not touch admin panels, client portal, payment/quotation pages, old
Mobirise pages or private data. Idempotent and supports --root for tests.
"""
from __future__ import annotations
import argparse
import re
from pathlib import Path

STYLE='/assets/lkm-v3/phase30-public.css?v=30-4'
SCRIPT='/assets/lkm-v3/phase30-public.js?v=31-2'
CSS_TAG=f'<link rel="stylesheet" href="{STYLE}" data-lkm30="theme">'
JS_TAG=f'<script defer src="{SCRIPT}" data-lkm30="navigation"></script>'
EXCLUDE_NAMES={'cms.html','client.html','proposal.html','shop.html','admin-legacy.html','admin.html','admin-crm.html','admin-quotes.html','admin-calendar.html','admin-reviews.html','admin-reports.html','admin-case-studies.html'}
PUBLIC_CSS_MARKERS=(
 '/assets/lkm-v3/site.css',
 '/assets/lkm-v3/article.css',
 '/assets/lkm-v3/service-seo.css',
)

def public_file(path:Path,root:Path,source:str)->bool:
    relative=path.relative_to(root)
    # Public entry pages only: top-level and build-generated SEO service pages.
    if len(relative.parts)>2:return False
    if len(relative.parts)==2 and relative.parts[0] not in ('services','blog'):return False
    if path.name.lower().startswith(('admin-','admin_')) or path.name.lower() in EXCLUDE_NAMES:return False
    if 'data-lkm30="theme"' in source:return True
    if '<body' not in source.lower() or '</head>' not in source.lower():return False
    return any(marker in source for marker in PUBLIC_CSS_MARKERS)

def add_class(match:re.Match[str])->str:
    tag=match.group(0)
    if re.search(r'\blkm30-public\b',tag,re.I):return tag
    existing=re.search(r'\bclass\s*=\s*(["\'])(.*?)\1',tag,re.I|re.S)
    if existing:
        return tag[:existing.start(2)]+existing.group(2)+' lkm30-public'+tag[existing.end(2):]
    return tag[:-1]+' class="lkm30-public">'

def patch(source:str)->str:
    changed=source
    if 'data-lkm30="theme"' in changed:
        # Update a checked-in older version of the theme instead of caching v=30-0.
        changed=re.sub(r'/assets/lkm-v3/phase30-public\.css(?:\?v=[\w.-]+)?',STYLE,changed,count=1)
    # Refresh JS cache too: old builds may still serve the 30.0 runtime.
    if 'data-lkm30="navigation"' in changed:
        changed=re.sub(r'/assets/lkm-v3/phase30-public\.js(?:\?v=[\w.-]+)?',SCRIPT,changed,count=1)
    if 'data-lkm30="theme"' not in changed:
        changed=re.sub(r'</head\s*>',CSS_TAG+'\n</head>',changed,count=1,flags=re.I)
    if 'data-lkm30="navigation"' not in changed:
        changed=re.sub(r'</head\s*>',JS_TAG+'\n</head>',changed,count=1,flags=re.I)
    changed=re.sub(r'<body\b[^>]*>',add_class,changed,count=1,flags=re.I)
    # About Us only: replace legacy LKM initials with the real official logo.
    # Source text remains intact until a successful Netlify build; idempotent.
    if 'lkm-about-standalone' in changed:
        changed=re.sub(
            r'<div class="lkm-about-hero-stamp" aria-hidden="true">\s*<span>LKM</span>\s*<small>CYPRUS<br>CREATIVE<br>STUDIO</small>\s*</div>',
            '<div class="lkm-about-hero-stamp" aria-hidden="true"><img src="/assets/lkm-v3/brand/logo-profile.png" alt="" width="117" height="117" loading="lazy"></div>',
            changed,count=1
        )
    # The real About page is already marked with lkm-about-standalone.
    if 'lkm-about-standalone' in changed:
        motion='<script defer src="/assets/lkm-v3/phase30-about.js?v=30-3" data-lkm30-about="motion"></script>'
        if 'data-lkm30-about="motion"' not in changed:
            changed=re.sub(r'</head\s*>',motion+'\n</head>',changed,count=1,flags=re.I)
    # Match graphite browser bar without changing canonical or SEO metadata.
    changed=re.sub(r'(<meta\s+name=["\']theme-color["\']\s+content=["\'])[#a-zA-Z0-9]+(["\'])',r'\g<1>#22201d\2',changed,count=1,flags=re.I)
    return changed

def apply(root:Path)->tuple[int,int,int]:
    if not (root/'assets/lkm-v3/phase30-public.css').is_file():
        raise RuntimeError('Missing assets/lkm-v3/phase30-public.css; copy all ZIP files before building')
    if not (root/'assets/lkm-v3/phase30-public.js').is_file():
        raise RuntimeError('Missing assets/lkm-v3/phase30-public.js; copy all ZIP files before building')
    # Correct case-only alias, as index.html points to /reviews.html while the
    # repository exposes Reviews.html. Never overwrite an existing target.
    upper=root/'Reviews.html'
    lower=root/'reviews.html'
    if upper.is_file() and not lower.exists():
        lower.write_bytes(upper.read_bytes())
    visited=changed=skipped=0
    for path in list(root.glob('*.html'))+list(root.glob('services/*.html'))+list(root.glob('blog/*.html')):
        visited+=1
        original=path.read_text(encoding='utf-8',errors='replace')
        if not public_file(path,root,original):skipped+=1;continue
        revised=patch(original)
        if revised!=original:
            path.write_text(revised,encoding='utf-8')
            changed+=1
    return visited,changed,skipped

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1],help='site repository root')
    args=parser.parse_args()
    try:
        root=args.root.resolve()
        visited,changed,skipped=apply(root)
    except (OSError,RuntimeError) as exc:
        print('LKM Phase 30: ERROR —',exc)
        return 1
    print(f'LKM Phase 30: checked {visited} HTML files, updated {changed}, skipped {skipped} legacy/private templates.')
    print('LKM Phase 30: no database, prices, forms, existing paths or server functions changed.')
    return 0

if __name__=='__main__':
    raise SystemExit(main())
