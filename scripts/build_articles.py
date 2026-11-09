#!/usr/bin/env python3
"""LilKangooMedia static article generator. Python standard library only.

Netlify runs this during build, working from a clean GitHub checkout.
Never touches unrelated pages, galleries, media, the CMS, or customer records.
"""
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets' / 'lkm-v3'
BASE = 'https://lilkangoomedia.com'
ARTICLE_CATEGORIES = (
    ('Education.html', 'photo-education', 'Photo Education'),
    ('articlesaboutcyprus.html', 'cyprus-travel', 'Articles about Cyprus'),
)
SKIP = {
    'home.html','index.html','shop.html','education.html','articlesaboutcyprus.html',
    'aboutus.html','about us.html','reviews.html','contactus.html','faq.html',
    'holiday.html','yourbusiness.html','termsofservice.html',
    'photography.html','videography.html','graphicdesign.html','portfolio.html','blog.html',
    'admin.html','cms.html',
}
FORBIDDEN = {'script','style','iframe','object','embed','form','svg','math','template','video','audio','noscript','input','button'}
BLOCKS = {'p','h1','h2','h3','h4','li','blockquote','figcaption','td','th'}
ALLOWED = {'p','h2','h3','h4','ul','ol','li','blockquote','figure','figcaption','strong','b','em','i','u','a','br','img','hr','code','pre','table','thead','tbody','tr','td','th'}
IMAGE_RE = re.compile(r'^/?assets/images/[a-zA-Z0-9%+_.\-/]+\.(?:jpe?g|png|gif|webp)$',re.I)

def text_plain(source):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>',' ',source or '')).split())

def meta_value(src, name, kind='name'):
    for tag in re.findall(r'<meta\b[^>]*>',src,re.I):
        if re.search(r'\b'+re.escape(kind)+r'\s*=\s*["\']'+re.escape(name)+r'["\']',tag,re.I):
            match = re.search(r'\bcontent\s*=\s*(["\'])(.*?)\1',tag,re.I|re.S)
            return html.unescape(match.group(2).strip()) if match else ''
    return ''

def canonical_value(src):
    for tag in re.findall(r'<link\b[^>]*>',src,re.I):
        if re.search(r'\brel\s*=\s*["\']canonical["\']',tag,re.I):
            match=re.search(r'\bhref\s*=\s*(["\'])(.*?)\1',tag,re.I|re.S)
            return html.unescape(match.group(2)) if match else ''
    return ''

def safe_image(value):
    if not value or value.startswith('data:'):return ''
    value=value.strip().replace('\\','/')
    if value.startswith(BASE+'/'):
        value=value[len(BASE):]
    if re.fullmatch(r'https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/portfolio/[a-zA-Z0-9%+_./-]+\.(?:jpe?g|png|webp)',value,re.I):return value
    if value.startswith('assets/'):
        value='/'+value
    # Public images selected by an administrator may be hosted on another HTTPS CDN.
    if re.fullmatch(r'https://[a-z0-9.-]+(?::443)?/[^\s<>\"\']+',value,re.I):return value
    value=value.split('?',1)[0]
    if not IMAGE_RE.fullmatch(value):return ''
    base=value.rsplit('/',1)[-1].lower()
    if any(t in base for t in ('logo','apple-launch','mbr-176','mbr-121','favicon','profile-pic')):return ''
    return value


def safe_link(value):
    u=(value or '').strip()
    if re.match(r'^(?:https?://|mailto:|/|#)',u,re.I):return u if not re.match(r'^javascript:',u,re.I) else ''
    if re.fullmatch(r'[a-zA-Z0-9%._+~/-]+(?:\.html)?(?:#[a-z0-9_-]+)?',u):return '/'+u
    return ''

class ContentCleaner(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.out=[];self.stack=[];self.drop=0
    def handle_starttag(self,tag,attrs):
        tag=tag.lower(); attributes=dict(attrs)
        if tag in FORBIDDEN:self.drop+=1;self.stack.append((tag,False,True));return
        if self.drop:self.stack.append((tag,False,False));return
        mapped='h2' if tag=='h1' else tag
        keep=mapped in ALLOWED
        if tag in ('br','img','hr'):
            if tag=='img':
                source=safe_image(attributes.get('data-src') or attributes.get('src') or '')
                if source:self.out.append('<img src="'+html.escape(source,quote=True)+'" alt="'+html.escape(attributes.get('alt') or '',quote=True)+'" loading="lazy">')
            elif tag=='br':self.out.append('<br>')
            else:self.out.append('<hr>')
            return
        self.stack.append((tag,keep,False))
        if keep:
            props=''
            if mapped=='a':
                url=safe_link(attributes.get('href',''))
                props=' href="'+html.escape(url,quote=True)+'"' if url else ''
                if url.startswith('http'):props+=' rel="noopener noreferrer"'
            self.out.append('<'+mapped+props+'>')
    def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
    def handle_endtag(self,tag):
        tag=tag.lower()
        idx=next((i for i in range(len(self.stack)-1,-1,-1) if self.stack[i][0]==tag),None)
        if idx is None:return
        while len(self.stack)>idx:
            t,emitted,blocking=self.stack.pop()
            if blocking:self.drop=max(0,self.drop-1)
            if emitted:self.out.append('</'+('h2' if t=='h1' else t)+'>')
    def handle_data(self,data):
        if self.drop:return
        if any(tag in BLOCKS for tag,_,_ in self.stack):self.out.append(html.escape(data))
    def output(self):
        while self.stack:
            t,emitted,_=self.stack.pop()
            if emitted:self.out.append('</'+('h2' if t=='h1' else t)+'>')
        result=''.join(self.out)
        result=re.sub(r'<(h[234]|p|li|blockquote)[^>]*>\s*(?:<br>\s*)*</\1>','',result,flags=re.I)
        result=re.sub(r'(?is)<p>\s*(?:<br>\s*)+</p>','',result)
        return result.strip()

def extract_sections(src):
    matched=[]
    for section in re.finditer(r'<section\b([^>]*)>(.*?)</section\s*>',src,re.I|re.S):
        attrs=section.group(1)
        if re.search(r'\bclass\s*=\s*["\'][^"\']*\bcontent(?:2|3|4|5|6|7|8|9|10|11|12|13|14|15)\b',attrs,re.I):
            cleaned=ContentCleaner();cleaned.feed(section.group(2));result=cleaned.output()
            if len(text_plain(result))>30:matched.append(result)
    return '\n'.join(matched)

def get_intro(body):
    p=re.search(r'<p(?:\s[^>]*)?>(.*?)</p>',body,re.S|re.I)
    return text_plain(p.group(1)) if p else text_plain(body)[:260]

def slugify(name):return re.sub(r'[^a-z0-9-]+','-',name.lower()).strip('-')[:100]

def load_existing_catalog():
    paths={x.name.lower():x for x in ROOT.glob('*.html')}
    selected={}
    for index,slug,label in ARTICLE_CATEGORIES:
        page=paths.get(index.lower())
        if not page:print('WARNING: index missing:',index);continue
        src=page.read_text(encoding='utf-8',errors='replace')
        for raw in re.findall(r'\bhref=["\']([^"\']+\.html)(?:[?#][^"\']*)?["\']',src,re.I):
            basename=urllib.parse.unquote(raw.split('/')[-1]);low=basename.lower()
            if low in SKIP or low in selected:continue
            target=paths.get(low)
            if target:selected[low]={'file':target,'category':slug,'category_name':label}
    return selected

def parse_legacy_file(path, category, name):
    src=path.read_text(encoding='utf-8',errors='replace')
    title=text_plain((re.search(r'<title[^>]*>(.*?)</title>',src,re.I|re.S) or [None,''])[1]);
    content=extract_sections(src)
    # Article hero already renders the H1; avoid repeating the same heading in the body.
    first_heading=re.search(r'^\s*<h2[^>]*>(.*?)</h2>',content,re.I|re.S)
    if first_heading and text_plain(first_heading.group(1)).casefold()==title.casefold():
        content=content[first_heading.end():].lstrip()
    words=len(text_plain(content).split())
    if words<85:return None, 'Skipped: article text below 85 words ('+str(words)+')'
    description=meta_value(src,'description') or get_intro(content)[:180]
    excerpt=get_intro(content)[:260] or description
    slug=slugify(path.stem)
    canonical=canonical_value(src)
    if not canonical.startswith(BASE+'/'):canonical=BASE+'/'+path.stem
    cover=safe_image(meta_value(src,'og:image','property'))
    if not cover:
        images=re.findall(r'<img\b[^>]*>',src,re.I)
        for im in images:
            m=re.search(r'\b(?:data-src|src)\s*=\s*(["\'])(.*?)\1',im,re.I)
            if m and safe_image(m.group(2)):
                cover=safe_image(m.group(2));break
    path_url='/'+path.name
    return dict(slug=slug,category=category,category_name=name,title=title or text_plain(re.findall(r'<h1[^>]*>(.*?)</h1>',src,re.I|re.S)[0])[:120],
      excerpt=excerpt,body_html=content,cover_url=cover or None,cover_alt=title,
      seo_title=title,seo_description=description,canonical_url=canonical,
      legacy_path=path_url,source_file=path.name,permalink=path_url,status='published',published_at=None),None

def supabase_params():
    url=os.getenv('SUPABASE_URL','').rstrip('/')
    key=os.getenv('SUPABASE_PUBLISHABLE_KEY','') or os.getenv('SUPABASE_ANON_KEY','')
    if not url or not key:
        config=(ROOT/'lkm-config.js')
        data=config.read_text(encoding='utf-8') if config.exists() else ''
        for var in ('SUPABASE_URL','SUPABASE_ANON_KEY'):
            found=re.search(r'\b'+var+r'\s*:\s*["\']([^"\']+)',data)
            if found:
                if var=='SUPABASE_URL' and not url:url=found.group(1).rstrip('/')
                if var=='SUPABASE_ANON_KEY' and not key:key=found.group(1)
    if not url.endswith('.supabase.co') or len(key)<30 or key.startswith('TWOJ_'):
        return None,None
    return url,key

def supabase_article_rows():
    url,key=supabase_params()
    if not url:return []
    # When available, the server-only key lets the build honor unpublish/archive
    # without exposing drafts to visitors or writing them to the public manifest.
    secret=os.getenv('SUPABASE_SERVICE_ROLE_KEY','').strip()
    effective=secret or key
    headers={'apikey':effective,'Accept':'application/json'}
    if secret and not secret.startswith('sb_secret_'):
        headers['Authorization']='Bearer '+secret
    path='/rest/v1/blog_posts?select=*&order=updated_at.desc&limit=1000'
    if not secret:
        since=datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
        path='/rest/v1/blog_posts?select=*&status=eq.published&published_at=lte.'+urllib.parse.quote(since,safe='')+'&order=published_at.desc&limit=1000'
    try:
        with urllib.request.urlopen(urllib.request.Request(url+path,headers=headers),timeout=18) as response:return json.load(response)
    except Exception as e:
        raise RuntimeError('Cannot load Supabase articles; Netlify build stopped to protect SEO: '+str(e)) from e

def unavailable_article(path):
    title='Article unavailable | LilKangooMedia'
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
      '<meta name="robots" content="noindex, nofollow"><title>'+title+'</title>'
      '<link rel="stylesheet" href="/assets/lkm-v3/article.css"></head><body>'
      '<main class="article-container" style="padding:100px 0"><a href="/blog.html">← Articles</a>'
      '<h1>This article is currently unavailable.</h1><p>Explore our other articles and photography guides.</p>'
      '</main></body></html>')

def clean_post(post):
    if not re.fullmatch(r'[a-z0-9-]{1,100}',str(post.get('slug',''))):return None
    slug=post['slug'];legacy=post.get('legacy_path') or ''
    if legacy and not re.fullmatch(r'/[A-Za-z0-9._%+~-]+\.html',legacy):return None
    cleaner=ContentCleaner();cleaner.feed(str(post.get('body_html') or ''));body=cleaner.output()
    if len(text_plain(body).split())<20:return None
    category=str(post.get('category_slug') or 'articles')
    canonical=post.get('canonical_url') or (BASE+legacy if legacy else BASE+'/articles/'+slug)
    if not re.match(r'^https://lilkangoomedia\.com/[\w%./+~\-]*$',canonical):canonical=BASE+(legacy or '/articles/'+slug)
    return dict(slug=slug,title=str(post.get('title') or slug),category=category,
      category_name=str(post.get('category_name') or 'Articles'),excerpt=str(post.get('excerpt') or ''),
      body_html=body,cover_url=safe_image(post.get('cover_url') or '') or None,
      cover_alt=str(post.get('cover_alt') or post.get('title') or ''),
      seo_title=str(post.get('seo_title') or post.get('title') or slug),seo_description=str(post.get('seo_description') or post.get('excerpt') or ''),
      canonical_url=canonical,legacy_path=legacy or None,source_file=post.get('source_file'),
      permalink=legacy or '/articles/'+slug+'.html',status='published',published_at=post.get('published_at'))

def e(v):return html.escape(str(v or ''),quote=True)

def card(post):
    cover='<img src="'+e(post['cover_url'])+'" alt="'+e(post['cover_alt'] or post['title'])+'" loading="lazy">' if post.get('cover_url') else '<div class="article-card-placeholder" aria-hidden="true">LKM</div>'
    return '<a class="article-card" href="'+e(post['permalink'])+'">'+cover+'<div class="article-card-body"><small>'+e(post['category_name'])+'</small><h2>'+e(post['title'])+'</h2><p>'+e(post.get('excerpt') or '')+'</p><span>Read article →</span></div></a>'

def page_base(head,body, canonical, title, description, cover=''):
    absolute_cover=(BASE+cover if cover.startswith('/') else cover) if cover else ''
    og=(' <meta property="og:image" content="'+e(absolute_cover)+'">') if absolute_cover else ''
    return ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
      '<meta name="theme-color" content="#171917"><meta name="google-site-verification" content="Sb0iYwUcm_3WZ2sUHmEVQB9uaUNb-jFt0HPkIq7aUSE">'
      '<meta name="google-adsense-account" content="ca-pub-1951868717311818">'
      '<title>'+e(title)+'</title><meta name="description" content="'+e(description)[:300]+'">'
      '<link rel="canonical" href="'+e(canonical)+'"><meta property="og:type" content="article"><meta property="og:title" content="'+e(title)+'">'
      '<meta property="og:description" content="'+e(description)[:300]+'">'+og+
      '<link rel="icon" href="/assets/lkm-v3/brand/logo-profile.png">'
      '<link rel="stylesheet" href="/assets/lkm-v3/article.css">'+head+'</head><body>'
      '<a class="skip-link" href="#article">Skip to content</a><header class="topbar"><a class="identity" href="/"><img src="/assets/lkm-v3/brand/logo-profile.png" alt=""><span>LilKangooMedia</span></a>'
      '<nav aria-label="Main navigation"><a href="/">Home</a><a href="/portfolio.html">Portfolio</a><a href="/blog.html">Articles</a><a href="/#/services">Services</a><a href="/#/contact">Contact</a></nav></header>'
      '<main id="article">'+body+'</main><footer class="article-footer"><div><strong>LilKangooMedia</strong><p>Photography · Film · Creative Services</p></div>'
      '<div><a href="/blog.html">Articles</a><a href="/portfolio.html">Portfolio</a><a href="/#/contact">Contact</a></div><small>© LilKangooMedia LTD · Cyprus</small></footer>'
      '<script src="/assets/lkm-v3/article-consent.js" defer></script></body></html>')

def render_post(post,all_posts):
    related=[p for p in all_posts if p['slug']!=post['slug'] and p['category']==post['category']][:3]
    cover=('<figure class="article-cover"><img src="'+e(post['cover_url'])+'" alt="'+e(post['cover_alt'] or post['title'])+'"><figcaption></figcaption></figure>') if post.get('cover_url') else ''
    body='<section class="article-hero"><div class="article-container"><a class="back" href="/blog.html">← All articles</a><div class="eyebrow">'+e(post['category_name'])+'</div><h1>'+e(post['title'])+'</h1>'+('<p class="article-lede">'+e(post['excerpt'])+'</p>' if post.get('excerpt') else '')+'</div></section>'
    body+='<div class="article-container">'+cover+'<div class="article-layout"><article class="article-prose">'+post['body_html']+'</article><aside class="article-aside"><div class="aside-sticky"><span>CREATIVE SERVICES</span><h2>Bring your next project to life.</h2><p>Photography, video production and creative marketing across Cyprus.</p><a href="/#/contact">Discuss your project →</a></div></aside></div></div>'
    if related:body+='<section class="related"><div class="article-container"><h2>More to explore</h2><div class="article-card-grid">'+''.join(card(p) for p in related)+'</div></div></section>'
    schema={'@context':'https://schema.org','@type':'BlogPosting','headline':post['title'],'description':post.get('seo_description') or post.get('excerpt'),'mainEntityOfPage':post['canonical_url'],'publisher':{'@type':'Organization','name':'LilKangooMedia','url':BASE}}
    if post.get('cover_url'):schema['image']=BASE+post['cover_url'] if post['cover_url'].startswith('/') else post['cover_url']
    if post.get('published_at'):schema['datePublished']=post['published_at']
    schema_tag='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    return page_base(schema_tag,body,post['canonical_url'],post.get('seo_title') or post['title'],post.get('seo_description') or post.get('excerpt') or post['title'],post.get('cover_url') or '')

def render_index(title,cat,posts,canonical):
    relevant=[p for p in posts if not cat or p['category']==cat]
    body='<section class="article-index-hero"><div class="article-container"><div class="eyebrow">LILKANGOOMEDIA JOURNAL</div><h1>'+e(title)+'</h1><p>Ideas, techniques and places worth exploring.</p></div></section>'
    body+='<section class="article-container index-content"><div class="article-index-links"><a href="/blog.html">All articles</a><a href="/Education.html">Photo Education</a><a href="/articlesaboutcyprus.html">Cyprus</a></div><div class="article-card-grid">'+''.join(card(p) for p in relevant)+'</div></section>'
    return page_base('',body,canonical,title+' | LilKangooMedia',title+' — photography and Cyprus articles from LilKangooMedia.')

def update_sitemap(urls):
    sitemap=ROOT/'sitemap.xml'
    if not sitemap.exists():return
    try:
        original=sitemap.read_text(encoding='utf-8')
        seen=set(re.findall(r'<loc>(.*?)</loc>',original,re.S))
        new=[BASE+path for path in urls if BASE+path not in seen]
        if not new:return
        addition='\n'+'\n'.join('  <url><loc>'+e(u)+'</loc></url>' for u in sorted(new))+'\n'
        if '</urlset>' in original:sitemap.write_text(original.replace('</urlset>',addition+'</urlset>'),encoding='utf-8')
    except Exception as ex:print('WARNING sitemap:',str(ex))

def main():
    dry='--dry-run' in sys.argv
    selected=load_existing_catalog()
    articles=[];skipped=[]
    for ent in selected.values():
        post,error=parse_legacy_file(ent['file'],ent['category'],ent['category_name'])
        if error:skipped.append((ent['file'].name,error));continue
        articles.append(post)
    articles.sort(key=lambda p:(p['category'],p['title'].casefold()))
    original_count=len(articles)
    posts_by_path={p['permalink'].lower():p for p in articles}
    supabase_rows=[] if dry else supabase_article_rows()
    now=datetime.now(timezone.utc)
    published=[];suppressed_paths=set()
    for raw in supabase_rows:
        date=raw.get('published_at')
        try:published_date=datetime.fromisoformat(str(date).replace('Z','+00:00')) if date else None
        except ValueError:published_date=None
        is_published=raw.get('status')=='published' and published_date is not None and published_date<=now
        if is_published:published.append(raw)
        elif raw.get('legacy_path') and str(raw['legacy_path']).lower() in {'/'+e['file'].name.lower() for e in selected.values()}:suppressed_paths.add(str(raw['legacy_path']).lower())
    for suppressed in suppressed_paths:posts_by_path.pop(suppressed,None)
    cats={}
    if published:
        # Resolve readable categories, without privileged API keys.
        url,key=supabase_params()
        with urllib.request.urlopen(urllib.request.Request(url+'/rest/v1/blog_categories?select=id,slug,name&limit=1000',headers={'apikey':key}),timeout=18) as r:cats={x['id']:x for x in json.load(r)}
    approved_old_urls={'/'+ent['file'].name.lower() for ent in selected.values()}
    for raw in published:
        # Only genuine article files may keep a root-level historical URL.
        # A mistyped admin field must never overwrite FAQ.html or a client gallery.
        if raw.get('legacy_path') and str(raw['legacy_path']).lower() not in approved_old_urls:
            print('WARNING: non-article legacy_path ignored:',str(raw['legacy_path'])[:100])
            raw['legacy_path']=None
        c=cats.get(raw.get('category_id')) or {}
        raw['category_slug']=c.get('slug') or 'articles';raw['category_name']=c.get('name') or 'Articles'
        post=clean_post(raw)
        if post:posts_by_path[post['permalink'].lower()]=post
    final=sorted(posts_by_path.values(),key=lambda p:(p['category'],p['title'].casefold()))
    print('LilKangooMedia articles: original='+str(original_count)+' published Supabase='+str(len(published))+' total='+str(len(final))+' suppressed='+str(len(suppressed_paths))+' skipped='+str(len(skipped)))
    for f,why in skipped:print('  SKIPPED',f,why)
    if dry:return 0 if final else 1
    ASSETS.mkdir(parents=True,exist_ok=True)
    # Import manifest contains only ORIGINAL public articles, never private Supabase drafts.
    import_manifest={'schema_version':1,'count':len(articles),'posts':articles}
    (ASSETS/'articles-import.json').write_text(json.dumps(import_manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    index_manifest={'schema_version':1,'count':len(final),'posts':[{key:p.get(key) for key in ('slug','title','excerpt','category','category_name','cover_url','cover_alt','permalink','canonical_url','legacy_path')} for p in final]}
    (ASSETS/'articles-index.json').write_text(json.dumps(index_manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    published_urls=[]
    for p in final:
        path=ROOT/p['permalink'].lstrip('/')
        path.parent.mkdir(parents=True,exist_ok=True)
        page_html=render_post(p,final)
        path.write_text(page_html,encoding='utf-8')
        # Some original navigation uses lowercase URLs for mixed-case filenames.
        alias=ROOT/p['permalink'].lstrip('/').lower()
        if alias!=path and not alias.exists():alias.write_text(page_html,encoding='utf-8')
        published_urls.append(p['permalink'])
    for suppressed in suppressed_paths:
        original=next((ent['file'] for low,ent in selected.items() if '/'+low==suppressed),None)
        if original and original.exists():original.write_text(unavailable_article(suppressed),encoding='utf-8')
    for idx,slug,label in ARTICLE_CATEGORIES:
        index_canonical=BASE+('/education' if slug=='photo-education' else '/articlesaboutcyprus')
        listing=render_index(label,slug,final,index_canonical)
        (ROOT/idx).write_text(listing,encoding='utf-8')
        lower=ROOT/idx.lower()
        if lower!=ROOT/idx and not lower.exists():lower.write_text(listing,encoding='utf-8')
    canonical_paths=[]
    for post in final:
        canonical=post.get('canonical_url') or BASE+post['permalink']
        parsed=urllib.parse.urlsplit(canonical)
        canonical_paths.append(parsed.path or post['permalink'])
    update_sitemap(['/blog.html',*canonical_paths])
    return 0

if __name__=='__main__':sys.exit(main())
