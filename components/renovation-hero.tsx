'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import sequence from '@/content/hero-renovation.json';

type Props={locale?:'fr'|'en';finance:string;onQuote:()=>void};
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(value:number)=>{const x=clamp(value);return x*x*(3-2*x)};

export default function RenovationHero({locale='fr',finance,onQuote}:Props){
 const root=useRef<HTMLDivElement>(null);
 const pin=useRef<HTMLDivElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const copy=useRef<HTMLDivElement>(null);
 const financeLink=useRef<HTMLAnchorElement>(null);
 const [staticMode,setStaticMode]=useState(false);
 const [ready,setReady]=useState(false);
 const en=locale==='en';

 useEffect(()=>{
  const container=root.current,sticky=pin.current,surface=canvas.current;
  if(!container||!sticky||!surface)return;
  if(staticMode){
   for(const name of ['--hero-copy-alpha','--hero-copy-blur','--hero-copy-shift','--hero-action-alpha','--hero-secondary-alpha'])container.style.removeProperty(name);
   container.dataset.animating='false';
   if(copy.current)copy.current.inert=false;
   if(financeLink.current)financeLink.current.inert=false;
   return;
  }
  const context=surface.getContext('2d',{alpha:false});
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!context||motion.matches){setStaticMode(true);return}
  const mobile=window.matchMedia('(max-width:800px)').matches;
  const suffix=mobile?'mobile':'desktop';
  const loaded=new Map<string,HTMLImageElement>();
  const pending=new Map<string,Promise<HTMLImageElement|null>>();
  let cancelled=false,raf=0,framePosition=0,start=0,distance=1,painted='';
  let width=0,height=0,cropX=.5,cropY=.5;
  const source=(index:number)=>`${sequence.directory}/${sequence.frames[index]}-${suffix}.webp`;
  const draw=()=>{
   const lower=Math.floor(framePosition),upper=Math.min(lower+1,sequence.frames.length-1);
   const image=loaded.get(source(lower));
   if(!image)return;
   const next=loaded.get(source(upper));
   container.dataset.paintedFrame=(lower+(next?framePosition-lower:0)+1).toFixed(3);
   const blend=next&&next!==image?framePosition-lower:0;
   container.dataset.blend=blend.toFixed(3);
   const key=`${lower}:${blend.toFixed(3)}:${width}:${height}`;
   if(key===painted)return;
   painted=key;
   // Use the exact CSS crop of the original photo, so the final frame cannot jump.
   const paint=(frame:HTMLImageElement,alpha:number)=>{
    const scale=Math.max(surface.width/frame.naturalWidth,surface.height/frame.naturalHeight);
    const imageWidth=frame.naturalWidth*scale,imageHeight=frame.naturalHeight*scale;
    context.globalAlpha=alpha;
    context.drawImage(frame,(surface.width-imageWidth)*cropX,(surface.height-imageHeight)*cropY,imageWidth,imageHeight);
   };
   paint(image,1);
   if(next&&blend>0)paint(next,blend);
   context.globalAlpha=1;
   setReady(true);
  };
  const load=(index:number):Promise<HTMLImageElement|null>=>{
   const url=source(index);
   if(loaded.has(url))return Promise.resolve(loaded.get(url)!);
   if(pending.has(url))return pending.get(url)!;
   const promise=new Promise<HTMLImageElement|null>(resolve=>{
    const image=new Image();image.decoding='async';image.fetchPriority=index===0?'high':'low';
    image.onload=async()=>{
     // Decode before caching, rather than doing it for the first time during a scroll paint.
     try{await image.decode()}catch{/* A completed image can still be drawn if decode is unavailable. */}
     if(!cancelled){loaded.set(url,image);draw()}
     resolve(image);
    };
    image.onerror=()=>{if(index===0&&!cancelled)setStaticMode(true);resolve(null)};
    image.src=url;
   });
   pending.set(url,promise);return promise;
  };
  const update=()=>{
   raf=0;
   const progress=clamp((window.scrollY-start)/distance);
   framePosition=progress*(sequence.frames.length-1);
   const copyAlpha=smooth((progress-.28)/.58),actionAlpha=smooth((progress-.6)/.35);
   container.style.setProperty('--hero-copy-alpha',String(copyAlpha));
   container.style.setProperty('--hero-copy-blur',`${(1-copyAlpha)*12}px`);
   container.style.setProperty('--hero-copy-shift',`${(1-copyAlpha)*18}px`);
   container.style.setProperty('--hero-action-alpha',String(actionAlpha));
   container.style.setProperty('--hero-secondary-alpha',String(smooth((progress-.68)/.3)));
   container.dataset.progress=progress.toFixed(4);container.dataset.frame=String(Math.round(framePosition)+1);
   container.dataset.animating=progress<1?'true':'false';
   container.dataset.revealed=copyAlpha===1?'true':'false';
   if(copy.current)copy.current.inert=copyAlpha<.95;
   if(financeLink.current)financeLink.current.inert=actionAlpha<.95;
   const lower=Math.floor(framePosition),upper=Math.min(lower+1,sequence.frames.length-1);
   if(!loaded.has(source(lower)))void load(lower);
   if(!loaded.has(source(upper)))void load(upper);
   draw();
  };
  const schedule=()=>{if(!raf)raf=window.requestAnimationFrame(update)};
  const measure=()=>{
   const headerHeight=parseFloat(getComputedStyle(container).getPropertyValue('--hero-header-size'))||0;
   start=container.getBoundingClientRect().top+window.scrollY-headerHeight;
   distance=Math.max(1,container.offsetHeight-sticky.offsetHeight);
   width=surface.clientWidth;height=surface.clientHeight;
   const photo=container.querySelector('.hero-final-photo');
   if(photo){const positions=getComputedStyle(photo).objectPosition.split(' ').map(value=>parseFloat(value)/100);cropX=Number.isFinite(positions[0])?positions[0]:.5;cropY=Number.isFinite(positions[1])?positions[1]:.5}
   const density=Math.min(window.devicePixelRatio||1,1.5);
   surface.width=Math.round(width*density);surface.height=Math.round(height*density);
   painted='';update();
  };
  const resize=new ResizeObserver(measure);resize.observe(sticky);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',measure);
  const changeMotion=()=>{if(motion.matches)setStaticMode(true)};
  motion.addEventListener('change',changeMotion);
  measure();
  // Load the end frame immediately, then prefetch the supplied sequence with bounded concurrency.
  void load(sequence.frames.length-1);
  let next=0;
  const preload=async()=>{while(!cancelled&&next<sequence.frames.length){const index=next++;await load(index)}};
  void preload();void preload();void preload();
  return()=>{cancelled=true;window.cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',measure);motion.removeEventListener('change',changeMotion);resize.disconnect();loaded.clear();pending.clear()};
 },[staticMode]);

 return <div className={`hero-scroll-sequence${staticMode?' is-static':''}`} ref={root} data-animating={staticMode?'false':'true'} data-ready={ready?'true':'false'}>
  <div className="hero-scroll-pin" ref={pin}><section className="atelier-hero">
   <img className="atelier-hero-photo hero-final-photo" src="/images/renovation-inspiration.png" alt={en?'Renovation inspiration: natural oak kitchen — generated image':'Inspiration : cuisine rénovée en bois naturel — visuel généré'} fetchPriority="high"/>
   <picture className="hero-first-frame"><source media="(max-width:800px)" srcSet={`${sequence.directory}/${sequence.frames[0]}-mobile.webp`}/><img className="atelier-hero-photo" src={`${sequence.directory}/${sequence.frames[0]}-desktop.webp`} alt="" fetchPriority="high"/></picture>
   <canvas ref={canvas} className="hero-frame-canvas" aria-hidden="true"/>
   <div className="atelier-hero-shade"/>
   <div className="atelier-hero-topline"><span>{en?'RESIDENTIAL & COMMERCIAL RENOVATION':'RÉNOVATIONS RÉSIDENTIELLES & COMMERCIALES'}</span><span>{en?'LAVAL · MONTRÉAL · NORTH SHORE':'LAVAL · MONTRÉAL · RIVE-NORD'}</span></div>
   <div className="atelier-hero-copy" ref={copy} inert={!staticMode}><div className="hero-intro-line"><span/>{en?'OVER 20 YEARS OF SHAPING SPACES':'PLUS DE 20 ANS À FAÇONNER VOS ESPACES'}</div><h1>{en?'Beauty to live in.':'Le beau se vit.'}<br/><span>{en?'Quality you':'Le bien fait,'}</span><br/>{en?'can feel.':'se ressent'}{!en&&<span className="gold-dot">.</span>}</h1><p>{en?'Renovate today.':'Rénover aujourd’hui.'}<br/>{en?'For a better tomorrow.':'Pour un meilleur demain.'}</p><button type="button" className="glass-button hero-project-button" onClick={onQuote}>{en?'Bring your project to life':'Donnons vie à votre projet'}<ArrowUpRight size={19}/></button></div>
   <a ref={financeLink} className="hero-finance glass-surface" href={finance} target="_blank" rel="noopener noreferrer" inert={!staticMode}><div><span>{en?'YOUR PROJECT, AT YOUR PACE':'VOTRE PROJET, À VOTRE RYTHME'}</span><b><img className="financeit-logo hero-finance-logo" src="/images/financeit-official.png" alt="Financeit"/><ArrowUpRight size={24} aria-hidden="true"/></b></div><p>{en?'Explore financing options':'Des solutions de financement'}<br/>{en?'for your renovation.':'pour passer de l’idée aux travaux.'}</p></a>
   <div className="hero-photo-credit"><span>{en?'THE MG PRO SIGNATURE':'LA SIGNATURE MG PRO'}</span><span>{en?'Spaces designed to last.':'Des espaces pensés pour durer.'}</span></div>
  </section></div>
  <noscript><style>{'.hero-scroll-sequence{height:auto!important}.hero-scroll-pin{position:relative!important;top:auto!important}.hero-first-frame,.hero-frame-canvas{display:none!important}.hero-scroll-sequence .atelier-hero-copy,.hero-scroll-sequence .hero-finance,.hero-scroll-sequence .hero-project-button,.hero-scroll-sequence .atelier-hero-topline,.hero-scroll-sequence .hero-photo-credit,.atelier-site .atelier-contact{opacity:1!important;filter:none!important;transform:none!important;visibility:visible!important;pointer-events:auto!important}'}</style></noscript>
 </div>;
}
