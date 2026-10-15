'use client';

import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';

export default function BrandIntro(){
 const path=usePathname();
 const publicPage=path==='/'||/^\/(?:services|a-propos|blogue|confidentialite|en)(?:\/|$)/.test(path);
 const en=path==='/en'||path.startsWith('/en/');
 // Render the opaque welcome screen in server HTML, before hydration paints the site.
 // The root layout preserves this state across page and language changes.
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  if(!publicPage||!visible)return;
  const timer=window.setTimeout(()=>setVisible(false),3000);
  return()=>window.clearTimeout(timer);
 },[publicPage,visible]);
 if(!visible||!publicPage)return null;
 return <><div className="mg-brand-intro" role="region" aria-label={en?'Welcome to MG Pro':'Bienvenue chez MG Pro'}><div className="mg-intro-brand"><img src="/images/logo-mgpro-noir.svg" alt="MG Pro" fetchPriority="high"/><p>{en?'Your vision. Our expertise.':'Vos idées. Notre savoir-faire.'}</p><div className="mg-intro-progress" aria-hidden="true"><span/></div></div></div><noscript><style>{'.mg-brand-intro{display:none!important}html:has(.mg-brand-intro){overflow:auto!important}body:has(>.mg-brand-intro)>:not(.mg-brand-intro):not(noscript){visibility:visible!important;pointer-events:auto!important}'}</style></noscript></>;
}
