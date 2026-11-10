/* Phase 22.4: sector ideas, NOT confirmed prices or fixed commercial packages.
 * Only public active service records determine which links and titles appear.
 */
export const SECTORS = Object.freeze({
  hub: {
    label:'Business Solutions', title:'Creative services built around your business',
    intro:'Choose your industry, explore a suggested combination of services and tell us what your business needs. Every brief is reviewed individually.',
    focus:'Find the right starting point for your next project',
    sectors:['restaurants','hotels','retail','brands'],
    packages:[]
  },
  restaurants: {
    label:'Restaurants & Cafés', title:'Make your food, venue and story stand out',
    intro:'Plan photography, short-form video and ongoing content for restaurants, cafés, bars and hospitality venues across Cyprus.',
    focus:'From a new menu to a season of content',
    highlights:['Food, drinks and venue visuals','Short videos for social media','Ongoing content and online presence'],
    packages:[
      {key:'restaurant-visuals',name:'Menu & venue visuals',summary:'A starting point for presenting your dishes, drinks and atmosphere.',slugs:['product-brand-photography','commercial-video-reels']},
      {key:'restaurant-social',name:'Always-on content',summary:'For businesses that want a repeatable content and social-media workflow.',slugs:['commercial-video-reels','social-media-management']},
      {key:'restaurant-launch',name:'Opening or refresh',summary:'Discuss the assets and digital presentation needed around a launch.',slugs:['graphic-design','website-design','product-brand-photography']}
    ]
  },
  hotels: {
    label:'Hotels & Stays', title:'Show travellers what makes your property different',
    intro:'Explore photography, film, websites and campaign materials for hotels, holiday accommodation and hospitality businesses in Cyprus.',
    focus:'A clearer presentation before guests arrive',
    highlights:['Visuals of spaces and experiences','Short property and destination films','Guest-facing website and campaign content'],
    packages:[
      {key:'hotel-visuals',name:'Property presentation',summary:'Bring together photography and video for your digital channels.',slugs:['product-brand-photography','commercial-video-reels']},
      {key:'hotel-campaign',name:'Seasonal storytelling',summary:'Explore a content plan for promotions and seasonal visibility.',slugs:['commercial-video-reels','social-media-management','marketing-advertising']},
      {key:'hotel-digital',name:'Digital guest journey',summary:'Discuss a joined-up website, visual identity and supporting media.',slugs:['website-design','graphic-design','product-brand-photography']}
    ]
  },
  retail: {
    label:'Retail & E-commerce', title:'Put your products in their best light',
    intro:'Create a clearer product presentation with photography, campaigns, visual design and websites for shops and online brands.',
    focus:'From product photos to campaign-ready materials',
    highlights:['Product and catalogue photography','Short-form product video','Digital campaigns and web presence'],
    packages:[
      {key:'retail-launch',name:'Product launch essentials',summary:'Combine product visuals and design for a new release.',slugs:['product-brand-photography','commercial-video-reels','graphic-design']},
      {key:'retail-content',name:'Social storefront',summary:'Plan fresh visual content and ongoing communication.',slugs:['product-brand-photography','social-media-management']},
      {key:'retail-digital',name:'Online shop presence',summary:'Discuss the website and media your products need online.',slugs:['website-design','product-brand-photography','marketing-advertising']}
    ]
  },
  brands: {
    label:'Brands & Companies', title:'A clearer, stronger presence for your business',
    intro:'Bring together creative production, graphic design, website development and marketing for your company in Cyprus.',
    focus:'Connected creative services, one business brief',
    highlights:['Brand and campaign design','Commercial video and photography','Websites and marketing materials'],
    packages:[
      {key:'brand-identity',name:'Visual identity',summary:'Explore a recognizable brand language and supporting photography.',slugs:['graphic-design','product-brand-photography']},
      {key:'brand-campaign',name:'Campaign content',summary:'Plan original media and content across selected channels.',slugs:['commercial-video-reels','marketing-advertising','social-media-management']},
      {key:'brand-presence',name:'Digital presence',summary:'Discuss web, design and regular communication together.',slugs:['website-design','graphic-design','social-media-management']}
    ]
  }
});

export const SECTOR_LINKS = Object.freeze({
  hub:'/business-solutions.html',
  restaurants:'/business-restaurants.html',
  hotels:'/business-hotels.html',
  retail:'/business-retail.html',
  brands:'/business-brands.html'
});

export function validSlug(x){return typeof x==='string' && /^[a-z0-9-]{1,90}$/.test(x)}

export function activeBusinessServices(input){
  if(!Array.isArray(input))return [];
  const seen=new Set();
  return input.filter(s=>{
    if(!s||s.active===false||s.audience!=='business'||!validSlug(s.slug)||typeof s.title!=='string'||!s.title.trim()||seen.has(s.slug))return false;
    seen.add(s.slug);return true;
  });
}

export function getPackages(sector,services){
  const config=SECTORS[sector]||SECTORS.hub;
  const map=new Map(activeBusinessServices(services).map(s=>[s.slug,s]));
  return config.packages.map(p=>({...p,services:p.slugs.map(s=>map.get(s)).filter(Boolean)}));
}

export function cleanLine(s,max=200){return String(s||'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}

export function composeBrief({sector='hub',company='',area='',timeline='',budget='',bundle='',services=[],description=''}){
  const choice=SECTORS[sector]||SECTORS.hub;
  const selected=(Array.isArray(services)?services:[]).filter(s=>typeof s==='string').map(s=>cleanLine(s,100)).slice(0,12);
  const lines=[
    '[BUSINESS SOLUTIONS BRIEF]',
    'Sector: '+choice.label,
    'Company: '+(cleanLine(company,100)||'Not specified'),
    'Location: '+(cleanLine(area,120)||'Not specified'),
    'Interested in: '+(cleanLine(bundle,100)||'Custom proposal'),
    'Services: '+(selected.length?selected.join(', '):'To discuss'),
    'Timeline: '+(cleanLine(timeline,55)||'Flexible'),
    'Budget indication: '+(cleanLine(budget,55)||'Not provided'),
    'Project goals:',
    String(description||'').trim().slice(0,1500),
    '[END BUSINESS SOLUTIONS BRIEF]'
  ];
  const text=lines.join('\n');
  if(text.length>3000)throw Error('Please shorten the project brief.');
  return text;
}
