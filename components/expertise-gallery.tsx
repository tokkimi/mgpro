'use client';

import {useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Maximize2} from 'lucide-react';

type GalleryProps={locale?:'fr'|'en';group:{title:string;subtitle:string;photos:string[]};index:number;onOpen:(src:string)=>void;href?:string};

export function Gallery({group,onOpen,locale='fr',href}:GalleryProps){
 const ref=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState(0);
 const en=locale==='en';
 function scroll(direction:number){ref.current?.scrollBy({left:direction*ref.current.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 return <article className="gallery-column">
  <div className="gallery-column-top"><p>{group.subtitle}</p></div>
  <div className="gallery-track" ref={ref} tabIndex={0} aria-label={`${en?'Gallery':'Galerie'} ${group.title}, ${en?'horizontal slideshow':'défilement horizontal'}`} onScroll={()=>{if(ref.current)setPosition(Math.round(ref.current.scrollLeft/ref.current.clientWidth))}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();scroll(1)}if(e.key==='ArrowLeft'){e.preventDefault();scroll(-1)}}}>
   {group.photos.map((src,i)=><button key={src} onClick={()=>onOpen(src)} aria-label={`${en?'Enlarge':'Agrandir'} ${group.title}, photo ${i+1}`}><img src={src} alt={`MG Pro — ${group.title}, ${en?'view':'vue'} ${i+1}`} loading="lazy"/><span className="photo-expand glass-surface"><Maximize2 size={17}/></span></button>)}
  </div>
  <div className="gallery-column-bottom"><h3>{href?<Link href={href}>{group.title}</Link>:group.title}</h3><div><button aria-label={`${en?'Previous photo':'Photo précédente'} — ${group.title}`} disabled={position===0} onClick={()=>scroll(-1)}><ArrowLeft size={17}/></button><button aria-label={`${en?'Next photo':'Photo suivante'} — ${group.title}`} disabled={position>=group.photos.length-1} onClick={()=>scroll(1)}><ArrowRight size={17}/></button></div></div>
 </article>;
}

export default function ExpertiseGalleryCard({className='',...props}:GalleryProps&{className?:string}){
 const en=props.locale==='en';
 return <div className={`expertise-glass-gallery ${className}`}>
  <Gallery {...props}/>
  <div className="expertise-gallery-note glass-surface"><span>{en?'The MG Pro signature':'La signature MG Pro'}</span><span>{en?'Use the arrows or swipe to explore.':'Explorez les photos avec les flèches ou faites glisser.'}</span></div>
 </div>;
}
