'use client';

import {useEffect,useState} from 'react';

export default function BrandIntro({locale='fr'}:{locale?:'fr'|'en'}){
 // Render the opaque welcome screen in server HTML, before hydration paints the site.
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const timer=window.setTimeout(()=>setVisible(false),3000);
  return()=>window.clearTimeout(timer);
 },[]);
 if(!visible)return null;
 return <><div className="mg-brand-intro" role="region" aria-label={locale==='en'?'Welcome to MG Pro':'Bienvenue chez MG Pro'}><div className="mg-intro-brand"><img src="/images/logo-mgpro-v6.png" alt="MG Pro" fetchPriority="high"/><p>{locale==='en'?'Your vision. Our expertise.':'Vos idées. Notre savoir-faire.'}</p><div className="mg-intro-progress" aria-hidden="true"><span/></div></div></div><noscript><style>{'.mg-brand-intro{display:none!important}html:has(.mg-brand-intro){overflow:auto!important}.atelier-site:has(>.mg-brand-intro)>:not(.mg-brand-intro),body:has(.mg-brand-intro)>:not(:has(.mg-brand-intro)){visibility:visible!important;pointer-events:auto!important}'}</style></noscript></>;
}
