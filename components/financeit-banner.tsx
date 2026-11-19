import {ArrowUpRight} from "lucide-react";

export default function FinanceitBanner({href,english=false}:{href:string;english?:boolean}){
 return <aside className="financeit-banner" aria-label={english?"Financeit financing":"Financement Financeit"}>
  <img src="/images/financeit-logo-officiel.svg" alt="Financeit"/>
  <div className="financeit-banner-copy"><strong>{english?"Flexible payments, at your pace.":"Des paiements flexibles, à votre rythme."}</strong><small>{english?"Subject to credit approval and applicable terms.":"Sous réserve d’approbation de crédit et des conditions applicables."}</small></div>
  <a href={href} target="_blank" rel="noopener noreferrer">{english?"Explore financing":"Découvrir le financement"}<ArrowUpRight size={17} aria-hidden="true"/></a>
 </aside>;
}
