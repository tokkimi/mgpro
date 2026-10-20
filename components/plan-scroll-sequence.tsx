'use client';

import {useEffect,useRef,useState} from 'react';
import sequence from '@/content/plan-trace.json';
import {PlanFallback,PlanHandwriting,planTextMasks} from './plan-handwriting';

export default function PlanScrollSequence({locale='fr'}:{locale?:'fr'|'en'}){
 const track=useRef<HTMLDivElement>(null),pin=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [staticMode,setStaticMode]=useState(false),[ready,setReady]=useState(false);
 const en=locale==='en';
 useEffect(()=>{
  const root=track.current,viewport=pin.current,surface=canvas.current;
  if(!root||!viewport||!surface||staticMode)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const context=surface.getContext('2d',{willReadFrequently:true});
  if(!context||media.matches){setStaticMode(true);return}
  const variant=window.matchMedia('(max-width:800px)').matches?'mobile':'desktop';
  const images=new Map<number,HTMLImageElement>(),pending=new Map<number,Promise<void>>();
  let cancelled=false,started=false,raf=0,frame=0,start=0,entry=0,distance=1,painted=-1,writing=0;
  const strokes=Array.from(root.querySelectorAll<SVGPathElement>('[data-writing] path')).map(path=>({path,length:path.getTotalLength(),offset:1}));
  const totalInk=strokes.reduce((sum,stroke)=>sum+stroke.length,0);
  const write=()=>{
   const progress=frame===sequence.frames.length-1&&images.has(frame)?writing:0;
   let remaining=progress*totalInk;
   for(const stroke of strokes){const offset=1-Math.max(0,Math.min(1,remaining/stroke.length));if(offset!==stroke.offset){stroke.path.style.strokeDashoffset=String(offset);stroke.offset=offset}remaining-=stroke.length}
   root.dataset.writingProgress=progress.toFixed(4);
  };
  let grain=new Float32Array(0);
  const draw=()=>{
   write();const image=images.get(frame);if(!image||painted===frame)return;
   const scale=Math.min(surface.width/image.naturalWidth,surface.height/image.naturalHeight);
   const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
   context.clearRect(0,0,surface.width,surface.height);
   context.drawImage(image,(surface.width-width)/2,(surface.height-height)/2,width,height);
   // Remove only the old raster labels before applying chalk pigment.
   for(const [x,y,w,h] of planTextMasks)context.clearRect((surface.width-width)/2+x/1200*width,(surface.height-height)/2+y/1130*height,w/1200*width,h/1130*height);
   // Chalk pigment stays inside the original strokes: no outline, halo or frame.
   const pixels=context.getImageData(0,0,surface.width,surface.height);
   for(let i=0,pixel=0;i<pixels.data.length;i+=4,pixel++){
    if(!pixels.data[i+3])continue;
    const ink=1-(pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114)/255;
    pixels.data[i+3]=Math.round(pixels.data[i+3]*ink*grain[pixel]);
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;
   }
   context.putImageData(pixels,0,0);
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
   // Draw as soon as the plan enters the screen, before it reaches its sticky position.
   // Keep the existing end of the drawing and the separate handwriting phase.
   const drawing=Math.max(0,Math.min(1,(window.scrollY-entry)/Math.max(1,start+distance*.7-entry)));
   frame=Math.round(drawing*(sequence.frames.length-1));writing=Math.max(0,(progress-.7)/.3);root.dataset.frame=String(frame+1);root.dataset.progress=progress.toFixed(4);root.dataset.drawingProgress=drawing.toFixed(4);
   if(started){if(images.has(frame))draw();else void load(frame)}
  };
  const measure=()=>{
   const top=parseFloat(getComputedStyle(viewport).top)||0;
   const documentTop=root.getBoundingClientRect().top+window.scrollY;
   start=documentTop-top;
   entry=documentTop-window.innerHeight;
   distance=Math.max(1,root.offsetHeight-viewport.offsetHeight);
   const density=Math.min(window.devicePixelRatio||1,1.5);
   surface.width=Math.round(surface.clientWidth*density);surface.height=Math.round(surface.clientHeight*density);
   grain=new Float32Array(surface.width*surface.height);
   let seed=1709;
   for(let i=0;i<grain.length;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const noise=seed/4294967296,x=i%surface.width,y=Math.floor(i/surface.width);
    grain[i]=Math.min(1,(noise>.95?.48:.76+noise*.24)*(.93+.07*Math.sin(x*.17+y*.11)));
   }
   painted=-1;update();
  };
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update)};
  const observer=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting||started)return;started=true;observer.disconnect();
   void load(0);void load(frame);void load(sequence.frames.length-1);
   let next=0;const preload=async()=>{while(!cancelled&&next<sequence.frames.length)await load(next++)};
   void preload();void preload();
  },{rootMargin:`${Math.max(window.innerHeight,1000)}px 0px`});
  observer.observe(root);
  const resize=new ResizeObserver(measure);resize.observe(viewport);
  const onMotion=()=>{if(media.matches)setStaticMode(true)};
  media.addEventListener('change',onMotion);window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',measure);measure();
  return()=>{cancelled=true;cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();media.removeEventListener('change',onMotion);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);images.clear();pending.clear()};
 },[staticMode]);
 return <div className={`approach-photo plan-scroll-track${staticMode?' is-static':''}`} ref={track} data-ready={ready?'true':'false'}>
  <div className="plan-scroll-pin" ref={pin} role="img" aria-label={en?'A renovation floor plan drawn line by line':'Un plan de rénovation dessiné trait par trait'}>
   <div className="plan-drawing-area"><PlanFallback locale={locale}/><canvas ref={canvas} className="plan-scroll-canvas" aria-hidden="true"/><PlanHandwriting locale={locale} animated/></div>
   <p className="plan-scroll-caption">{en?'From the first line. To the final finish.':'Du premier trait. À la dernière finition.'}</p>
  </div>
  <noscript><style>{'.plan-scroll-track{height:var(--plan-pane-height)!important}.plan-scroll-pin{position:relative!important;top:auto!important}'}</style></noscript>
 </div>;
}
