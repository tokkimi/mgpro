'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import type {CSSProperties,TouchEvent} from 'react';
import {ArrowLeft,ArrowRight,Maximize2,Pause,Play} from 'lucide-react';

export interface CarouselItem {
 id:string;
 title:string;
 description:string;
 photos:string[];
}
type Props={items:CarouselItem[];locale?:'fr'|'en';autoplay?:boolean;autoplayDelay?:number;onPhoto:(src:string)=>void};

/** The supplied coverflow composition, adapted to MG Pro's own photos and silver glass. */
export function CoverFlowCarousel({items,locale='fr',autoplay=true,autoplayDelay=1000,onPhoto}:Props){
 const [currentIndex,setCurrentIndex]=useState(0);
 const [photoIndices,setPhotoIndices]=useState<Record<string,number>>({});
 const [running,setRunning]=useState(autoplay);
 const [explicitPlay,setExplicitPlay]=useState(false);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [inView,setInView]=useState(false);
 const [pageVisible,setPageVisible]=useState(true);
 const [reducedMotion,setReducedMotion]=useState(true);
 const root=useRef<HTMLDivElement>(null);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const dragged=useRef(false);
 const en=locale==='en';
 const total=items.length;
 const activeIndex=total?currentIndex%total:0;
 const nextSlide=useCallback(()=>setCurrentIndex(index=>(index+1)%total),[total]);
 const select=(index:number)=>{setRunning(false);setExplicitPlay(false);setCurrentIndex((index+total)%total)};

 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReducedMotion(media.matches);
  const visibility=()=>setPageVisible(!document.hidden);
  motion();visibility();
  media.addEventListener('change',motion);
  document.addEventListener('visibilitychange',visibility);
  const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{threshold:.35});
  if(root.current)observer.observe(root.current);
  return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);observer.disconnect()};
 },[]);
 useEffect(()=>{
  // An explicit press on Play must start even when only the controls are in view.
  if(!autoplay||!running||(!explicitPlay&&(hovered||focused||!inView))||!pageVisible||reducedMotion||total<=1)return;
  const timer=window.setInterval(nextSlide,autoplayDelay);
  return()=>window.clearInterval(timer);
 },[autoplay,running,explicitPlay,hovered,focused,inView,pageVisible,reducedMotion,total,nextSlide,autoplayDelay]);

 const changePhoto=(item:CarouselItem,direction:number)=>{
  setRunning(false);
  setPhotoIndices(indices=>({...indices,[item.id]:((indices[item.id]||0)+direction+item.photos.length)%item.photos.length}));
 };
 const startTouch=(event:TouchEvent)=>{
  const point=event.touches[0];
  touchStart.current={x:point.clientX,y:point.clientY};dragged.current=false;
 };
 const endTouch=(event:TouchEvent)=>{
  if(!touchStart.current)return;
  const point=event.changedTouches[0];
  const x=point.clientX-touchStart.current.x,y=point.clientY-touchStart.current.y;
  touchStart.current=null;
  if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)){dragged.current=true;select(activeIndex+(x<0?1:-1))}
 };
 if(!total)return null;

 return <div className="mg-coverflow" ref={root} role="region" aria-roledescription={en?'carousel':'carrousel'} aria-label={en?'MG Pro renovation projects':'Les réalisations MG Pro'} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false)}} onKeyDown={event=>{
  // Photo controls retain their own keyboard behaviour; never intercept arrows elsewhere on the page.
  if(event.target!==event.currentTarget)return;
  if(event.key==='ArrowRight'){event.preventDefault();select(activeIndex+1)}
  if(event.key==='ArrowLeft'){event.preventDefault();select(activeIndex-1)}
 }} tabIndex={0}>
  <div className="mg-coverflow-stage" onTouchStart={startTouch} onTouchEnd={endTouch} onTouchCancel={()=>{touchStart.current=null}} onClickCapture={event=>{if(dragged.current){event.preventDefault();event.stopPropagation();dragged.current=false}}}>
   {items.map((item,index)=>{
    let distance=(index-activeIndex+total)%total;
    if(distance>total/2)distance-=total;
    const depth=Math.abs(distance),center=depth===0;
    const photoIndex=(photoIndices[item.id]||0)%item.photos.length;
    const transform=center?'translateX(0) scale(1) rotateY(0deg)':`translateX(calc(var(${depth===1?'--flow-step':'--flow-far'}) * ${distance<0?-1:1})) scale(${depth===1 ? .84 : .68}) rotateY(${(distance<0?1:-1)*(depth===1?24:38)}deg)`;
    const style={transform,opacity:depth>1?0:center?1:.65,visibility:depth>1?'hidden':'visible',pointerEvents:depth>1?'none':undefined,zIndex:30-depth*10} as CSSProperties;
    return <article key={item.id} className={`mg-coverflow-card${center?' is-center':''}`} style={style} inert={depth>1} aria-roledescription={en?'slide':'diapositive'} aria-label={`${index+1} / ${total} — ${item.title}`} aria-hidden={depth>1||undefined}>
     <button className="mg-coverflow-photo" type="button" disabled={!center} tabIndex={center?0:-1} aria-label={`${en?'Enlarge':'Agrandir'} ${item.title}, photo ${photoIndex+1}`} onClick={()=>{setRunning(false);onPhoto(item.photos[photoIndex])}}>
      <img src={item.photos[photoIndex]} alt={`${item.title} — MG Pro, ${en?'photo':'photo'} ${photoIndex+1}`} loading="lazy" draggable={false}/>
      {center&&<span className="mg-coverflow-expand"><Maximize2 size={17}/></span>}
     </button>
     <div className="mg-coverflow-body" inert={!center} aria-hidden={!center}>
      <span className="mg-coverflow-kicker">{en?'The MG Pro signature':'La signature MG Pro'}</span>
      <h3>{item.title}</h3><p>{item.description}</p>
      <div className="mg-coverflow-photo-nav"><button type="button" onClick={()=>changePhoto(item,-1)} aria-label={`${en?'Previous photo':'Photo précédente'} — ${item.title}`} disabled={item.photos.length<2}><ArrowLeft size={16}/></button><span>{photoIndex+1} / {item.photos.length} {en?'photos':'photos'}</span><button type="button" onClick={()=>changePhoto(item,1)} aria-label={`${en?'Next photo':'Photo suivante'} — ${item.title}`} disabled={item.photos.length<2}><ArrowRight size={16}/></button></div>
     </div>
     {!center&&depth===1&&<button className="mg-coverflow-select" type="button" aria-label={`${en?'Show':'Afficher'} ${item.title}`} onClick={()=>select(index)}/>}
    </article>;
   })}
  </div>
  <div className="mg-coverflow-controls"><button className="mg-coverflow-arrow" type="button" onClick={()=>select(activeIndex-1)} aria-label={en?'Previous category':'Catégorie précédente'} disabled={total<2}><ArrowLeft size={18}/></button><div className="mg-coverflow-dots">{items.map((item,index)=><button key={item.id} type="button" className={index===activeIndex?'is-active':''} aria-label={`${en?'Show':'Afficher'} ${item.title}`} aria-current={index===activeIndex?'true':undefined} onClick={()=>select(index)}><span/></button>)}</div>{autoplay&&!reducedMotion&&<button className="mg-coverflow-arrow" type="button" onClick={()=>{setExplicitPlay(!running);setRunning(!running)}} aria-label={running?(en?'Pause slideshow':'Mettre le défilement en pause'):(en?'Resume slideshow':'Reprendre le défilement')}>{running?<Pause size={16}/>:<Play size={16}/>}</button>}<button className="mg-coverflow-arrow" type="button" onClick={()=>select(activeIndex+1)} aria-label={en?'Next category':'Catégorie suivante'} disabled={total<2}><ArrowRight size={18}/></button></div>
  <p className="mg-coverflow-status" aria-live={running?'off':'polite'} aria-atomic="true">{items[activeIndex].title} <span>· {activeIndex+1} / {total}</span></p>
  <p className="mg-coverflow-hint">{en?'Swipe or use the arrows to explore our projects.':'Glissez ou utilisez les flèches pour découvrir nos réalisations.'}</p>
 </div>;
}

export default CoverFlowCarousel;
