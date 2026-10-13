'use client';

import {useEffect,useState} from 'react';

export default function BrandIntro({locale='fr'}:{locale?:'fr'|'en'}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try{if(sessionStorage.getItem('mgpro-brand-intro-v6'))return;sessionStorage.setItem('mgpro-brand-intro-v6','seen')}catch{}
  setVisible(true);
  const timer=window.setTimeout(()=>setVisible(false),3000);
  return()=>window.clearTimeout(timer);
 },[]);
 if(!visible)return null;
 return <div className="mg-brand-intro" role="region" aria-label={locale==='en'?'Welcome to MG Pro':'Bienvenue chez MG Pro'}><div className="mg-intro-brand"><img src="/images/logo-mgpro-v6.png" alt="MG Pro" fetchPriority="high"/><p>{locale==='en'?'Your vision. Our expertise.':'Vos idées. Notre savoir-faire.'}</p><div className="mg-intro-progress" aria-hidden="true"><span/></div></div><button type="button" onClick={()=>setVisible(false)}>{locale==='en'?'Enter the site':'Entrer sur le site'} <span aria-hidden="true">↗</span></button></div>;
}
