#!/usr/bin/env python3
"""Rebuild galleries from their ORIGINAL public Mobirise HTML pages.

Read-only source analysis. Outputs a human-readable CSV review and an idempotent SQL
file for Supabase. Does not contact any service or write to GitHub/Supabase.

Usage:
  python3 scripts/build_legacy_import.py /path/to/LilKangooMedia-repository
"""
from __future__ import annotations

import argparse
import csv
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import unquote, quote, urlsplit

VERIFIED = Path(__file__).resolve().parent.parent / 'review' / 'verified-galleries.json'
IMAGE_SUFFIXES = {'.jpeg','.jpg','.png','.webp','.gif','.avif'}
HUB_PAGES = {
    'index.html','home.html','legacy-home-2026.html','admin.html','cms.html',
    'blog.html','portfolio.html','photography.html','media.html','videography.html',
    'shop.html','faq.html','aboutus.html','about us.html','contactus.html',
    'education.html','articlesaboutcyprus.html','holiday.html','cyprus.html',
    'yourbusiness.html','reviews.html','termsofservice.html','work.html',
    'privacy.html','confirmation.html','webdesign.html','praca.html',
}

class LegacyGalleryParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts=[]
        self.in_title=False
        self.gallery_depth=0
        self.images=[]
        self.references=[]
        self.meta={}

    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='title':self.in_title=True
        if tag=='meta':
            key=(a.get('name') or a.get('property') or '').lower()
            if key:self.meta[key]=a.get('content','')
        if tag=='section':
            classes=(a.get('class') or '').split()
            if self.gallery_depth:
                self.gallery_depth+=1
            elif 'mbr-gallery' in classes:
                self.gallery_depth=1
        if tag=='a' and a.get('href'):self.references.append(a['href'])
        if tag=='img' and self.gallery_depth:
            # Mobirise lazy loading uses a 1x1 GIF in src and real image in data-src.
            source=a.get('data-src') or a.get('src') or ''
            normalized=normalize_image(source)
            if normalized:self.images.append((normalized,a.get('alt') or ''))

    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
        if tag=='section' and self.gallery_depth:self.gallery_depth-=1

    def handle_data(self,data):
        if self.in_title:self.title_parts.append(data)

    @property
    def title(self):return unescape(''.join(self.title_parts)).strip()


def normalize_image(source):
    source=unescape(source.strip())
    if not source or source.startswith(('data:','#')):return None
    # Don't import third-party photos or assume ownership of external media.
    parsed=urlsplit(source)
    if parsed.scheme and (parsed.scheme != 'https' or parsed.netloc.lower() not in ('lilkangoomedia.com','www.lilkangoomedia.com')):return None
    path=unquote(parsed.path).lstrip('/').replace('\\','/')
    if not path.startswith('assets/images/') or '..' in path.split('/'):return None
    if Path(path).suffix.lower() not in IMAGE_SUFFIXES:return None
    return path


def parse(path):
    p=LegacyGalleryParser()
    p.feed(path.read_text(encoding='utf-8',errors='replace'))
    return p


def to_slug(name):
    s=unicodedata.normalize('NFKD',str(name))
    s=''.join(c for c in s if not unicodedata.combining(c)).lower()
    s=re.sub(r'[^a-z0-9]+','-',s).strip('-')
    return s[:85] or 'untitled'


def quote_sql(value):
    return 'NULL' if value is None else "'"+str(value).replace("'","''")+"'"


def sql_migration_header():
    return '''-- LilKangooMedia: restore genuine legacy gallery groupings.
-- Run AFTER Phase 1 CMS migration; additive, idempotent, does NOT delete old HTML/images.
-- Important: allows one original photo to be referenced in multiple galleries without copying it.
BEGIN;
ALTER TABLE public.portfolio_images DROP CONSTRAINT IF EXISTS portfolio_images_original_path_key;
CREATE UNIQUE INDEX IF NOT EXISTS lkm_portfolio_img_gallery_path_unique
    ON public.portfolio_images(gallery_id, original_path);
'''


def image_url(original_path):
    return 'https://lilkangoomedia.com/' + quote(original_path, safe='/')


def generate_sql(galleries):
    out=[sql_migration_header()]
    for g in galleries:
        src=g['source_page']
        desc=f"Restored from the original LilKangooMedia gallery /{src}. Historical image grouping and order preserved."
        out.append('\n-- ORIGINAL: /'+src+' | '+str(len(g['images']))+' photographs | '+g['visibility']+'\n')
        vals=[g['slug'],g['title'],desc,g['category'],None,g.get('related_service_slug'),100,g['visibility']]
        out.append('INSERT INTO public.portfolio_galleries\n'
            '    (slug,title,description,category,client_name,related_service_slug,display_order,visibility)\n'
            'VALUES ('+', '.join(map(quote_sql,vals))+')\n'
            'ON CONFLICT (slug) DO NOTHING;\n')
        # Default to no cover_image_id, so CMS/public view chooses the first image.
        for idx,(original,alt) in enumerate(g['images'],start=1):
            vis=g['visibility']
            # Public only for already public ORIGINAL category galleries, never client albums.
            order=idx*10
            alt_text=alt.strip() or f"{g['title']} — photograph {idx}"
            out.append(
                'INSERT INTO public.portfolio_images\n'
                '    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)\n'
                'SELECT g.id, '+', '.join(map(quote_sql,[image_url(original),original,alt_text,'']))+', '+str(order)+', '+quote_sql(vis)+'\n'
                'FROM public.portfolio_galleries AS g WHERE g.slug='+quote_sql(g['slug'])+'\n'
                'AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i\n'
                '  WHERE i.gallery_id=g.id AND (i.original_path='+quote_sql(original)+' OR i.image_url='+quote_sql(image_url(original))+'))\n'
                'ON CONFLICT DO NOTHING;\n'
            )
    out += ['COMMIT;\n',
        '-- Read-only verification of imported gallery sizes:\n',
        'SELECT g.slug,g.title,g.category,g.visibility,COUNT(i.id) AS image_count\n',
        'FROM public.portfolio_galleries g LEFT JOIN public.portfolio_images i ON i.gallery_id=g.id\n',
        "WHERE g.slug LIKE 'legacy-%'\nGROUP BY g.slug,g.title,g.category,g.visibility\nORDER BY g.category,g.title;\n"]
    return ''.join(out)


def identify_article_pages(root):
    targets=set()
    for lower in ('education.html','articlesaboutcyprus.html'):
        f=next((x for x in root.glob('*.html') if x.name.casefold()==lower),None)
        if not f:continue
        for link in parse(f).references:
            candidate=Path(unquote(urlsplit(link).path)).name.casefold()
            if candidate.endswith('.html'):targets.add(candidate)
    return targets


def classify_page(filename, p, known, articles):
    lower=filename.casefold()
    if lower in known:return None  # known public catalogs handled by audited manifest
    if lower in articles:return 'Article page (not a portfolio gallery)'
    if lower in HUB_PAGES:return 'Hub/service page (not a client gallery)'
    if 'protected page' in p.title.casefold():return 'Password-protected legacy page'
    if 'noindex' in p.meta.get('robots','').lower():return 'noindex page — manual review'
    if not p.images:return 'No original Mobirise gallery section'
    return None


def scan_all(root, existing):
    if not root.is_dir():raise ValueError('Repository folder not found: '+str(root))
    if not (root/'assets'/'images').is_dir():raise ValueError('Expected assets/images inside the repository root')
    articles=identify_article_pages(root)
    known={g['source_page'].casefold() for g in existing}
    pages=[]
    seen_slugs={g['slug'] for g in existing}
    skipped=[]
    for f in sorted(root.glob('*.html'),key=lambda x:x.name.casefold()):
        p=parse(f)
        skip=classify_page(f.name,p,known,articles)
        if skip:
            skipped.append((f.name,p.title,skip,len(p.images)))
            continue
        # No guesses based on names alone: these source-defined groups need human classification.
        images=[];seen=set()
        for path,alt in p.images:
            if path not in seen:
                images.append((path,alt));seen.add(path)
        if not images:continue
        slug='legacy-'+to_slug(f.stem)
        if slug in seen_slugs:
            skipped.append((f.name,p.title,'Duplicate slug; review manually',len(images)))
            continue
        seen_slugs.add(slug)
        title=p.title or f.stem
        pages.append({'slug':slug,'title':title[:150],'source_page':f.name,
                      'category':'Client Projects — Review','related_service_slug':None,
                      'visibility':'review','images':images})
    return pages,skipped


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo',nargs='?',type=Path,help='Root folder of checked-out LilKangooMedia GitHub repo')
    parser.add_argument('--output',type=Path,default=Path('lkm-legacy-gallery-output'))
    args=parser.parse_args()
    manifest=json.loads(VERIFIED.read_text(encoding='utf-8'))
    output=args.output.resolve()
    output.mkdir(parents=True,exist_ok=True)
    galleries=[];missing=[];skipped=[]
    for g in manifest:
        gallery={k:v for k,v in g.items() if k!='images'}
        gallery['images']=[]
        for path in g['images']:
            normalized=normalize_image('assets/images/'+path)
            if not normalized:continue
            if args.repo and not (args.repo/normalized).is_file():
                missing.append((g['source_page'],normalized,'file not found'));continue
            gallery['images'].append((normalized,''))
        if gallery['images']:galleries.append(gallery)
    if args.repo:
        additional,skipped=scan_all(args.repo.resolve(),galleries)
        for g in additional:
            images=[];seen=set()
            for path,alt in g['images']:
                if path in seen:continue
                seen.add(path)
                if not (args.repo/path).is_file():
                    missing.append((g['source_page'],path,'file not found'));continue
                images.append((path,alt))
            if images:
                g['images']=images
                galleries.append(g)
    sql=generate_sql(galleries)
    (output/'IMPORT-LEGACY-GALLERIES.sql').write_text(sql,encoding='utf-8')
    with (output/'GALLERIES-REVIEW.csv').open('w',newline='',encoding='utf-8') as fh:
        w=csv.writer(fh);w.writerow(['source_html','gallery_slug','title','category','image_count','visibility','related_service'])
        for g in galleries:w.writerow([g['source_page'],g['slug'],g['title'],g['category'],len(g['images']),g['visibility'],g.get('related_service_slug') or ''])
    with (output/'PHOTO-ASSIGNMENTS.csv').open('w',newline='',encoding='utf-8') as fh:
        w=csv.writer(fh);w.writerow(['original_html','gallery_slug','image_file','order','visibility','image_url'])
        for g in galleries:
            for n,(path,_) in enumerate(g['images'],1):w.writerow([g['source_page'],g['slug'],path,n,g['visibility'],image_url(path)])
    if args.repo:
        assigned={path for g in galleries for path,_ in g['images']}
        with (output/'UNASSIGNED-FILES.csv').open('w',newline='',encoding='utf-8') as fh:
            w=csv.writer(fh);w.writerow(['file','reason'])
            for f in sorted((args.repo/'assets'/'images').rglob('*')):
                if f.suffix.lower() in IMAGE_SUFFIXES:
                    rel=f.relative_to(args.repo).as_posix()
                    if rel not in assigned:w.writerow([rel,'Not located inside a verified legacy gallery section; manual review'])
    with (output/'SKIPPED-AND-PROTECTED.csv').open('w',newline='',encoding='utf-8') as fh:
        w=csv.writer(fh);w.writerow(['html_file','original_title','reason','gallery_image_references'])
        w.writerows(skipped)
    with (output/'MISSING-IMAGE-FILES.csv').open('w',newline='',encoding='utf-8') as fh:
        w=csv.writer(fh);w.writerow(['html_file','image_path','reason']);w.writerows(missing)
    print('Generated:',output/'IMPORT-LEGACY-GALLERIES.sql')
    print('Galleries:',len(galleries),'Images:',sum(len(x['images']) for x in galleries))
    for g in galleries:print(' -',g['source_page'],len(g['images']),g['category'],g['visibility'])
    print('Missing source photos:',len(missing),'Excluded/requires review:',len(skipped))
    print('No database changes were performed. Review generated CSV/SQL and run SQL in Supabase manually.')

if __name__=='__main__':main()
