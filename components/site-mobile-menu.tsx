'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Mail,Menu,Phone,X} from 'lucide-react';
import LanguageSwitch from './language-switch';
import PublicBrandLogo from './public-brand-logo';

type Props={locale?:'fr'|'en';finance:string;phone:string;email:string;onQuote:()=>void};
export default function SiteMobileMenu({locale='fr',finance,phone,email,onQuote}:Props){
 const [open,setOpen]=useState(false);
 const ref=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const dismiss=useRef<HTMLButtonElement>(null);
 const en=locale==='en';
 const close=()=>ref.current?.close();
 useEffect(()=>{
  if(!open)return;
  const root=document.documentElement,previous=root.style.overflow;
  root.style.overflow='hidden';
  const desktop=window.matchMedia('(min-width:1201px)');
  const resize=()=>{if(desktop.matches)ref.current?.close()};
  desktop.addEventListener('change',resize);
  return()=>{root.style.overflow=previous;desktop.removeEventListener('change',resize)};
 },[open]);
 const links=en?[['/en#services','Our expertise'],['/en/about','About MG Pro'],['/en/blog','Renovation advice'],['/en#realisations','Our projects']]:[['/#services','Nos expertises'],['/a-propos','La maison MG Pro'],['/blogue','Blogue'],['/#realisations','Réalisations']];
 return <div className="site-mobile-menu"><button ref={trigger} type="button" className="site-mobile-menu-trigger" aria-label={en?'Open navigation menu':'Ouvrir le menu de navigation'} aria-haspopup="dialog" aria-expanded={open} onClick={()=>{ref.current?.showModal();dismiss.current?.focus({preventScroll:true});setOpen(true)}}><Menu size={24}/></button><dialog ref={ref} className="site-mobile-menu-panel" aria-label={en?'MG Pro navigation':'Navigation MG Pro'} onClose={()=>{setOpen(false);trigger.current?.focus()}} onClick={event=>{if(event.target===ref.current)close()}}><header><Link href={en?'/en':'/'} onClick={close} aria-label={en?'MG Pro home':'MG Pro accueil'}><PublicBrandLogo variant={'menu'} alt="MG Pro"/></Link><button ref={dismiss} type="button" aria-label={en?'Close menu':'Fermer le menu'} onClick={close}><X size={23}/></button></header><nav aria-label={en?'Mobile navigation':'Navigation mobile'}>{links.map(([url,label])=><Link href={url} key={url} onClick={close}>{label}<ArrowUpRight size={17}/></Link>)}<a href={finance} target="_blank" rel="noopener noreferrer" onClick={close}>{en?'Financing':'Financement'}<ArrowUpRight size={17}/></a></nav><div className="site-menu-actions"><button type="button" className="glass-button" onClick={()=>{close();onQuote()}}>{en?'Your project':'Votre projet'}<ArrowUpRight size={17}/></button><Link className="site-menu-client" href="/connexion" onClick={close}>{en?'Client portal':'Espace client'}<ArrowUpRight size={16}/></Link></div><footer><div className="site-menu-language"><span>{en?'Language':'Langue'}</span><div onClick={close}><LanguageSwitch/></div></div><a href={`tel:+1${phone.replace(/\D/g,'')}`}><Phone size={16}/>{phone}</a><a href={`mailto:${email}`}><Mail size={16}/>{email}</a></footer></dialog></div>;
}
