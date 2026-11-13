#!/usr/bin/env python3
"""LilKangooMedia 32.2: pre-render crawler-readable share pages at build time.

This runs AFTER the existing article, service and public-theme builders.
It reads only public Supabase records; never needs admin/service-role credentials.
All share endpoints are plain HTML files in Netlify's published directory,
not runtime functions. A deploy is rejected if the public catalogue is unavailable.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://lilkangoomedia.com'
FALLBACK_IMG = SITE + '/assets/images/home-meta.jpg'
SLUG = re.compile(r'^[a-z0-9][a-z0-9_-]{0,119}$', re.I)

PAGES = {
    'home': ('/', 'LilKangooMedia | Photography, Film & Digital Creative Services', 'Photography, videography, branding, websites and marketing services for people and businesses across Cyprus.', '/assets/images/home-meta.jpg'),
    'services': ('/#/services', 'Creative Services & Pricing | LilKangooMedia', 'Explore photography, video production, branding, website development and digital marketing services.', '/assets/images/home-meta.jpg'),
    'personal': ('/#/services?audience=personal', 'Personal Photography & Video Experiences | LilKangooMedia', 'Discover portraits, engagements, weddings, family photography and private creative experiences across Cyprus.', '/assets/images/portrait-15.jpg'),
    'business': ('/#/services?audience=business', 'Business Photography, Film & Digital Solutions | LilKangooMedia', 'Commercial photography, video, creative design, websites, social media and marketing services for businesses.', '/assets/images/orofino-4.jpg'),
    'about': ('/#/about', 'About LilKangooMedia | Meet the Creative Team', 'Meet the creative team behind LilKangooMedia in Cyprus and discover photography, film, design and digital development.', '/assets/images/home-meta.jpg'),
    'portfolio': ('/portfolio.html', 'Portfolio & Project Stories | LilKangooMedia', 'Explore photography, film, design and real collaborations from LilKangooMedia.', '/assets/images/orofino-4.jpg'),
    'articles': ('/blog.html', 'Photography & Cyprus Articles | LilKangooMedia', 'Photography education, creative business insights and Cyprus travel guides from LilKangooMedia.', '/assets/images/home-meta.jpg'),
    'reviews': ('/reviews.html', 'Customer Reviews | LilKangooMedia', 'Read customer feedback about LilKangooMedia photography and creative services in Cyprus.', '/assets/images/home-meta.jpg'),
    'contact': ('/#/contact', 'Contact LilKangooMedia | Start Your Project', 'Discuss photography, filmmaking, branding, websites or marketing projects with LilKangooMedia in Cyprus.', '/assets/images/home-meta.jpg'),
    'faq': ('/FAQ.html', 'Frequently Asked Questions | LilKangooMedia', 'Common questions about LilKangooMedia photography and creative services.', '/assets/images/home-meta.jpg')
}
SOCIALS = {
    'google-reviews': ('https://www.google.com/maps/place/LilKangooMedia/@35.1688,33.4252,9z/data=!4m8!3m7!1s0x14e083213d8d68e1:0xc5fa68230e0cfed8!8m2!3d35.1688!4d33.4252!9m1!1b1!16s%2Fg%2F11n88nph87','LilKangooMedia | Google Reviews','Read customer reviews on the official LilKangooMedia Google Business Profile.'),
    'leave-google-review': ('https://g.page/r/Cdj-DA4jaPrFEAE/review','Review LilKangooMedia on Google','Share your experience with LilKangooMedia on Google.'),
    'whatsapp': ('https://wa.me/35799005924','LilKangooMedia | WhatsApp','Contact LilKangooMedia on WhatsApp about creative services in Cyprus.'),
    'instagram': ('https://www.instagram.com/lilkangoomedia','LilKangooMedia | Instagram','Explore photography, filmmaking and content by LilKangooMedia on Instagram.'),
    'facebook': ('https://www.facebook.com/Lilkangoomedia/','LilKangooMedia | Facebook','Follow LilKangooMedia on Facebook for creative projects and updates.'),
    'youtube': ('https://www.youtube.com/channel/UCgIrKPHFpPy6srhdq4SjEtw','LilKangooMedia | YouTube','Watch films and creative videos from LilKangooMedia on YouTube.')
}


def clean(value):
    return ' '.join(re.sub(r'<[^>]*>', ' ', str(value or '')).split())


def clip(value, limit):
    txt = clean(value)
    if len(txt) <= limit:
        return txt
    return txt[:limit].rsplit(' ', 1)[0].rstrip() + '…'


def image_url(value):
    if not isinstance(value, str) or not value.strip() or re.search(r'[\s<>"\']', value):
        return ''
    try:
        url = urllib.parse.urljoin(SITE, value)
        p = urllib.parse.urlparse(url)
        return url if p.scheme == 'https' and p.hostname and not p.username and not p.password else ''
    except ValueError:
        return ''


def local_link(value):
    if not isinstance(value, str) or not value.startswith('/') or value.startswith('//') or '..' in value or re.search(r'[<>"\'\\]', value):
        return ''
    return SITE + value


def public_config():
    url = os.getenv('SUPABASE_URL', '').rstrip('/')
    key = os.getenv('SUPABASE_PUBLISHABLE_KEY', '') or os.getenv('SUPABASE_ANON_KEY', '')
    if not (url and key):
        cfg = (ROOT / 'lkm-config.js').read_text(encoding='utf-8')
        for name in ('SUPABASE_URL', 'SUPABASE_ANON_KEY'):
            match = re.search(r'\b' + name + r'\s*:\s*["\']([^"\']+)', cfg)
            if match:
                if name == 'SUPABASE_URL' and not url: url = match.group(1).rstrip('/')
                if name == 'SUPABASE_ANON_KEY' and not key: key = match.group(1)
    if not url.startswith('https://') and os.getenv('LKM_SHARE_TEST_MODE') != '1':
        raise RuntimeError('Valid public Supabase URL is required for share pages.')
    if not key:
        raise RuntimeError('Public Supabase publishable/anon key is required for share pages.')
    return url, key


def api_rows(table, select, filters=()):
    """Read paginated publicly visible records; failures stop the deploy."""
    url, key = public_config()
    data = []
    for offset in range(0, 10000, 500):
        params = [('select', select), ('limit', '500'), ('offset', str(offset))]
        params += list(filters)
        address = url + '/rest/v1/' + table + '?' + urllib.parse.urlencode(params, safe='.,*()')
        request = urllib.request.Request(address, headers={'apikey': key, 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=18) as response:
                batch = json.load(response)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
            raise RuntimeError(f'Cannot fetch public {table}; Netlify deploy stopped instead of publishing broken previews: {error}') from error
        if not isinstance(batch, list):
            raise RuntimeError(f'Unexpected public {table} API response, refusing incomplete previews.')
        data.extend(batch)
        if len(batch) < 500:
            return data
    raise RuntimeError(f'Too many public {table} rows for the configured build limit.')


def image_for_gallery(gallery, images, videos):
    imgs = images.get(gallery['id'], [])
    preferred = next((i for i in imgs if i['id'] == gallery.get('cover_image_id')), None)
    chosen = preferred or (imgs[0] if imgs else None)
    result = image_url((chosen or {}).get('image_url'))
    if result:
        return result
    vid = next((v for v in videos.get(gallery['id'], []) if re.fullmatch(r'[A-Za-z0-9_-]{11}', str(v.get('youtube_id') or ''))), None)
    if vid:
        return 'https://i.ytimg.com/vi/' + vid['youtube_id'] + '/hqdefault.jpg'
    return FALLBACK_IMG


def render(kind, slug, item, prefix="share/v2"):
    title = clip(item['title'], 180) or 'LilKangooMedia'
    description = clip(item.get('description'), 250) or 'Photography, filmmaking and creative services across Cyprus.'
    image = image_url(item.get('image')) or FALLBACK_IMG
    destination = item['direct']
    page_url = SITE + '/' + prefix + '/' + kind + '/' + slug + '/'
    og_type = 'article' if item.get('type') == 'article' else 'website'
    e = lambda v: html.escape(str(v), quote=True)
    # Do not issue an HTTP 301/302 here. WhatsApp must receive OG from raw HTML.
    # Redirect only human browsers through JavaScript, which link-preview bots ignore.
    js_target = json.dumps(destination, ensure_ascii=False).replace('<', '\\u003c')
    return f'''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(description)}">
<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="LilKangooMedia">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(page_url)}"><meta property="og:image" content="{e(image)}"><meta property="og:image:secure_url" content="{e(image)}"><meta property="og:image:alt" content="{e(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(description)}"><meta name="twitter:image" content="{e(image)}">
<link rel="canonical" href="{e(destination)}">
<style>body{{margin:0;background:#201e1b;color:#f7f5ee;font:16px/1.6 system-ui,sans-serif}}main{{max-width:640px;margin:13vh auto;padding:24px}}a{{color:#ffc46e}}img{{width:96px;height:96px;object-fit:cover;border-radius:12px}}</style>
</head><body><main><img src="{e(image)}" alt=""><h1>{e(title)}</h1><p>{e(description)}</p><a href="{e(destination)}">Open {e(title)}</a></main>
<script>window.location.replace({js_target});</script></body></html>'''


def main():
    entries = {}
    for slug, (path,title,description, image) in PAGES.items():
        entries[('page',slug)] = dict(title=title,description=description,image=image_url(image),direct=local_link(path))
    for slug, (direct,title,description) in SOCIALS.items():
        entries[('social',slug)] = dict(title=title,description=description,image=FALLBACK_IMG,direct=direct)

    services = api_rows('services', 'slug,title,summary,description,cover_url,active', [('active','eq.true')])
    galleries = api_rows('portfolio_galleries', 'id,slug,title,description,category,cover_image_id,visibility', [('visibility','eq.public')])
    images = api_rows('portfolio_images', 'id,gallery_id,image_url,display_order', [('visibility','eq.public')])
    videos = api_rows('media_videos', 'gallery_id,youtube_id,display_order', [('visibility','eq.public'),('gallery_id','not.is.null')])
    studies = api_rows('lkm_case_studies', 'gallery_id,headline,objective,is_published', [('is_published','eq.true')])
    story_by_gallery = {row['gallery_id']:row for row in studies}
    photos_by_gallery = {}
    for photo in sorted(images, key=lambda x: x.get('display_order') or 0):
        photos_by_gallery.setdefault(photo['gallery_id'],[]).append(photo)
    videos_by_gallery = {}
    for vid in sorted(videos, key=lambda x: x.get('display_order') or 0):
        videos_by_gallery.setdefault(vid['gallery_id'],[]).append(vid)

    for s in services:
        slug = s.get('slug','')
        if not SLUG.fullmatch(slug): continue
        entries[('service',slug)] = dict(title=clean(s.get('title'))+' | LilKangooMedia',description=s.get('summary') or s.get('description'),image=image_url(s.get('cover_url')),direct=SITE+'/#/service/'+urllib.parse.quote(slug))
    for g in galleries:
        slug = g.get('slug','')
        if not SLUG.fullmatch(slug): continue
        story = story_by_gallery.get(g['id'])
        media = image_for_gallery(g,photos_by_gallery,videos_by_gallery)
        direct = SITE + '/portfolio.html#/' + ('story/' if story else 'gallery/') + urllib.parse.quote(slug)
        # Match the card title/description/cover from Links Library exactly.
        details = dict(title=clean(g.get('title'))+' | LilKangooMedia Portfolio',description=g.get('description') or 'Explore photography and creative work by LilKangooMedia.',image=media,direct=direct,type='article' if story else 'website')
        entries[('gallery',slug)] = details
        if story:
            entries[('story',slug)] = dict(title=clean(story.get('headline'))+' | LilKangooMedia',description=story.get('objective') or g.get('description'),image=media,direct=direct,type='article')

    manifest_path = ROOT / 'assets/lkm-v3/articles-index.json'
    if not manifest_path.exists():
        raise RuntimeError('Missing articles-index.json. Run scripts/build_articles.py before share builder.')
    posts = json.loads(manifest_path.read_text(encoding='utf-8')).get('posts', [])
    for post in posts:
        slug = post.get('slug') or ''
        if not SLUG.fullmatch(slug) or post.get('status') not in (None, '', 'published'): continue
        direct = local_link(post.get('permalink') or post.get('legacy_path') or '')
        if not direct: continue
        entries[('article',slug)] = dict(title=post.get('seo_title') or post.get('title'),description=post.get('seo_description') or post.get('excerpt'),image=image_url(post.get('cover_url')),direct=direct,type='article')

    out = ROOT / 'share'
    hashes = {}
    count = {}
    for (kind,slug),item in sorted(entries.items()):
        page = render(kind,slug,item)
        path = out / 'v2' / kind / slug / 'index.html'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(page,encoding='utf-8')
        # Keep old /share/... URLs usable. New /share/v2/... URLs bypass
        # all older Netlify Function redirect rules and stale chatbot caches.
        legacy_page = render(kind,slug,item,prefix='share')
        legacy_path = out / kind / slug / 'index.html'
        legacy_path.parent.mkdir(parents=True,exist_ok=True)
        legacy_path.write_text(legacy_page,encoding='utf-8')
        hashes[kind+':'+slug] = hashlib.sha256(page.encode('utf-8')).hexdigest()[:12]
        count[kind] = count.get(kind,0)+1
    if not count.get('service') or not count.get('gallery'):
        raise RuntimeError('No public services or galleries. Refusing to deploy incomplete social previews.')
    manifest = ROOT / 'assets/lkm-v3/share-manifest.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps({'version':'32-2','hashes':hashes},ensure_ascii=False,sort_keys=True,separators=(',',':')),encoding='utf-8')
    print('LKM Phase 32.2: static Open Graph pages generated:', ', '.join(f'{k}={n}' for k,n in sorted(count.items())))
    print('LKM Phase 32.2: read-only content snapshot. Update via a new Netlify deploy after editing covers or descriptions.')

if __name__ == '__main__':
    main()
