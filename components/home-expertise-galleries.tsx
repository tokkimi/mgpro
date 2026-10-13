'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import ExpertiseGalleryCard from './expertise-gallery';
import original from '@/content/original.json';
import english from '@/content/english.json';

const slugs=['a-propos','cuisine-haut-de-gamme','salle-de-bain','sous-sol','agrandissement','renovation-commerciale','bureaux-commerciaux'];

export default function HomeExpertiseGalleries({locale='fr',onPhoto}:{locale?:'fr'|'en';onPhoto:(src:string)=>void}){
 const ref=useRef<HTMLDivElement>(null);
 const [edges,setEdges]=useState({start:true,end:false});
 const en=locale==='en';
 const groups=slugs.map(slug=>{
  const page=original.pages.find(page=>page.slug===slug)!;
  const translated=english.find(page=>page.slug===slug);
  return {slug,title:en?translated?.label||page.label:page.label,subtitle:'',photos:[...new Set(page.blocks.filter(block=>block.type==='image').map(block=>block.src).filter((src):src is string=>!!src))]};
 });
 function measure(){const row=ref.current;if(row){const next={start:row.scrollLeft<=2,end:row.scrollLeft+row.clientWidth>=row.scrollWidth-2};setEdges(previous=>previous.start===next.start&&previous.end===next.end?previous:next)}}
 useEffect(()=>{const row=ref.current;if(!row)return;const observer=new ResizeObserver(measure);observer.observe(row);measure();return()=>observer.disconnect()},[]);
 function scroll(direction:number){
  const row=ref.current,card=row?.firstElementChild;if(!row||!card)return;
  const step=card.getBoundingClientRect().width+(parseFloat(getComputedStyle(row).columnGap)||0);
  row.scrollBy({left:direction*step,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 return <section className="home-expertise-galleries" aria-labelledby="home-expertise-title">
  <header className="home-expertise-heading"><h2 id="home-expertise-title">{en?'Our expertise.':'Nos expertises.'}</h2><div><button type="button" onClick={()=>scroll(-1)} disabled={edges.start} aria-label={en?'Previous expertise':'Expertise précédente'} aria-controls="home-expertise-track"><ArrowLeft size={18}/></button><button type="button" onClick={()=>scroll(1)} disabled={edges.end} aria-label={en?'Next expertise':'Expertise suivante'} aria-controls="home-expertise-track"><ArrowRight size={18}/></button></div></header>
  <div id="home-expertise-track" className="home-expertise-track" ref={ref} tabIndex={0} aria-label={en?'Explore all seven expertise galleries':'Parcourir les sept galeries de nos expertises'} onScroll={measure} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();scroll(event.key==='ArrowRight'?1:-1)}}}>
   {groups.map((group,index)=><ExpertiseGalleryCard key={group.slug} className="home-expertise-card" group={group} index={index} locale={locale} onOpen={onPhoto} href={en?(group.slug==='a-propos'?'/en/about':`/en/services/${group.slug}`):(group.slug==='a-propos'?'/a-propos':`/services/${group.slug}`)}/>)}
  </div>
 </section>;
}
