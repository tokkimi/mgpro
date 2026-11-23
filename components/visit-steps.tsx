'use client';
import {useRef} from 'react';

const stages=[
 ['Client et besoins','Choisissez le client et notez les travaux à prévoir.'],
 ['Relevé sur place','Ajoutez les mesures, les médias et vos notes de visite.'],
 ['Plan 2D','Vérifiez le plan et les dimensions des pièces.'],
 ['Visite 3D','Explorez les pièces et choisissez les finitions.'],
 ['Devis','Vérifiez les postes avant d’enregistrer.'],
];

export default function VisitSteps({step,disabled,onChange}:{step:number;disabled:boolean;onChange:(step:number)=>void}){
 const start=useRef<{x:number;y:number}|null>(null);
 const [title,help]=stages[step];
 return <section className="visit-steps" aria-label="Étapes de visite">
  <div className="visit-step-title" onTouchStart={event=>{const p=event.touches[0];start.current=event.touches.length===1?{x:p.clientX,y:p.clientY}:null}}
   onTouchCancel={()=>{start.current=null}} onTouchEnd={event=>{
    const initial=start.current;start.current=null;
    if(!initial||disabled)return;
    const p=event.changedTouches[0],dx=p.clientX-initial.x,dy=p.clientY-initial.y;
    if(Math.abs(dx)>64&&Math.abs(dx)>Math.abs(dy)*1.6)onChange(Math.max(0,Math.min(stages.length-1,step+(dx<0?1:-1))));
   }}>
   <small>Étape {step+1} sur {stages.length}</small><h3>{title}</h3><p>{help}</p>
  </div>
  <nav aria-label="Accès direct aux étapes">{stages.map(([name],index)=><button type="button" key={name} className="btn secondary" aria-current={step===index?'step':undefined} disabled={disabled} onClick={()=>onChange(index)}><span>{index+1}</span> {name}</button>)}</nav>
 </section>;
}
