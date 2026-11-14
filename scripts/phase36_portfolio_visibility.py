#!/usr/bin/env python3
"""LilKangooMedia Phase 36: portfolio gallery/category and case-study listing fix.

Runs at the END of the existing Netlify build, AFTER Phase 35 image enhancement.
Changes only emitted Javascript assets in Netlify's build workspace. The source
files in GitHub stay unchanged, and all original public galleries and case data
remain untouched. An unknown source layout aborts instead of applying a guess.
"""
from __future__ import annotations
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent


def apply(relative: str, changes: list[tuple[str,str,str]]) -> None:
    path = ROOT / relative
    original = path.read_text(encoding='utf-8')
    content = original
    for label, before, after in changes:
        if after in content:
            continue
        count = content.count(before)
        if count != 1:
            raise RuntimeError(f'{relative}: {label}: expected 1 matching block, found {count}. '
                               'No guessing; stopped before deployment.')
        content = content.replace(before, after, 1)
    if content != original:
        path.write_text(content, encoding='utf-8')
        print(f'  adjusted {relative}')


def main():
    print('[LKM Phase 36] Portfolio: only visible gallery categories, all stories in admin order')

    apply('assets/lkm-v3/cms-public.js', [
        ('browsable gallery categories',
         "const cats=()=>['All',...new Set(galleries.map(g=>g.category||'Other'))];",
         """// Use the SAME public gallery-card visibility as the admin. A project may have a
// public Case Study even when its separate gallery card is intentionally hidden.
// Don't expose empty categories: they need at least one public photo or film.
const browsableGalleries=()=>galleries.filter(g=>
 g.show_in_portfolio!==false &&
 (images.some(i=>i.gallery_id===g.id)||videos.some(v=>v.gallery_id===g.id))
);
const cats=()=>['All',...new Set(browsableGalleries().map(g=>g.category||'Other'))];"""),
        ('gallery grid filtering',
         "function galleryList(){const visible=galleries.filter(g=>filter==='All'||g.category===filter);",
         """function galleryList(){
 const available=cats();
 if(!available.includes(filter))filter='All';
 const visible=browsableGalleries().filter(g=>filter==='All'||(g.category||'Other')===filter);"""),
    ])

    apply('assets/lkm-v3/portfolio-stories.mjs', [
        ('admin ordering fields',
         'related_service_slug,visibility,cover_image_id&visibility=eq.public&limit=1000',
         'related_service_slug,visibility,cover_image_id,show_on_home,home_sort_order&visibility=eq.public&limit=1000'),
        ('published story order',
         'state.stories=cases.filter(s=>publishedCase(s,state.galleries.get(s.gallery_id)));',
         """state.stories=cases.filter(s=>publishedCase(s,state.galleries.get(s.gallery_id))).sort((a,b)=>{
      const ga=state.galleries.get(a.gallery_id)||{},gb=state.galleries.get(b.gallery_id)||{};
      // First follow the explicitly curated Home sequence, then other
      // published Case Studies. Unchecking Home never unpublishes a story.
      const fa=ga.show_on_home===true?0:1,fb=gb.show_on_home===true?0:1;
      if(fa!==fb)return fa-fb;
      const rank=g=>g.home_sort_order==null?999999:Number(g.home_sort_order);
      const ra=rank(ga),rb=rank(gb);
      if(Number.isFinite(ra)&&Number.isFinite(rb)&&ra!==rb)return ra-rb;
      // Keep remaining items predictable when no specific rank is assigned.
      const ta=Date.parse(a.updated_at||a.created_at||'')||0;
      const tb=Date.parse(b.updated_at||b.created_at||'')||0;
      if(ta!==tb)return tb-ta;
      return String(ga.slug||'').localeCompare(String(gb.slug||''));
    });"""),
        ('remove three-card limit',
         'for(const story of (full?state.stories:state.stories.slice(0,3)))grid.append(storyCard(story));',
         'for(const story of state.stories)grid.append(storyCard(story));'),
    ])
    print('[LKM Phase 36] OK: No SQL changes. Direct gallery links and Case Studies retained.')


if __name__=='__main__':
    try:
        main()
    except (OSError,RuntimeError) as exc:
        print('PORTFOLIO BUILD SAFETY STOP:',exc,file=sys.stderr)
        sys.exit(1)
