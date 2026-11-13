#!/usr/bin/env python3
"""Create a sitemap index while preserving the existing Phase 20.5 static sitemap.

Run last in Netlify build. The second sitemap is read-only, public Supabase-backed
and works for newly published CMS content without waiting for another deploy.
"""
from __future__ import annotations
import argparse
import json
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

SITE='https://lilkangoomedia.com'
SITEMAP='http://www.sitemaps.org/schemas/sitemap/0.9'
NS='{'+SITEMAP+'}'

def build(root:Path):
    source=root/'sitemap.xml'
    if not source.is_file():raise RuntimeError('Expected static sitemap.xml not found after phase20 build')
    content=source.read_bytes()
    try:tree=ET.fromstring(content)
    except ET.ParseError as ex:raise RuntimeError('Phase20 sitemap XML malformed') from ex
    if tree.tag!=NS+'urlset':raise RuntimeError('Sitemap expected urlset; refusing unsafe conversion')
    urls=set()
    for v in tree.findall(NS+'url'):
        loc=v.findtext(NS+'loc','').strip()
        parts=urllib.parse.urlsplit(loc)
        if parts.scheme!='https' or parts.netloc!='lilkangoomedia.com' or parts.query or parts.fragment:
            raise RuntimeError('Non-canonical URL encountered in generated static sitemap: '+loc)
        if parts.path.startswith(('/admin','/cms','/share/','/.netlify/')):raise RuntimeError('Private or share URL in static sitemap: '+loc)
        urls.add(loc)
    if SITE+'/' not in urls or len(urls)<5:raise RuntimeError('Too few validated static URLs; refusing conversion')
    # Important: no fake lastmod generated.
    (root/'sitemap-static.xml').write_bytes(content)
    index=ET.Element(NS+'sitemapindex')
    for url in (SITE+'/sitemap-static.xml',SITE+'/sitemap-live.xml'):
        node=ET.SubElement(index,NS+'sitemap');ET.SubElement(node,NS+'loc').text=url
    ET.register_namespace('',SITEMAP);ET.indent(index,space='  ')
    xml='<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(index,encoding='unicode')+'\n'
    source.write_text(xml,encoding='utf-8')
    manifest=root/'netlify/functions/seo-static-urls.json'
    manifest.parent.mkdir(parents=True,exist_ok=True)
    manifest.write_text(json.dumps({'version':'33-0','urls':sorted(urls)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Phase 33: sitemap index ready, {len(urls)} static URLs, live published-content child enabled')
    return len(urls)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args()
    try:build(args.root)
    except (RuntimeError,OSError) as ex:print('Phase 33 sitemap error:',ex,file=sys.stderr);return 1
    return 0
if __name__=='__main__':raise SystemExit(main())
