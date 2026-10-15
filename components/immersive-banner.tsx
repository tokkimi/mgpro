'use client';

import {useEffect,useRef} from 'react';

const scenes={
 vision:{image:'/images/original/cuisine-haut-de-gamme-quebec-01.jpg',alt:{fr:'Cuisine lumineuse ouverte sur un espace de vie',en:'Bright kitchen opening onto a living space'},title:{fr:'Votre espace. Réinventé.',en:'Your space. Reimagined.'},kicker:{fr:'IMAGINER LA SUITE',en:'IMAGINE WHAT COMES NEXT'}},
 detail:{image:'/images/original/renovation-salle-de-bain-montreal.jpg',alt:{fr:'Salle de bain avec douche vitrée et double vasque',en:'Bathroom with a glass shower and double vanity'},title:{fr:'Le détail fait la différence.',en:'Every detail makes a difference.'},kicker:{fr:'LA SIGNATURE MG PRO',en:'THE MG PRO SIGNATURE'}}
};

export default function ImmersiveBanner({scene,locale='fr'}:{scene:keyof typeof scenes;locale?:'fr'|'en'}){
 const track=useRef<HTMLElement>(null),pin=useRef<HTMLDivElement>(null);
 const content=scenes[scene];
 useEffect(()=>{
  const root=track.current,stage=pin.current;if(!root||!stage)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const header=root.closest('.atelier-site')?.querySelector('.atelier-header');
  let frame=0,start=0,distance=1,near=false;
  function draw(){
   frame=0;if(!root)return;
   const progress=reduced.matches?0:Math.max(0,Math.min(1,(scrollY-start)/distance));
   const open=Math.min(1,progress/.65),ease=1-Math.pow(1-open,2);
   const dive=Math.max(0,(progress-.3)/.7);
   root.style.setProperty('--portal-inset',`${(1-ease)*20}%`);
   root.style.setProperty('--portal-scale',String(1+dive*(innerWidth<800?.12:.18)));
   root.style.setProperty('--portal-copy-opacity',String(1-Math.min(1,Math.max(0,(progress-.35)/.5))));
   root.style.setProperty('--portal-shade',String(.82-progress*.62));
   root.dataset.progress=progress.toFixed(4);
  }
  function measure(){
   if(!root||!stage)return;
   const headerHeight=header?.getBoundingClientRect().height||0;
   root.style.setProperty('--portal-header',`${headerHeight}px`);
   start=root.getBoundingClientRect().top+scrollY-headerHeight;
   distance=Math.max(1,root.offsetHeight-stage.offsetHeight);
   draw();
  }
  function scroll(){if(near&&!frame)frame=requestAnimationFrame(draw)}
  const observer=new IntersectionObserver(([entry])=>{near=entry.isIntersecting;if(near)measure()},{rootMargin:'200px 0px'});
  observer.observe(root);
  const resize=new ResizeObserver(measure);resize.observe(stage);if(header)resize.observe(header);
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',measure);
  reduced.addEventListener('change',measure);measure();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',measure);reduced.removeEventListener('change',measure)};
 },[]);
 return <section ref={track} className="immersive-banner" data-scene={scene} aria-labelledby={`immersive-${scene}-title`}>
  <div className="immersive-banner-pin" ref={pin}>
   <div className="immersive-banner-window">
    <img src={content.image} alt={content.alt[locale]} loading="lazy" decoding="async" width={scene==='vision'?710:690} height={scene==='vision'?510:460}/>
    <div className="immersive-banner-shade" aria-hidden="true"/>
    <div className="immersive-banner-copy"><p className="section-kicker">{content.kicker[locale]}</p><h2 id={`immersive-${scene}-title`}>{content.title[locale]}</h2></div>
   </div>
  </div>
  <noscript><style>{'.atelier-site main>.immersive-banner{height:70svh!important}.immersive-banner-pin{position:relative!important;top:auto!important;height:100%!important}.immersive-banner-window{clip-path:none!important}'}</style></noscript>
 </section>;
}
