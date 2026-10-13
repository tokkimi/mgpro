'use client';

import {useId,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {LiquidButton} from './liquid-glass-button';

export type CircularAction={text:string;title:string;detail:string;image:string;imageAlt:string;href?:string;onClick?:()=>void;external?:boolean};

/** Circular reveal adapted to MG Pro: real actions, touch controls and reduced motion. */
export function CircularRevealHeading({items,centerText}:{items:CircularAction[];centerText:string}){
 const uid=useId().replaceAll(':','');
 const [active,setActive]=useState<number|null>(null);
 const selected=active===null?null:items[active];
 return <div className="mg-action-wheel-group">
  <div className="mg-action-wheel" onMouseLeave={()=>setActive(null)}>
   <div className="mg-wheel-inset"/>
   <div className="mg-wheel-center" aria-live="polite">
    {items.map((item,index)=><img key={item.text} src={item.image} alt={active===index?item.imageAlt:''} className={active===index?'visible':''} loading="lazy"/>)}
    <div className={selected?'mg-wheel-copy has-image':'mg-wheel-copy'}><span>{selected?'VOTRE PROJET MG PRO':'RÉNOVATIONS MG PRO'}</span><strong>{selected?.title||centerText}</strong><small>{selected?.detail||'Quatre façons de faire le premier pas.'}</small><ArrowUpRight size={24}/></div>
   </div>
   <svg viewBox="0 0 400 400" className="mg-wheel-ring" aria-label="Choisir une action">
    <defs>{items.map((_,index)=>{const start=index*90-120;const point=(angle:number)=>`${200+174*Math.cos(angle*Math.PI/180)},${200+174*Math.sin(angle*Math.PI/180)}`;return <path key={index} id={`${uid}-arc-${index}`} d={`M ${point(start)} A 174 174 0 0 1 ${point(start+70)}`} fill="none"/>})}</defs>
    {items.map((item,index)=><a key={item.text} href={item.href||'#soumission'} role={item.href?'link':'button'} tabIndex={0} aria-label={item.title} target={item.external?'_blank':undefined} rel={item.external?'noopener noreferrer':undefined} className={active===index?'active':''} onMouseEnter={()=>setActive(index)} onFocus={()=>setActive(index)} onBlur={()=>setActive(null)} onClick={event=>{if(item.onClick){event.preventDefault();item.onClick()}}} onKeyDown={event=>{if(item.onClick&&event.key===' '){event.preventDefault();item.onClick()}}}>
     <use href={`#${uid}-arc-${index}`} stroke="transparent" strokeWidth="40" fill="none"/>
     <text><textPath href={`#${uid}-arc-${index}`} startOffset="50%" textAnchor="middle">{item.text.toLocaleUpperCase('fr')}</textPath></text>
    </a>)}
   </svg>
  </div>
  <div className="mg-wheel-actions" aria-label="Les quatre actions MG Pro">{items.map((item,index)=><LiquidButton key={item.text} href={item.href} external={item.external} onClick={item.onClick} onMouseEnter={()=>setActive(index)} onFocus={()=>setActive(index)} onBlur={()=>setActive(null)}><span>{item.text}</span><ArrowUpRight size={16}/></LiquidButton>)}</div>
 </div>;
}
