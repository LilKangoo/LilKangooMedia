#!/usr/bin/env python3
"""Read-only, local legacy article and image inventory. No uploads or deletions."""
import csv, re, sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
OUT = Path(sys.argv[2]).resolve() if len(sys.argv)>2 else Path.cwd()/'lkm-cms-audit'
OUT.mkdir(parents=True,exist_ok=True)
class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.in_title=False; self.meta={}; self.links=[]; self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='title':self.in_title=True
        if tag=='meta':
            key=a.get('name') or a.get('property')
            if key:self.meta[key.lower()]=a.get('content','')
        if tag=='link' and a.get('rel','').lower()=='canonical':self.meta['canonical']=a.get('href','')
        if tag=='a' and a.get('href'):self.links.append(a['href'])
        if tag=='img':
            src=a.get('data-src') or a.get('src') or ''
            if src and not src.startswith('data:'):self.images.append((src,a.get('alt','')))
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
    def handle_data(self,data):
        if self.in_title:self.title+=data

def parse_file(path):
    p=Parser()
    try:p.feed(path.read_text(encoding='utf-8',errors='replace'))
    except Exception as e:print('Cannot parse',path,e,file=sys.stderr)
    return p

index_pages={'education.html':'photo-education','articlesaboutcyprus.html':'cyprus-travel'}
articles={}
for index,category in index_pages.items():
    f=next((p for p in ROOT.glob('*.html') if p.name.lower()==index),None)
    if not f:print('Missing index:',index,file=sys.stderr);continue
    p=parse_file(f)
    for link in p.links:
        candidate=unquote(link.split('#')[0].split('?')[0]).rsplit('/',1)[-1]
        if not candidate.lower().endswith('.html'):continue
        file=next((z for z in ROOT.glob('*.html') if z.name.lower()==candidate.lower()),None)
        if file and file.name.lower() not in index_pages and file.name.lower() not in {'home.html','shop.html','faq.html','termsofservice.html','aboutus.html','reviews.html','education.html','photography.html','videography.html','graphicdesign.html','yourbusiness.html','holiday.html'}:
            articles.setdefault(file.name,(file,category))

with (OUT/'articles.csv').open('w',newline='',encoding='utf-8') as fh:
    w=csv.writer(fh);w.writerow(['legacy_path','category','title','meta_description','canonical','og_image','image_count','review_status'])
    for f,category in sorted(articles.values(),key=lambda x:x[0].name.lower()):
        p=parse_file(f)
        w.writerow(['/'+f.name,category,p.title.strip(),p.meta.get('description',''),p.meta.get('canonical',''),p.meta.get('og:image',''),len(p.images),'REVIEW'])

images_dir=ROOT/'assets'/'images'
linked={}
for html in ROOT.glob('*.html'):
    p=parse_file(html)
    for src,alt in p.images:
        key=unquote(src.split('?')[0]).rsplit('/',1)[-1].lower()
        linked.setdefault(key,set()).add(html.name)
with (OUT/'images.csv').open('w',newline='',encoding='utf-8') as fh:
    w=csv.writer(fh);w.writerow(['original_path','filename','references','public_status','suggested_group'])
    if images_dir.exists():
        for f in sorted(images_dir.rglob('*')):
            if f.suffix.lower() not in {'.png','.jpg','.jpeg','.webp','.gif','.avif'}:continue
            refs=sorted(linked.get(f.name.lower(),()))
            group='Linked to: '+', '.join(refs[:4]) if refs else 'Unreferenced (needs review)'
            w.writerow([f.relative_to(ROOT).as_posix(),f.name,'; '.join(refs),'REVIEW',group])
print('Audit complete (read-only):',OUT)
print('Identified linked article files:',len(articles))
print('Images directory:',images_dir,'exists:',images_dir.exists())
