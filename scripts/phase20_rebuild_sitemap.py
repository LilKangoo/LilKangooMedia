#!/usr/bin/env python3
"""Phase 20.5: safely finalize the sitemap *after* build_articles.py.

Preserves historical sitemap URLs backed by real HTML files, drops removed
URLs and duplicate home aliases, and includes only published article canonicals
from the generated public manifest. No secrets, network or new dependencies.

Run from Netlify build: python3 scripts/phase20_rebuild_sitemap.py
Test fixtures: python3 scripts/phase20_rebuild_sitemap.py --root /tmp/site
"""
import argparse
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

BASE = 'https://lilkangoomedia.com'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
PUBLIC_STATIC = ('/', '/portfolio.html', '/blog.html')
BLOCKED_PREFIX = ('/admin', '/cms', '/api/', '/.netlify/', '/share/', '/confirmation', '/payment-return')


def normalized_url(url):
    if not isinstance(url, str):
        return None
    try:
        p = urllib.parse.urlsplit(url.strip())
        if p.scheme != 'https' or p.netloc.lower() != 'lilkangoomedia.com':
            return None
        if p.query or p.fragment or p.path.startswith('//'):
            # paths beginning with // are not allowed
            return None
        if re.search(r'[\x00-\x1f\x7f<>"\']', p.path):
            return None
        if '%2f' in p.path.lower() or '%5c' in p.path.lower() or '..' in urllib.parse.unquote(p.path):
            return None
        path = p.path or '/'
        if any(path.lower().startswith(prefix) for prefix in BLOCKED_PREFIX):
            return None
        if path.lower() in ('/home', '/home.html', '/index', '/index.html'):
            return BASE + '/'
        return BASE + path
    except Exception:
        return None


def file_backed(path, html_index):
    filename = 'index.html' if path == '/' else path.lstrip('/').lower()
    source = html_index.get(filename) or html_index.get(filename + '.html')
    if not source:
        return False
    # build_articles.py writes a noindex placeholder when an old article is
    # unpublished; it must not be reintroduced via the historical sitemap.
    head = source.read_text(encoding='utf-8', errors='replace')[:12000].split('</head>', 1)[0]
    if re.search(r'<meta\b[^>]*(?:robots[^>]*noindex|noindex[^>]*robots)', head, re.I):
        return False
    return True


def build(root):
    manifest = root / 'assets/lkm-v3/articles-index.json'
    old_sitemap = root / 'sitemap.xml'
    if not manifest.is_file():
        raise RuntimeError('Public articles manifest not generated. Aborting to protect article SEO.')
    try:
        obj = json.loads(manifest.read_text(encoding='utf-8'))
        posts = obj['posts']
        if not isinstance(posts, list):
            raise ValueError('posts must be an array')
    except (ValueError, KeyError, OSError) as exc:
        raise RuntimeError('Invalid articles manifest; not overwriting sitemap') from exc
    html_index = {p.name.lower(): p for p in root.glob('*.html')}
    urls = set()
    for path in PUBLIC_STATIC:
        if file_backed(path, html_index):
            urls.add(BASE + path)
    # Only retain legacy sitemap entries when the corresponding HTML still exists.
    # It is safe to *exclude* URLs from a sitemap; this never deletes or redirects pages.
    if old_sitemap.exists():
        try:
            tree = ET.parse(old_sitemap)
        except ET.ParseError as exc:
            raise RuntimeError('Existing sitemap malformed; not overwriting sitemap') from exc
        for loc in tree.iter():
            if loc.tag.rsplit('}', 1)[-1] != 'loc':
                continue
            clean = normalized_url(loc.text)
            if not clean:
                continue
            path = urllib.parse.urlsplit(clean).path
            if file_backed(path, html_index):
                urls.add(clean)
    # Generated index includes only publicly published pages (the article builder
    # handles unpublishing); *do not* restore deleted posts from the old sitemap.
    published_canonical = set()
    for post in posts:
        if not isinstance(post, dict):
            continue
        permalink = post.get('permalink') or ''
        if not isinstance(permalink, str) or not permalink.startswith('/'):
            continue
        if not (root / permalink.lstrip('/')).is_file():
            # Do not advertise pages that build_articles.py did not generate.
            continue
        canonical = normalized_url(post.get('canonical_url') or BASE + permalink)
        if canonical:
            published_canonical.add(canonical)
        # Old canonical aliases may be in the existing sitemap. They can only be
        # used if the post is still published. Other unknown legacy HTML files
        # remain discoverable through old URLs, as before.
    # A previously published article removed from the manifest is not necessarily
    # missing from Git (legacy source HTML exists); the legacy URLs are retained.
    urls.update(published_canonical)
    # Remove duplicate aliases for modern canonical static pages.
    urls.discard(BASE + '/portfolio')
    urls.discard(BASE + '/blog')
    urls.discard(BASE + '/home')
    urls.discard(BASE + '/home.html')
    if not urls:
        raise RuntimeError('No canonical public URLs discovered; sitemap not written')
    root_tag = ET.Element(NS+'urlset')
    for url in sorted(urls, key=lambda u: (u != BASE + '/', u.lower())):
        node = ET.SubElement(root_tag, NS+'url')
        ET.SubElement(node, NS+'loc').text = url
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    ET.indent(root_tag, space='  ')
    # Avoid false lastmod values. Google requests actual significant update dates.
    content = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root_tag, encoding='unicode') + '\n'
    temp = root / 'sitemap.xml.phase20.tmp'
    temp.write_text(content, encoding='utf-8')
    temp.replace(old_sitemap)
    return len(urls)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    try:
        count = build(args.root)
    except RuntimeError as exc:
        print('Phase 20.5 sitemap error:', exc, file=sys.stderr)
        return 1
    print(f'Phase 20.5: sitemap has {count} canonical/legacy URLs, no stale lastmod values')
    return 0


if __name__ == '__main__':
    sys.exit(main())
