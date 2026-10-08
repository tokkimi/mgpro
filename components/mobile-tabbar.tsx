'use client';

import {useEffect,useState} from 'react';
import {CalendarDays,ClipboardList,FileText,FolderKanban,Hourglass,Activity,LayoutDashboard,MapPin,Menu,MessageSquare,Plus,ReceiptText,Users,Wallet,X} from 'lucide-react';

type Action={id:string;label:string;icon:React.ComponentType<{size?:number}>;run:()=>void};
type Props={role:'admin'|'worker'|'client';view:string;go:(view:string)=>void;start:(kind:string)=>void;openMenu:()=>void};

/**
 * Phone bottom bar with the five most used actions (admin: home, projects, start a visit, create a quote, more).
 * "Plus" opens a sheet with the next most frequent actions; the full menu stays available from there.
 */
export default function MobileTabbar({role,view,go,start,openMenu}:Props){
 const [sheet,setSheet]=useState(false);
 useEffect(()=>{if(!sheet)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setSheet(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[sheet]);
 const tab=(id:string,label:string,Icon:Action['icon'],run:()=>void,primary=false)=><button key={id} type="button" className={`tab${view===id?' active':''}${primary?' primary':''}`} aria-current={view===id?'page':undefined} onClick={()=>{setSheet(false);run()}}><span><Icon size={primary?22:20}/></span>{label}</button>;
 const more:Action[]=role==='admin'?[
  {id:'invoice',label:'Nouvelle facture',icon:ReceiptText,run:()=>start('invoice')},
  {id:'expense',label:'Nouvelle dépense',icon:Wallet,run:()=>start('expense')},
  {id:'task',label:'Nouvelle tâche',icon:ClipboardList,run:()=>start('task')},
  {id:'client',label:'Nouveau client',icon:Users,run:()=>start('client')},
  {id:'agenda',label:'Calendrier',icon:CalendarDays,run:()=>go('agenda')},
  {id:'health',label:'Santé des projets',icon:Activity,run:()=>go('health')},
  {id:'decisions',label:'Décisions clients',icon:Hourglass,run:()=>go('decisions')},
  {id:'invoices',label:'Factures',icon:ReceiptText,run:()=>go('invoices')}
 ]:role==='worker'?[{id:'messages',label:'Messagerie',icon:MessageSquare,run:()=>go('messages')},{id:'documents',label:'Documents',icon:FileText,run:()=>go('documents')}]:[{id:'documents',label:'Documents',icon:FileText,run:()=>go('documents')},{id:'accounting',label:'Factures',icon:ReceiptText,run:()=>go('accounting')}];
 return <>
  {sheet&&<div className="tabbar-sheet" role="dialog" aria-modal="true" aria-label="Plus d’actions"><button type="button" className="tabbar-backdrop" aria-label="Fermer" onClick={()=>setSheet(false)}/><div className="tabbar-panel"><header><b>Actions rapides</b><button type="button" className="icon-button" aria-label="Fermer" onClick={()=>setSheet(false)}><X size={18}/></button></header><div className="tabbar-grid">{more.map(a=><button key={a.id} type="button" onClick={()=>{setSheet(false);a.run()}}><a.icon size={20}/><span>{a.label}</span></button>)}<button type="button" onClick={()=>{setSheet(false);openMenu()}}><Menu size={20}/><span>Menu complet</span></button></div></div></div>}
  <nav className="mobile-tabbar" aria-label="Actions principales">
   {tab('dashboard','Accueil',LayoutDashboard,()=>go('dashboard'))}
   {tab('projects','Projets',FolderKanban,()=>go('projects'))}
   {role==='admin'?tab('visit','Visite',MapPin,()=>start('visit'),true):role==='worker'?tab('tasks','Tâches',ClipboardList,()=>go('tasks'),true):tab('quotes','Devis',FileText,()=>go('quotes'),true)}
   {role==='admin'?tab('quote','Devis',FileText,()=>start('quote')):tab('messages','Messages',MessageSquare,()=>go('messages'))}
   <button type="button" className={`tab${sheet?' active':''}`} aria-expanded={sheet} onClick={()=>setSheet(x=>!x)}><span><Plus size={20}/></span>Plus</button>
  </nav>
 </>;
}
