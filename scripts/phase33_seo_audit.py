#!/usr/bin/env python3
"""Read-only audit of generated public HTML. Writes machine-readable report and warnings.
Never rewrites page copy or creates unsupported SEO claims. Running it never
blocks deploy merely because an old legacy page lacks best-practice metadata.
"""
from __future__ import annotations
import argparse, collections, json, re, urllib.parse
from pathlib import Path

BASE='https://lilkangoomedia.com'

def attr(tag,name):
  p=re.search(r'\b'+re.escape(name)+r'\s*=\s*(["\'])(.*?)\1',tag,re.I|re.S)
  return p.group(2).strip() if p else ''
def meta(head,attr_name,value):
  for m in re.finditer(r'<meta\b[^>]*>',head,re.I):
    t=m.group(0)
    if attr(t,attr_name).casefold()==value.casefold():return attr(t,'content')
  return ''
def canonical(head):
  for m in re.finditer(r'<link\b[^>]*>',head,re.I):
    t=m.group(0)
    if attr(t,'rel').casefold()=='canonical':return attr(t,'href')
  return ''
def audit(root):
  sources=[p for p in root.glob('*.html') if not p.name.lower().startswith(('admin','cms','client','proposal','shop'))]
  for dirname in ('services','articles'):
    sources.extend((root/dirname).glob('*.html'))
  issues=[];seen=collections.defaultdict(list);n=0
  for file in sources:
    try: text=file.read_text(encoding='utf-8',errors='replace');head=text.split('</head>',1)[0][:25000]
    except OSError:continue
    if not re.search(r'<html',head,re.I):continue
    if 'noindex' in meta(head,'name','robots').lower():continue
    n+=1;path='/'+file.relative_to(root).as_posix()
    title_match=re.search(r'<title\b[^>]*>(.*?)</title>',head,re.I|re.S)
    title=re.sub(r'\s+',' ',title_match.group(1)).strip() if title_match else ''
    desc=meta(head,'name','description')
    og=meta(head,'property','og:image')
    link=canonical(head)
    if not title:issues.append({'path':path,'problem':'missing_title'})
    if not desc:issues.append({'path':path,'problem':'missing_meta_description'})
    if not link:issues.append({'path':path,'problem':'missing_canonical'})
    if not og:issues.append({'path':path,'problem':'missing_og_image'})
    if title:seen[title.casefold()].append(path)
    if link and not link.startswith(BASE+'/'):issues.append({'path':path,'problem':'non_local_canonical','value':link[:160]})
    if og.startswith(BASE+'/'):
      image_path=urllib.parse.urlsplit(og).path.lstrip('/')
      if not (root/image_path).is_file():issues.append({'path':path,'problem':'missing_local_og_file','value':image_path})
    if og.startswith('/') and not og.startswith('//') and not (root/og.lstrip('/')).is_file():issues.append({'path':path,'problem':'missing_local_og_file','value':og})
  duplicates=[{'title':k,'paths':v} for k,v in seen.items() if len(v)>1]
  result={'version':'33-0','public_html_checked':n,'issues':issues,'duplicate_titles':duplicates,'notes':['Generated case-study and new-service HTML is served through Netlify Functions, so it is not included in the build-time static HTML scan.','Legacy file aliases can legitimately have duplicate titles. Review before changing URLs or canonical values.']}
  path=root/'assets/lkm-v3/seo-audit.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  print(f'Phase 33 SEO audit: {n} static pages, {len(issues)} metadata warnings, {len(duplicates)} duplicate title groups')
  for issue in issues[:12]:print('  WARN',issue['path'],issue['problem'])
  return result

def main():
  p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=p.parse_args();audit(args.root)
if __name__=='__main__':main()
