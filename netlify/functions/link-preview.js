/* LilKangooMedia Phase 32: one crawlable OpenGraph share URL for every
 * first-party link in Links Library. Read-only public Supabase queries.
 * Every project with a published Case Study opens its STORY, not its gallery.
 * No payment, admin, upload or booking actions in this function.
 */
'use strict';
const SITE = 'https://lilkangoomedia.com';
const FALLBACK_URL = 'https://nvronzbkvwyyllbuidhw.supabase.co';
const FALLBACK_PUBLIC_KEY = 'sb_publishable_CSAqkjuGdGB54y4a2_vf9w_mYtPIIJO';
const FALLBACK_IMAGE = SITE + '/assets/images/home-meta.jpg';
const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = v => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const brief = (value, max = 235) => {
  const txt = clean(value);
  if (txt.length <= max) return txt;
  const pos = txt.lastIndexOf(' ', max);
  return txt.slice(0, pos > max / 2 ? pos : max).trimEnd() + '…';
};
const safeSlug = s => /^[a-z0-9][a-z0-9_-]{0,119}$/i.test(String(s || ''));
const safeImage = value => {
  try {
    if (typeof value !== 'string' || !value.trim() || /[\s<>"']/u.test(value)) return '';
    const u = new URL(value, SITE);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    return u.href;
  } catch { return ''; }
};
const response = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=60, s-maxage=180',
    ...headers
  }, body
});
const fail = (status, reason) => response(status,
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Link unavailable</title></head><body><p>' + escapeHtml(reason) + '</p><a href="/">LilKangooMedia</a></body></html>',
  {'Cache-Control': 'no-store'});
const API = (process.env.SUPABASE_URL || FALLBACK_URL).replace(/\/$/, '');
const KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || FALLBACK_PUBLIC_KEY;
async function rows(path) {
  const result = await fetch(API + '/rest/v1/' + path, {
    headers: {apikey: KEY, 'Content-Type': 'application/json'},
    signal: AbortSignal.timeout(7000)
  });
  if (!result.ok) throw Error('Public catalogue HTTP ' + result.status);
  return result.json();
}
const PAGE = Object.freeze({
  home: {path:'/', title:'LilKangooMedia | Photography, Film & Digital Creative Services', description:'Photography, videography, branding, websites and marketing services for people and businesses across Cyprus.', image:'/assets/images/home-meta.jpg'},
  services: {path:'/#/services',title:'Creative Services & Pricing | LilKangooMedia',description:'Explore photography, video production, branding, website development and digital marketing services.',image:'/assets/images/home-meta.jpg'},
  personal: {path:'/#/services?audience=personal',title:'Personal Photography & Video Experiences | LilKangooMedia',description:'Discover portraits, engagements, weddings, family photography and private creative experiences across Cyprus.',image:'/assets/images/portrait-15.jpg'},
  business: {path:'/#/services?audience=business',title:'Business Photography, Film & Digital Solutions | LilKangooMedia',description:'Commercial photography, video, creative design, websites, social media and marketing services for businesses.',image:'/assets/images/orofino-4.jpg'},
  about: {path:'/#/about',title:'About LilKangooMedia | Meet the Creative Team',description:'Meet the creative team behind LilKangooMedia in Cyprus, and discover our approach to photography, filmmaking, design and digital development.',image:'/assets/images/home-meta.jpg'},
  portfolio: {path:'/portfolio.html',title:'Portfolio & Project Stories | LilKangooMedia',description:'Explore photography, film, creative design and real collaborations from LilKangooMedia.',image:'/assets/images/orofino-4.jpg'},
  articles: {path:'/blog.html',title:'Photography & Cyprus Articles | LilKangooMedia',description:'Photography education, creative business insights and Cyprus destination guides from LilKangooMedia.',image:'/assets/images/home-meta.jpg'},
  reviews: {path:'/reviews.html',title:'Customer Reviews | LilKangooMedia',description:'Read customer feedback about LilKangooMedia photography and creative services in Cyprus.',image:'/assets/images/home-meta.jpg'},
  contact: {path:'/#/contact',title:'Contact LilKangooMedia | Start Your Project',description:'Discuss photography, filmmaking, branding, websites or marketing projects with LilKangooMedia in Cyprus.',image:'/assets/images/home-meta.jpg'},
  faq: {path:'/FAQ.html',title:'Frequently Asked Questions | LilKangooMedia',description:'Common questions about LilKangooMedia photography and creative services.',image:'/assets/images/home-meta.jpg'}
});
const SOCIAL = Object.freeze({
  'google-reviews': {path:'https://www.google.com/maps/place/LilKangooMedia/@35.1688,33.4252,9z/data=!4m8!3m7!1s0x14e083213d8d68e1:0xc5fa68230e0cfed8!8m2!3d35.1688!4d33.4252!9m1!1b1!16s%2Fg%2F11n88nph87',title:'LilKangooMedia | Google Reviews',description:'Read customer reviews on the official LilKangooMedia Google Business Profile.'},
  'leave-google-review': {path:'https://g.page/r/Cdj-DA4jaPrFEAE/review',title:'Review LilKangooMedia on Google',description:'Share your experience with LilKangooMedia on Google.'},
  whatsapp: {path:'https://wa.me/35799005924',title:'LilKangooMedia | WhatsApp',description:'Contact LilKangooMedia on WhatsApp about creative services in Cyprus.'},
  instagram: {path:'https://www.instagram.com/lilkangoomedia',title:'LilKangooMedia | Instagram',description:'Explore creative photography, filmmaking and content from LilKangooMedia on Instagram.'},
  facebook: {path:'https://www.facebook.com/Lilkangoomedia/',title:'LilKangooMedia | Facebook',description:'Follow LilKangooMedia on Facebook for creative projects and updates.'},
  youtube: {path:'https://www.youtube.com/channel/UCgIrKPHFpPy6srhdq4SjEtw',title:'LilKangooMedia | YouTube',description:'Watch films and creative videos from LilKangooMedia on YouTube.'}
});
const safeLocalPath = value => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('..') || /[<>"'\\]/.test(value)) return '';
  try { const u = new URL(value, SITE); return u.origin === SITE ? u.href : ''; } catch { return ''; }
};
const validYT = value => /^[A-Za-z0-9_-]{11}$/.test(String(value || ''));
async function mediaCover(gallery) {
  const images = await rows('portfolio_images?select=id,image_url&visibility=eq.public&gallery_id=eq.' + encodeURIComponent(gallery.id) + '&order=display_order.asc&limit=150');
  const photo = images.find(p => p.id === gallery.cover_image_id) || images[0];
  let image = safeImage(photo?.image_url);
  if (!image) {
    try {
      const videos = await rows('media_videos?select=youtube_id&visibility=eq.public&gallery_id=eq.' + encodeURIComponent(gallery.id) + '&limit=1');
      const id = videos[0]?.youtube_id;
      if (validYT(id)) image = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    } catch { /* Gallery may have photos only. */ }
  }
  return image || FALLBACK_IMAGE;
}
async function lookupArticle(slug) {
  const path = 'blog_posts?select=slug,title,excerpt,cover_url,seo_title,seo_description,legacy_path,status,published_at&status=eq.published&slug=eq.' + encodeURIComponent(slug) + '&limit=1';
  let post;
  try { post = (await rows(path))[0]; } catch { /* Use public build manifest below. */ }
  if (!post) {
    try {
      const res = await fetch(SITE + '/assets/lkm-v3/articles-index.json', {signal: AbortSignal.timeout(5500)});
      if (res.ok) {
        const index = await res.json();
        post = (Array.isArray(index.posts) ? index.posts : []).find(p => p.slug === slug && p.status !== 'draft');
      }
    } catch { /* No verified public article available. */ }
  }
  if (!post) return null;
  if (post.published_at && Date.parse(post.published_at) > Date.now()) return null;
  const direct = safeLocalPath(post.permalink || post.legacy_path || '/articles/' + encodeURIComponent(slug) + '.html');
  if (!direct) return null;
  return {title:post.seo_title || post.title,description:post.seo_description || post.excerpt || 'Photography and creative insights from LilKangooMedia.',image:safeImage(post.cover_url),direct,type:'article'};
}
async function details(kind, slug) {
  if (kind === 'page') {
    const p = PAGE[slug];
    return p && {title:p.title,description:p.description,image:safeImage(p.image),direct:SITE + p.path,type:'website'};
  }
  if (kind === 'social') {
    const p = SOCIAL[slug];
    return p && {title:p.title,description:p.description,image:SITE + '/assets/images/home-meta.jpg',direct:p.path,type:'website'};
  }
  if (kind === 'article') return lookupArticle(slug);
  if (kind === 'service') {
    const s = (await rows('services?select=slug,title,summary,description,cover_url&active=eq.true&slug=eq.' + encodeURIComponent(slug) + '&limit=1'))[0];
    if (!s) return null;
    return {title:clean(s.title) + ' | LilKangooMedia',description:s.summary || s.description || 'Photography and creative services in Cyprus.',image:safeImage(s.cover_url),direct:SITE + '/#/service/' + encodeURIComponent(slug),type:'product'};
  }
  if (kind === 'gallery' || kind === 'story') {
    const g = (await rows('portfolio_galleries?select=id,slug,title,description,category,cover_image_id&visibility=eq.public&slug=eq.' + encodeURIComponent(slug) + '&limit=1'))[0];
    if (!g) return null;
    const studies = await rows('lkm_case_studies?select=gallery_id,headline,objective,is_published&gallery_id=eq.' + encodeURIComponent(g.id) + '&is_published=eq.true&limit=1');
    const story = studies?.[0] || null;
    if (kind === 'story' && !story) return null;
    const direct = story ? SITE + '/portfolio.html#/story/' + encodeURIComponent(slug) : SITE + '/portfolio.html#/gallery/' + encodeURIComponent(slug);
    const headline = story ? clean(story.headline) : clean(g.title);
    return {title:headline + ' | LilKangooMedia',description:story ? (story.objective || g.description) : (g.description || 'Discover creative work by LilKangooMedia.'),image:await mediaCover(g),direct,type:story?'article':'website'};
  }
  return null;
}
function renderPage({kind,slug,info}) {
  const share = SITE + '/share/' + kind + '/' + encodeURIComponent(slug);
  const title = brief(info.title, 180) || 'LilKangooMedia';
  const description = brief(info.description, 235) || 'Photography, filmmaking and creative services across Cyprus.';
  const image = safeImage(info.image) || FALLBACK_IMAGE;
  const direct = info.direct;
  const scriptDestination = JSON.stringify(direct).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="noindex,follow">
<link rel="canonical" href="${escapeHtml(direct)}">
<meta property="og:type" content="${info.type === 'article' ? 'article' : 'website'}"><meta property="og:site_name" content="LilKangooMedia">
<meta property="og:url" content="${escapeHtml(share)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:secure_url" content="${escapeHtml(image)}"><meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
<script>window.location.replace(${scriptDestination});</script></head><body><p>Opening <a href="${escapeHtml(direct)}">${escapeHtml(title)}</a>…</p></body></html>`;
  return response(200, html);
}
export const handler = async function(event) {
  const kind = event.queryStringParameters?.kind;
  const slug = event.queryStringParameters?.slug;
  if (!['service','gallery','story','article','page','social'].includes(kind) || !safeSlug(slug)) return fail(400,'Invalid share link.');
  try {
    const info = await details(kind, slug);
    return info ? renderPage({kind,slug,info}) : fail(404,'This public page is not available.');
  } catch (err) {
    console.error('LilKangooMedia share preview lookup failed:', err);
    return fail(503,'Preview temporarily unavailable. Please try again.');
  }
};
