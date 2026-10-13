'use client';

import {useEffect,useRef,useState} from 'react';
import sequence from '@/content/plan-trace.json';

export default function PlanScrollSequence({locale='fr'}:{locale?:'fr'|'en'}){
 const track=useRef<HTMLDivElement>(null),pin=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [staticMode,setStaticMode]=useState(false),[ready,setReady]=useState(false);
 const en=locale==='en';
 useEffect(()=>{
  const root=track.current,viewport=pin.current,surface=canvas.current;
  if(!root||!viewport||!surface||staticMode)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const context=surface.getContext('2d');
  if(!context||media.matches){setStaticMode(true);return}
  const variant=window.matchMedia('(max-width:800px)').matches?'mobile':'desktop';
  const images=new Map<number,HTMLImageElement>(),pending=new Map<number,Promise<void>>();
  let cancelled=false,started=false,raf=0,frame=0,start=0,distance=1,painted=-1;
  const draw=()=>{
   const image=images.get(frame);if(!image||painted===frame)return;
   const inset=Math.min(surface.width,surface.height)*.035;
   const scale=Math.min((surface.width-inset*2)/image.naturalWidth,(surface.height-inset*2)/image.naturalHeight);
   const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
   context.clearRect(0,0,surface.width,surface.height);
   context.drawImage(image,(surface.width-width)/2,(surface.height-height)/2,width,height);
   painted=frame;root.dataset.paintedFrame=String(frame+1);setReady(true);
  };
  const load=(index:number):Promise<void>=>{
   if(pending.has(index))return pending.get(index)!;
   const promise=new Promise<void>(resolve=>{
    const image=new Image();image.decoding='async';image.fetchPriority='low';
    image.onload=()=>{if(!cancelled){images.set(index,image);draw()}resolve()};
    image.onerror=()=>{if(index===0&&!cancelled)setStaticMode(true);resolve()};
    image.src=`${sequence.directory}/${sequence.frames[index]}-${variant}.webp`;
   });pending.set(index,promise);return promise;
  };
  const update=()=>{
   raf=0;const progress=Math.max(0,Math.min(1,(window.scrollY-start)/distance));
   frame=Math.round(progress*(sequence.frames.length-1));root.dataset.frame=String(frame+1);root.dataset.progress=progress.toFixed(4);
   if(started){if(images.has(frame))draw();else void load(frame)}
  };
  const measure=()=>{
   const top=parseFloat(getComputedStyle(viewport).top)||0;
   start=root.getBoundingClientRect().top+window.scrollY-top;
   distance=Math.max(1,root.offsetHeight-viewport.offsetHeight);
   const density=Math.min(window.devicePixelRatio||1,1.5);
   surface.width=Math.round(surface.clientWidth*density);surface.height=Math.round(surface.clientHeight*density);
   painted=-1;update();
  };
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update)};
  const observer=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting||started)return;started=true;observer.disconnect();
   void load(0);void load(frame);void load(sequence.frames.length-1);
   let next=0;const preload=async()=>{while(!cancelled&&next<sequence.frames.length)await load(next++)};
   void preload();void preload();
  },{rootMargin:'700px 0px'});
  observer.observe(root);
  const resize=new ResizeObserver(measure);resize.observe(viewport);
  const onMotion=()=>{if(media.matches)setStaticMode(true)};
  media.addEventListener('change',onMotion);window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',measure);measure();
  return()=>{cancelled=true;cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();media.removeEventListener('change',onMotion);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);images.clear();pending.clear()};
 },[staticMode]);
 return <div className={`approach-photo plan-scroll-track${staticMode?' is-static':''}`} ref={track} data-ready={ready?'true':'false'}>
  <div className="plan-scroll-pin" ref={pin} role="img" aria-label={en?'A renovation floor plan drawn line by line':'Un plan de rénovation dessiné trait par trait'}>
   <picture className="plan-scroll-fallback"><source media="(max-width:800px)" srcSet={`${sequence.directory}/frame_050-mobile.webp`}/><img src={`${sequence.directory}/frame_050-desktop.webp`} alt="" loading="lazy"/></picture>
   <canvas ref={canvas} className="plan-scroll-canvas" aria-hidden="true"/>
   <p className="plan-scroll-caption">{en?'From the first line. To the final finish.':'Du premier trait. À la dernière finition.'}</p>
  </div>
  <noscript><style>{'.plan-scroll-track{height:var(--plan-pane-height)!important}.plan-scroll-pin{position:relative!important;top:auto!important}'}</style></noscript>
 </div>;
}
