'use client';

import {useEffect,useRef} from 'react';

const scenes={
 vision:{image:'/images/immersive/vision-desktop.webp',mobile:'/images/immersive/vision-mobile.webp',alt:{fr:'Inspiration : cuisine contemporaine ouverte sur un séjour lumineux',en:'Design inspiration: contemporary kitchen opening onto a bright living room'},title:{fr:'Votre espace. Réinventé.',en:'Your space. Reimagined.'},kicker:{fr:'IMAGINER LA SUITE',en:'IMAGINE WHAT COMES NEXT'}},
 detail:{image:'/images/immersive/detail-desktop.webp',mobile:'/images/immersive/detail-mobile.webp',alt:{fr:'Inspiration : salle de bain contemporaine, douche vitrée et baignoire',en:'Design inspiration: contemporary bathroom with a glass shower and bathtub'},title:{fr:'Le détail fait la différence.',en:'Every detail makes a difference.'},kicker:{fr:'LA SIGNATURE MG PRO',en:'THE MG PRO SIGNATURE'}}
};

export default function ImmersiveBanner({scene,locale='fr'}:{scene:keyof typeof scenes;locale?:'fr'|'en'}){
 const track=useRef<HTMLElement>(null),pin=useRef<HTMLDivElement>(null);
 const content=scenes[scene];
 useEffect(()=>{
  const root=track.current,stage=pin.current;if(!root||!stage)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,start=0,distance=1,near=false;
  function draw(){
   frame=0;if(!root)return;
   const raw=(scrollY-start)/distance;
   const progress=reduced.matches?0:Math.max(0,Math.min(1,raw));
   root.style.setProperty('--portal-scale',String(1+progress*(innerWidth<800?.06:.1)));
   root.style.setProperty('--portal-copy-opacity',String(1-Math.min(1,Math.max(0,(progress-.35)/.5))));
   root.style.setProperty('--portal-shade',String(.82-progress*.62));
   root.dataset.progress=progress.toFixed(4);
   root.dataset.active=String(!reduced.matches&&scrollY>=start-1&&scrollY<=start+distance+1);
  }
  function measure(){
   if(!root||!stage)return;
   start=root.getBoundingClientRect().top+scrollY;
   distance=Math.max(1,root.offsetHeight-stage.offsetHeight);
   draw();
  }
  function scroll(){if(near&&!frame)frame=requestAnimationFrame(draw)}
  const observer=new IntersectionObserver(([entry])=>{near=entry.isIntersecting;if(near)measure();else root.dataset.active='false'},{rootMargin:'200px 0px'});
  observer.observe(root);
  const resize=new ResizeObserver(measure);resize.observe(stage);
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',measure);
  reduced.addEventListener('change',measure);measure();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',measure);reduced.removeEventListener('change',measure)};
 },[]);
 return <section ref={track} className="immersive-banner" data-scene={scene} aria-labelledby={`immersive-${scene}-title`}>
  <div className="immersive-banner-pin" ref={pin}>
   <div className="immersive-banner-window">
    <picture className="immersive-banner-picture"><source media="(max-width:800px)" srcSet={content.mobile}/><img src={content.image} alt={content.alt[locale]} loading="lazy" decoding="async" width="1672" height="941"/></picture>
    <div className="immersive-banner-shade" aria-hidden="true"/>
    <div className="immersive-banner-copy"><p className="section-kicker">{content.kicker[locale]}</p><h2 id={`immersive-${scene}-title`}>{content.title[locale]}</h2></div>
   </div>
  </div>
  <noscript><style>{'.atelier-site main>.immersive-banner{height:100svh!important}.immersive-banner-pin{position:relative!important;top:auto!important;height:100%!important}'}</style></noscript>
 </section>;
}
