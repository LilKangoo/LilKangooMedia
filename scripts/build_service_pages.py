#!/usr/bin/env python3
"""LKM Phase 25.2: deterministic, safe, English-only SEO pages for verified seed service slugs.

Uses existing checked-in seed *only to verify slug, title, activity and cover URL*.
Copy and FAQ content is manually curated, not AI-like inflated claims, and has no prices,
reviews, outcomes, availability or booking promises. Public live service catalogue is
still the authority for actual bookable services/prices. No external network or secrets.
"""
from __future__ import annotations
import argparse
from html import escape
import json
from pathlib import Path
import re

BASE = 'https://lilkangoomedia.com'
# Each page gets distinct, modest, factual copy. Do not add unsupported pricing or performance claims.
PAGES = {
 'portrait-photography': dict(title='Portrait & Family Photography', short='Portrait and family photography in Cyprus',
  intro='Planning a portrait session, couple shoot or family photograph in Cyprus? Explore location photography with LilKangooMedia, including options for individuals, couples and families.',
  value='A session is shaped by who is being photographed, the location, the occasion and the type of images you need. Tell us your ideas and we can discuss a practical plan.',
  points=['Portraits for individuals and couples','Family sessions and meaningful occasions','Locations and image delivery discussed in advance'],
  questions=[('Can we choose the location?', 'Share your preferred location in Cyprus when you enquire so we can discuss the session plan.'),('How many images will I receive?', 'Image quantity and editing depend on the current package and agreed scope. Review the live service options before booking.')]),
 'personal-videography': dict(title='Personal Videography',short='Personal videos and films in Cyprus',
  intro='Capture an important occasion or personal experience in motion. LilKangooMedia offers personal videography and edited films for people visiting or living in Cyprus.',
  value='Start with the moment you want to document. We can discuss filming time, locations, the style of the finished video and the format you would like to receive.',
  points=['Filming of personal experiences and occasions','Planning around location and desired coverage','Editing and final deliverables defined in the quote'],
  questions=[('Can I request a particular video style?', 'Describe your preferred style when sending your enquiry. We will review what fits the project.'),('Is editing included?', 'Editing and deliverables depend on the selected package or written quotation.')]),
 'wedding-photography-video': dict(title='Weddings & Engagements',short='Wedding, engagement and proposal photography in Cyprus',
  intro='Photography and video for weddings, engagements and proposals in Cyprus. Discuss your plans, locations and the moments you would like to remember.',
  value='Coverage needs differ between a short proposal, a ceremony and a full-day celebration. We prepare a scope based on your occasion and requested photo or video services.',
  points=['Engagement and proposal coverage','Wedding photography and video planning','A tailored schedule and deliverables agreed in advance'],
  questions=[('Can you photograph a proposal?', 'Tell us the date, setting and the type of surprise or proposal you are planning.'),('Do you offer both photography and video?', 'Photography and video options can be discussed together when preparing your enquiry.')]),
 'cyprus-photo-trips': dict(title='Cyprus Photo Trips',short='Private photo excursions in Cyprus',
  intro='Explore Cyprus while creating personal photographic memories. Private photo trips combine a planned outing with photography tailored to your group and interests.',
  value='Let us know where you are staying, the areas you would like to visit and how much time you have. The route and photo coverage can then be discussed together.',
  points=['Private outings with photography','Route and timing discussed around your preferences','Photo deliverables agreed before the trip'],
  questions=[('Can we customise the itinerary?', 'Share your interests and preferred stops. The final route depends on travel time and the agreed booking.'),('Can we start from a different city?', 'Include your pickup area in the enquiry so travel arrangements can be discussed.')]),
 'cyprus-video-trips': dict(title='Cyprus Video Trips',short='Private travel video experiences in Cyprus',
  intro='Turn a Cyprus outing into a personal travel film. Discuss filming during a private trip and the story you would like the final edited video to tell.',
  value='A travel video project combines itinerary choices, filming conditions and editing. We will discuss the plan and final format before confirming the work.',
  points=['Filming during private outings','A video approach matched to the locations and people','Editing scope and delivery agreed by quotation'],
  questions=[('Can we choose destinations?', 'Share the places you hope to visit and we will discuss a workable itinerary.'),('What length will the finished film be?', 'The final film length depends on the selected package or a custom quotation.')]),
 'private-events': dict(title='Celebrations & Events',short='Event photography and video coverage in Cyprus',
  intro='Photography and video coverage for birthdays, anniversaries, christenings and private celebrations across Cyprus. Tell us about your event to explore appropriate coverage.',
  value='Useful details include the venue, date, expected guests, event schedule and any important moments you want captured.',
  points=['Photography for family and private occasions','Video coverage on request','Timing, venue and deliverables specified in your proposal'],
  questions=[('Do you travel to the event?', 'Send your venue location so travel and timing can be discussed.'),('Can we get a custom quote?', 'Yes. Describe the occasion and coverage required in your enquiry.')]),
 'product-brand-photography': dict(title='Product & Brand Photography',short='Commercial and product photography in Cyprus',
  intro='Product, brand and business photography for companies operating in Cyprus. Explore photo content for products, campaigns, teams and hospitality businesses.',
  value='A useful brief identifies what needs photographing, the intended use, location, number of products or subjects and required deliverable formats.',
  points=['Product and campaign imagery','Business portraits and brand content','Image usage and editing requirements agreed in the scope'],
  questions=[('Can you photograph products for an online store?', 'Tell us the products, number of items and image types you need so we can propose a scope.'),('Can I request a content shoot for my business?', 'Yes. Share the location, intended channels and types of imagery required.')]),
 'commercial-video-reels': dict(title='Commercial Video & Reels',short='Commercial video and social media reels in Cyprus',
  intro='Creative video production for Cyprus businesses, including commercial reels, branded films and event content. Discuss filming, editing and deliverables for your campaign.',
  value='The right scope depends on the story, filming location, people involved, platforms and required versions of the final video.',
  points=['Short-form branded reels','Commercial and business event filming','Editing and format options outlined in the proposal'],
  questions=[('Can videos be made for social media?', 'Tell us which platforms and formats you need when requesting a quote.'),('Do you provide editing?', 'Editing scope and final formats are agreed as part of the specific project.')]),
 'social-media-management': dict(title='Social Media Management',short='Social media content and management in Cyprus',
  intro='Social media management and creative content for Cyprus businesses. Explore support with content planning, production, publishing and campaign direction.',
  value='A management proposal starts with your business goals, channels, posting needs, existing assets and preferred level of ongoing support.',
  points=['Content planning and social media creative work','Monthly management options based on scope','Posting and reporting requirements discussed in advance'],
  questions=[('Is social media management available monthly?', 'Share the channels and monthly workload you need so we can discuss an appropriate plan.'),('Can you also produce photos and video?', 'Photography and video services can be included in a combined proposal when needed.')]),
 'graphic-design': dict(title='Graphic Design & Brand Identity',short='Brand identity and graphic design in Cyprus',
  intro='Graphic design for Cyprus businesses, including identity, promotional visuals, campaign assets and social media graphics.',
  value='Share your intended use, brand guidelines, required dimensions and any existing logos or source material. A design brief helps define revisions and deliverables.',
  points=['Brand and identity visual assets','Posters and campaign creative','Social media graphic formats and deliverables'],
  questions=[('Can you work with an existing logo?', 'Include your brand materials and intended usage in the design brief.'),('Are files prepared for print or online?', 'Specify your intended formats in the request so delivery requirements can be confirmed.')]),
 'website-design': dict(title='Website Design & Development',short='Website design and development for Cyprus businesses',
  intro='Website design and development for businesses in Cyprus. Explore options for responsive websites and digital experiences built around your content and customer needs.',
  value='Before quoting, we discuss page count, language, design requirements, integrations, content, ownership and ongoing maintenance needs.',
  points=['Responsive website design','Business websites and online sales requirements','Hosting, maintenance and integrations scoped separately'],
  questions=[('Can you build a website for a new business?', 'Describe the business and required features so the website scope can be estimated.'),('How is a website priced?', 'Pricing depends on the confirmed features and support requirements. Request a project quotation for current terms.')]),
 'brand-launch-packages': dict(title='Business Setup Packages',short='Brand launch and business content packages in Cyprus',
  intro='Creative launch packages for new and growing businesses in Cyprus. Bring together photography, branding, website work and content creation in one project discussion.',
  value='The package is defined around what you already have, what you need first, your launch schedule and the digital channels you plan to use.',
  points=['Brand identity and launch visuals','Photo, video and website options','A coordinated custom project quotation'],
  questions=[('Can I combine multiple services?', 'Yes. Explain which services matter most and we will discuss a suitable scope.'),('Is the launch package fixed?', 'The final inclusions and price are confirmed through your individual proposal.')]),
 'marketing-advertising': dict(title='Marketing & Advertising',short='Marketing creative and advertising support in Cyprus',
  intro='Marketing and advertising support for Cyprus businesses. Explore campaign content, creative strategy and visual production for your brand.',
  value='The first step is to understand your target audience, business objectives, channels, available materials and realistic campaign brief.',
  points=['Marketing planning and creative direction','Photo, video and design for campaigns','Project deliverables and reporting discussed in the proposal'],
  questions=[('Do you manage advertising campaigns?', 'Describe your channels and goals so we can confirm whether the requested work fits the service scope.'),('Can we begin with a one-off campaign?', 'Share your project duration and assets needed. A one-off or ongoing proposal can be discussed.')]),
}


def html(s): return escape(str(s), quote=True)

def seed_list(root):
    path=root/'assets/lkm-v3/seed.js'
    source=path.read_text(encoding='utf-8')
    match=re.fullmatch(r'\s*window\.LKM_SEED\s*=\s*(\[.*\])\s*;?\s*',source,re.S)
    if not match: raise ValueError('Unexpected seed.js format; refusing to generate SEO pages')
    data=json.loads(match.group(1))
    if not isinstance(data,list): raise ValueError('Expected seed array')
    return data

def safe_cover(u):
    if isinstance(u,str) and re.fullmatch(r'/assets/images/[A-Za-z0-9_.\-/]+',u) and '..' not in u and '//' not in u:return u
    return '/assets/images/home-meta.jpg'

def layout(title,description,canonical,body,ogimage,structured):
    # Structured data authored by this script; json.dumps protects double quotes.
    schema=json.dumps(structured,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e')
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#171917">
<title>{html(title)}</title><meta name="description" content="{html(description)}">
<link rel="canonical" href="{html(canonical)}"><meta name="robots" content="index,follow">
<link rel="icon" href="/assets/lkm-v3/brand/logo-profile.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="LilKangooMedia">
<meta property="og:title" content="{html(title)}"><meta property="og:description" content="{html(description)}">
<meta property="og:url" content="{html(canonical)}"><meta property="og:image" content="{html(BASE+ogimage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/lkm-v3/service-seo.css">
<script type="application/ld+json">{schema}</script>
<script src="/lkm-config.js" defer></script><script type="module" src="/assets/lkm-v3/service-seo.mjs"></script>
</head><body class="lkm25-page">
<a class="lkm25-skip" href="#main">Skip to main content</a>
<header class="lkm25-header"><div class="lkm25-navwrap"><a class="lkm25-brand" href="/"><img src="/assets/lkm-v3/brand/logo-profile.png" width="43" height="43" alt=""><strong>LilKangooMedia</strong></a><nav aria-label="Navigation"><a href="/services/index.html">All services</a><a href="/portfolio.html">Portfolio</a><a href="/business-solutions.html">For business</a><a href="/#/contact">Contact</a></nav></div></header>
{body}
<footer class="lkm25-footer"><span>© LilKangooMedia LTD · Cyprus</span><div><a href="/services/index.html">Service guides</a><a href="/portfolio.html">Our work</a><a href="/FAQ.html">FAQ</a><a href="/#/contact">Contact</a></div></footer>
</body></html>
'''

def breadcrumbs(entries):
    return '<nav class="lkm25-crumbs" aria-label="Breadcrumb">'+'<span class="lkm25-crumbsep"> / </span>'.join(f'<a href="{html(href)}">{html(label)}</a>' for label,href in entries)+'</nav>'

def page_html(slug,seed):
    copy=PAGES[slug];name=copy['title'];title=f'{copy["short"][0].upper()+copy["short"][1:]} | LilKangooMedia'
    description=(copy['intro'][:153].rsplit(' ',1)[0].rstrip(' .,;:')+'…') if len(copy['intro'])>155 else copy['intro']
    canonical=f'{BASE}/services/{slug}.html';cover=safe_cover(seed.get('cover_url'))
    points=''.join(f'<li>{html(i)}</li>' for i in copy['points'])
    faqs=''.join(f'<details><summary>{html(q)}</summary><p>{html(a)}</p></details>' for q,a in copy['questions'])
    related_by_slug={
      'portrait-photography':['wedding-photography-video','cyprus-photo-trips'],
      'personal-videography':['cyprus-video-trips','private-events'],
      'wedding-photography-video':['portrait-photography','personal-videography'],
      'cyprus-photo-trips':['portrait-photography','cyprus-video-trips'],
      'cyprus-video-trips':['cyprus-photo-trips','personal-videography'],
      'private-events':['portrait-photography','wedding-photography-video'],
      'product-brand-photography':['commercial-video-reels','social-media-management'],
      'commercial-video-reels':['product-brand-photography','social-media-management'],
      'social-media-management':['commercial-video-reels','marketing-advertising'],
      'graphic-design':['brand-launch-packages','website-design'],
      'website-design':['brand-launch-packages','graphic-design'],
      'brand-launch-packages':['website-design','product-brand-photography'],
      'marketing-advertising':['social-media-management','commercial-video-reels'],
    }
    related=[(s,PAGES[s]) for s in related_by_slug[slug]]
    links=''.join(f'<a href="/services/{html(s)}.html">{html(r["title"])} <span aria-hidden="true">↗</span></a>' for s,r in related)
    body=f'''<main id="main" data-service-slug="{html(slug)}">
<section class="lkm25-hero"><div class="lkm25-wrap">{breadcrumbs([('Home','/'),('Service guides','/services/index.html')])}
<div class="lkm25-hero-grid"><div><p class="lkm25-eyebrow">CREATIVE SERVICES · CYPRUS</p><h1>{html(name)}</h1><p class="lkm25-lead">{html(copy['intro'])}</p>
<div class="lkm25-actions"><a id="lkmServiceMainCta" class="lkm25-button lkm25-button-primary" href="/#/service/{html(slug)}">Explore current packages <span aria-hidden="true">↗</span></a><a class="lkm25-button lkm25-button-secondary" href="/#/contact">Discuss your project</a></div>
<p class="lkm25-small">Across Cyprus · Package details, availability and final pricing are confirmed through our current service catalogue.</p></div>
<div class="lkm25-cover"><img src="{html(cover)}" alt="{html(name)} — LilKangooMedia service" loading="eager" decoding="async"></div></div></div></section>
<section class="lkm25-wrap lkm25-content"><div><p class="lkm25-eyebrow">WHAT TO CONSIDER</p><h2>Plan the coverage around your needs</h2><p>{html(copy['value'])}</p></div><div class="lkm25-scope"><h3>Areas we can discuss</h3><ul>{points}</ul></div></section>
<section class="lkm25-wrap lkm25-available" aria-labelledby="current-service-heading"><div><p class="lkm25-eyebrow">CURRENT SERVICE INFORMATION</p><h2 id="current-service-heading">Choose the right option</h2><p>Open the live service catalogue to select available packages or send a tailored enquiry. Prices and inclusions can change, so they are not reproduced on this page.</p></div><div id="lkm25-live-service" class="lkm25-live" aria-live="polite"><p>View the current packages, options and booking mode in our service catalogue.</p><a href="/#/service/{html(slug)}">See service details ↗</a></div></section>
<section class="lkm25-wrap lkm25-faq"><p class="lkm25-eyebrow">BEFORE YOU ENQUIRE</p><h2>Common questions</h2>{faqs}</section>
<section class="lkm25-wrap lkm25-next"><div><p class="lkm25-eyebrow">START A PROJECT</p><h2>Tell us what you have in mind</h2><p>We can discuss your brief, the date or timeframe, location, and what you would like delivered.</p><a class="lkm25-button lkm25-button-primary" href="/#/service/{html(slug)}">Configure this service ↗</a></div><div><h3>Explore related services</h3>{links}<a href="/services/index.html">All service guides ↗</a></div></section>
</main>'''
    data={'@context':'https://schema.org','@graph':[
     {'@type':'WebPage','name':name,'url':canonical,'description':description,'inLanguage':'en'},
     {'@type':'Service','name':name,'serviceType':name,'description':copy['intro'], 'areaServed':{'@type':'Country','name':'Cyprus'},'provider':{'@type':'Organization','name':'LilKangooMedia LTD','url':BASE}},
     {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':BASE+'/'},{'@type':'ListItem','position':2,'name':'Services','item':BASE+'/services/index.html'},{'@type':'ListItem','position':3,'name':name,'item':canonical}]}
    ]}
    return layout(title,description,canonical,body,cover,data)

def hub_html(seeds):
    featured=sorted(seeds,key=lambda s:(s.get('audience')!='business',s.get('sort_order') or 0))
    cards=''.join(f'<a class="lkm25-service-card" href="/services/{html(s["slug"])}.html"><span class="lkm25-category">{html("For business" if s.get("audience")=="business" else "Personal & experiences")}</span><h2>{html(PAGES[s["slug"]]["title"])}</h2><p>{html(PAGES[s["slug"]]["intro"][:170])}</p><span class="lkm25-card-action">Explore service ↗</span></a>' for s in featured)
    body=f'''<main id="main"><section class="lkm25-hero"><div class="lkm25-wrap">{breadcrumbs([('Home','/')])}<p class="lkm25-eyebrow">LILKANGOOMEDIA · CYPRUS</p><h1>Photography, film & creative services</h1><p class="lkm25-lead">Explore LilKangooMedia services for people and businesses across Cyprus. Compare the kind of work available, then open the live catalogue for packages, current details and a custom enquiry.</p><div class="lkm25-actions"><a class="lkm25-button lkm25-button-primary" href="/#/services">Browse current catalogue ↗</a><a class="lkm25-button lkm25-button-secondary" href="/business-solutions.html">Solutions for businesses</a></div></div></section>
<section class="lkm25-wrap lkm25-hub"><p class="lkm25-eyebrow">SERVICES</p><h2>Find the right starting point</h2><div class="lkm25-service-grid">{cards}</div></section>
<section class="lkm25-wrap lkm25-next"><div><h2>Have a project that combines several services?</h2><p>Photography, video, websites and marketing can be discussed together as a tailored enquiry.</p><a class="lkm25-button lkm25-button-primary" href="/business-solutions.html">Explore business solutions ↗</a></div><div><h3>Prefer to discuss it directly?</h3><p>Send an enquiry with your goals, location and approximate timeframe.</p><a href="/#/contact">Contact LilKangooMedia ↗</a></div></section></main>'''
    url=BASE+'/services/index.html';desc='Explore photography, film, websites, graphic design and marketing services across Cyprus with LilKangooMedia. Open live packages or request a quote.'
    return layout('Creative Services in Cyprus | LilKangooMedia',desc,url,body,'/assets/images/home-meta.jpg',{'@context':'https://schema.org','@type':'CollectionPage','name':'Creative services in Cyprus','description':desc,'url':url,'inLanguage':'en'})

def inject_home_links(root):
    for filename in ('index.html','home.html'):
        path=root/filename
        if not path.is_file(): continue
        text=path.read_text(encoding='utf-8')
        if 'href="/services/index.html"' in text: continue
        marker='<a href="/business-solutions.html">Business Solutions</a>'
        if marker not in text:
            print(f'WARNING: {filename} footer marker missing; no modifications made')
            continue
        text=text.replace(marker,marker+'<a href="/services/index.html">Service Guides</a>',1)
        path.write_text(text,encoding='utf-8')

def build(root):
    records=seed_list(root)
    seen=set();active=[]
    for item in records:
        if not isinstance(item,dict): continue
        s=item.get('slug');
        if s not in PAGES or not re.fullmatch(r'[a-z0-9-]{1,90}',s) or s in seen or item.get('active') is False: continue
        seen.add(s);active.append(item)
    if not active: raise ValueError('No active, approved seed services; refuse to publish SEO pages')
    output=root/'services';output.mkdir(parents=True,exist_ok=True)
    # Retire only pages that have our own generator marker, never independent site files.
    valid={s['slug']+'.html' for s in active}|{'index.html'}
    for path in output.glob('*.html'):
        if path.name not in valid and '<!-- LKM GENERATED SEO SERVICE -->' in path.read_text(encoding='utf-8',errors='replace')[:500]:
            path.unlink()
    urls=['/services/index.html']
    for row in active:
        name=row['slug']+'.html';output.joinpath(name).write_text('<!-- LKM GENERATED SEO SERVICE -->\n'+page_html(row['slug'],row),encoding='utf-8');urls.append('/services/'+name)
    output.joinpath('index.html').write_text('<!-- LKM GENERATED SEO SERVICE -->\n'+hub_html(active),encoding='utf-8')
    index=root/'assets/lkm-v3/service-seo-index.json';index.parent.mkdir(parents=True,exist_ok=True)
    index.write_text(json.dumps({'version':1,'paths':urls},indent=2)+'\n',encoding='utf-8')
    inject_home_links(root)
    return len(active)

def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=p.parse_args()
    print(f'Phase 25.2 generated {build(args.root)} English-only service SEO pages plus hub (no prices or fabricated reviews).')
if __name__=='__main__':main()
