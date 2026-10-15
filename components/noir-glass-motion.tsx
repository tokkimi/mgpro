'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

const surfaces='.glass-pictogram,.expertise-glass-gallery,.mg-coverflow-card,.mg-action-wheel,.finance-offer,.glass-button,.atelier-text-link,.mg-liquid-button,.hero-finance,.contact-glass-trigger,.blog-card';

// Reflections follow the pointer without React renders or changes to carousel transforms.
export default function NoirGlassMotion(){
 const path=usePathname();
 useEffect(()=>{
  const root=document.querySelector('.atelier-site');
  if(!root)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const elements=Array.from(root.querySelectorAll<HTMLElement>(surfaces));
  const visible=new Set<HTMLElement>();
  let frame=0,active:HTMLElement|null=null,pending:HTMLElement|null=null,x=0,y=0;
  function play(){
   for(const element of elements)element.style.setProperty('--noir-motion',visible.has(element)&&!document.hidden&&!motion.matches?'running':'paused');
  }
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const element=entry.target as HTMLElement;
    if(entry.isIntersecting)visible.add(element);else visible.delete(element);
   }
   play();
  },{threshold:.05});
  elements.forEach(element=>observer.observe(element));
  function reset(){
   active?.style.removeProperty('--glass-x');
   active?.style.removeProperty('--glass-y');
   active=null;
  }
  function paint(){
   frame=0;
   if(active!==pending)reset();
   active=pending;
   if(!active)return;
   const bounds=active.getBoundingClientRect();
   active.style.setProperty('--glass-x',`${Math.max(0,Math.min(100,(x-bounds.left)/bounds.width*100))}%`);
   active.style.setProperty('--glass-y',`${Math.max(0,Math.min(100,(y-bounds.top)/bounds.height*100))}%`);
  }
  function move(event:PointerEvent){
   if(motion.matches||event.pointerType!=='mouse')return;
   const target=event.target instanceof Element?event.target.closest<HTMLElement>(surfaces):null;
   pending=target&&root?.contains(target)?target:null;
   x=event.clientX;y=event.clientY;
   if(!frame)frame=requestAnimationFrame(paint);
  }
  function leave(){pending=null;if(frame)cancelAnimationFrame(frame);frame=0;reset()}
  function preference(){leave();play()}
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',preference);
  motion.addEventListener('change',preference);
  return()=>{
   observer.disconnect();leave();
   document.removeEventListener('pointermove',move);
   document.removeEventListener('pointerleave',leave);
   document.removeEventListener('visibilitychange',preference);
   motion.removeEventListener('change',preference);
   elements.forEach(element=>element.style.removeProperty('--noir-motion'));
  };
 },[path]);
 return null;
}
