'use client';

import {useEffect,useState} from 'react';

export default function BrandIntro({locale='fr'}:{locale?:'fr'|'en'}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try{if(sessionStorage.getItem('mgpro-brand-intro-v5'))return;sessionStorage.setItem('mgpro-brand-intro-v5','seen')}catch{}
  setVisible(true);
  const timer=window.setTimeout(()=>setVisible(false),3000);
  return()=>window.clearTimeout(timer);
 },[]);
 if(!visible)return null;
 return <div className="mg-brand-intro" role="region" aria-label={locale==='en'?'Welcome to MG Pro':'Bienvenue chez MG Pro'}><div className="mg-intro-aura"/><div className="mg-intro-brand"><img src="/images/logo-mgpro-v5.png" alt="MG Pro" fetchPriority="high"/><div className="mg-intro-light"/><p>{locale==='en'?'Your space. A new chapter.':'Vos espaces. Un nouveau chapitre.'}</p></div><button type="button" onClick={()=>setVisible(false)}>{locale==='en'?'Enter the site':'Entrer sur le site'} <span aria-hidden="true">↗</span></button></div>;
}
