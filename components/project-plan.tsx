'use client';

import {useEffect,useRef,useState} from 'react';
import {extensionTemplate,fromRooms,planSchema,type Plan} from '@/lib/plan';
import {money,totals,type RecordItem,type Data} from '@/lib/model';
import PlanEditor from './plan-editor';
import PlanInvitations from './plan-invitations';
import ProjectOperations from './project-operations';

type Props={
 record:RecordItem;visits:RecordItem[];documents:RecordItem[];email:string;
 demo:boolean;userId:string;onSave:(data:Data)=>Promise<RecordItem>;onUpload:(file:File)=>Promise<void>
};
type Finance={contractValue:number;invoiced:number;paid:number;debit:number;balance:number};
const emptyFinance:Finance={contractValue:0,invoiced:0,paid:0,debit:0,balance:0};
function financeFor(projectId:string,rows:RecordItem[]):Finance{const related=rows.filter(row=>row.project_id===projectId),contracts=related.filter(row=>row.kind==='contract'&&row.data.status==='Signé'),quotes=related.filter(row=>row.kind==='quote'&&row.data.status==='Accepté'),linkedQuoteIds=new Set(contracts.map(contract=>String(contract.data.quote_id||'')).filter(Boolean));const contractValue=contracts.reduce((sum,contract)=>sum+(Number(contract.data.amount)||totals(contract.data).total),0)+quotes.filter(quote=>!linkedQuoteIds.has(quote.id)).reduce((sum,quote)=>sum+totals(quote.data).total,0);const invoices=related.filter(row=>row.kind==='invoice'&&!['Brouillon','Annulée'].includes(String(row.data.status)));const invoiced=invoices.reduce((sum,invoice)=>sum+totals(invoice.data).total,0),paid=invoices.reduce((sum,invoice)=>sum+Number(invoice.data.paid||0),0);return {contractValue,invoiced,paid,debit:Math.max(0,invoiced-paid),balance:Math.max(0,contractValue-invoiced)}}

export default function ProjectPlan({record,visits,documents,email,demo,userId,onSave,onUpload}:Props){
 const [plan,setPlan]=useState<Plan|null>(record.data.plan||null);
 const [removedDocuments,setRemovedDocuments]=useState<string[]>([]);
 const [open,setOpen]=useState(false);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [recovery,setRecovery]=useState<Plan|null>(null);
 const [saved,setSaved]=useState(!!record.data.plan);
 const [changed,setChanged]=useState(false);
 const [finance,setFinance]=useState<Finance>(emptyFinance);
 const [projectRows,setProjectRows]=useState<RecordItem[]>([]);
 const key=`mgpro-project-plan-${userId}-${record.id}`;
 const saveRef=useRef(onSave);
 const recordDataRef=useRef(record.data);
 saveRef.current=onSave;
 recordDataRef.current=record.data;
 const starterPlan=()=>fromRooms([{name:'Pièce principale',length:5,width:4,height:2.5,unit:'m'}]);

 useEffect(()=>{
  try{
   const raw=localStorage.getItem(key);
   if(!raw)return;
   const candidate=JSON.parse(raw);
   if(planSchema.safeParse(candidate).success)setRecovery(candidate);
  }catch{}
 },[key]);

 useEffect(()=>{let cancelled=false;if(demo){setFinance(emptyFinance);setProjectRows([]);return}void fetch('/api/records').then(response=>response.ok?response.json():null).then(result=>{if(!cancelled&&Array.isArray(result?.records)){setFinance(financeFor(record.id,result.records));setProjectRows(result.records.filter((row:RecordItem)=>row.project_id===record.id))}}).catch(()=>{});return()=>{cancelled=true}},[demo,record.id,record.updated_at]);

 useEffect(()=>{
  if(!changed||!plan||demo)return;
  const timer=window.setTimeout(async()=>{
   setBusy(true);
   try{
    await saveRef.current({...recordDataRef.current,plan});
    localStorage.removeItem(key);
    setRecovery(null);
    setSaved(true);
    setChanged(false);
    setMessage('Plan enregistré automatiquement dans le projet.');
   }catch(error){
    setMessage(`${(error as Error).message} Le plan reste conservé sur cet appareil.`);
   }finally{setBusy(false)}
  },900);
  return()=>window.clearTimeout(timer);
 },[changed,plan,demo,key]);

 function change(next:Plan){
  setPlan(next);
  setSaved(false);
  setChanged(true);
  try{
   localStorage.setItem(key,JSON.stringify(next));
   setMessage(demo?'Démonstration : modification temporaire.':'Modifications sauvegardées ici, puis enregistrées automatiquement dans le projet.');
  }catch{
   setMessage('Stockage local indisponible. Gardez cette page ouverte pendant l’enregistrement.');
  }
 }

 async function persist(){
  if(!plan)return;
  setBusy(true);
  try{
   await saveRef.current({...recordDataRef.current,plan});
   localStorage.removeItem(key);
   setRecovery(null);
   setSaved(true);
   setChanged(false);
   setMessage('Plan enregistré dans le projet. Vous pouvez le rouvrir à tout moment.');
  }catch(error){
   setMessage(`${(error as Error).message} Le plan reste conservé sur cet appareil.`);
  }finally{setBusy(false)}
 }

 async function removePdf(document:RecordItem){
  if(!window.confirm(`Supprimer définitivement « ${document.data.name} » ?`))return;
  setBusy(true);
  try{
   if(!demo){
    const response=await fetch('/api/documents',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:document.id})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Suppression impossible.');
    setMessage(result.warning||'PDF supprimé du projet et du stockage.');
   }else setMessage('Démonstration : PDF retiré de cette session.');
   setRemovedDocuments(ids=>[...ids,document.id]);
  }catch(error){setMessage((error as Error).message)}finally{setBusy(false)}
 }

 async function resetPlan(){
  if(!window.confirm('Supprimer le plan 2D/3D de ce projet ? Le brouillon de cet appareil sera aussi retiré.'))return;
  setBusy(true);
  try{
   const data={...recordDataRef.current};
   delete data.plan;
   if(!demo)await saveRef.current(data);
   localStorage.removeItem(key);
   setPlan(null);
   setOpen(false);
   setSaved(false);
   setChanged(false);
   setRecovery(null);
   setMessage(demo?'Démonstration : plan retiré.':'Plan 2D/3D supprimé du projet.');
  }catch(error){setMessage((error as Error).message)}finally{setBusy(false)}
 }

 const pdfs=documents.filter(document=>document.data.mime==='application/pdf'&&!removedDocuments.includes(document.id));
 const visitPlans=visits.filter(visit=>visit.data.plan);
 const usablePlan=!!plan&&planSchema.safeParse(plan).success;
 const openTasks=projectRows.filter(row=>row.kind==='task'&&row.data.status!=='Validée'),phases=projectRows.filter(row=>row.kind==='phase'&&!row.data.archived),nextVisit=[...visits].sort((a,b)=>String(a.data.date||a.data.start||'9999').localeCompare(String(b.data.date||b.data.start||'9999')))[0],progress=phases.length?Math.round(phases.reduce((sum,phase)=>sum+Math.max(0,Math.min(100,Number(phase.data.progress||0))),0)/phases.length):0;
 const triggerAction=(label:string)=>{const action=[...document.querySelectorAll<HTMLButtonElement>('.detail-actions button')].find(button=>button.textContent?.includes(label));action?.click()};
 return <><section className="project-finance-summary" aria-label="Suivi financier du projet"><article className="finance-value"><span>Valeur du contrat</span><strong>{money(finance.contractValue)}</strong><small>Signé et accepté</small></article><article className="finance-invoiced"><span>Facturé à ce jour</span><strong>{money(finance.invoiced)}</strong><small>Factures émises</small></article><article className="finance-paid"><span>Payé à ce jour</span><strong>{money(finance.paid)}</strong><small>Paiements reçus</small></article><article className="finance-debit"><span>Compte débiteur</span><strong>{money(finance.debit)}</strong><small>À encaisser</small></article><article className="finance-balance"><span>Solde du contrat</span><strong>{money(finance.balance)}</strong><small>Reste à facturer</small></article></section><section className="project-entry-grid" aria-label="Accueil du projet"><article><p className="eyebrow">À FAIRE MAINTENANT</p><h3>{openTasks.length?openTasks.length+' tâche'+(openTasks.length>1?'s':''):'Aucune tâche urgente'}</h3><p>{openTasks[0]?.data.title||'Le chantier est à jour.'}</p><button type="button" onClick={()=>document.querySelector('.project-workboard')?.scrollIntoView({behavior:'smooth',block:'start'})}>Voir les tâches</button></article><article><p className="eyebrow">PROCHAIN RENDEZ-VOUS</p><h3>{nextVisit?.data.title||'Aucune visite planifiée'}</h3><p>{nextVisit?(nextVisit.data.date||nextVisit.data.start||'Date à préciser'):'Ajoutez une visite depuis les actions du projet.'}</p><button type="button" onClick={()=>document.querySelector('.project-workboard')?.scrollIntoView({behavior:'smooth',block:'start'})}>Voir l’agenda</button></article><article><p className="eyebrow">SUIVI DU CHANTIER</p><h3>{progress}% d’avancement</h3><p>{phases.length?phases.length+' phase'+(phases.length>1?'s':'')+' active(s)':'Créez les phases du projet.'}</p><button type="button" onClick={()=>document.querySelector('.project-phases')?.scrollIntoView({behavior:'smooth',block:'start'})}>Voir les phases</button></article><article><p className="eyebrow">PLANS ET FICHIERS</p><h3>{documents.length} document{documents.length>1?'s':''}</h3><p>{plan?'Plan 2D / 3D disponible':'Ajoutez un plan ou un PDF de référence.'}</p><button type="button" onClick={()=>document.getElementById('project-plans')?.scrollIntoView({behavior:'smooth',block:'start'})}>Ouvrir les plans</button></article></section><section className="project-top-actions"><header><div><p className="eyebrow">ACTIONS DU DOSSIER</p><h2>Piloter le projet</h2></div><label>Statut<select value={record.data.status||'Planifié'} onChange={event=>void onSave({...record.data,status:event.target.value})}>{['Planifié','En cours','En pause','Terminé'].map(status=><option key={status}>{status}</option>)}</select></label></header><div>{['Ajouter une phase','Ajouter une tâche','Faire un relevé','Créer une soumission','Ajouter un ordre de changement','Créer le cahier des charges'].map(action=><button key={action} type="button" onClick={()=>triggerAction(action)}>{action}</button>)}<button type="button" onClick={()=>document.querySelector<HTMLInputElement>('.detail-actions .upload-button input')?.click()}>Ajouter photos / PDF</button><button className="archive-action" type="button" onClick={()=>triggerAction('Archiver le projet')}>Archiver le projet</button></div></section><section className="panel project-plan-panel">
  <div className="panel-title"><div><p className="eyebrow">PLANS DU DOSSIER</p><h2>Plans 2D & 3D</h2></div>{saved&&<span className="saved-indicator">Enregistré</span>}</div>
  <div className="detail-body">
   <p>Le plan reste relié au projet, même après la visite. Ajoutez le PDF de référence, reprenez les pièces et ouvrez la visualisation 3D quand vous le souhaitez.</p>
   <label className="upload-button">Ajouter le PDF du plan<input type="file" accept="application/pdf" disabled={busy||demo} onChange={async event=>{const file=event.target.files?.[0];if(!file)return;setBusy(true);try{if(file.size>4*1024*1024)throw Error('Le PDF doit faire moins de 4 Mo.');await onUpload(file);setMessage('PDF conservé sur cet appareil et prêt à être transféré.')}catch(error){setMessage((error as Error).message)}finally{setBusy(false);event.target.value=''}}}/></label>
   {pdfs.length>0&&<div className="plan-document-list">{pdfs.map(document=><div className="plan-document" key={document.id}><a href={`/api/documents?id=${document.id}`} target="_blank" rel="noreferrer">PDF · {document.data.name}</a><button type="button" className="plan-document-delete" disabled={busy} onClick={()=>removePdf(document)} aria-label={`Supprimer ${document.data.name}`}>Supprimer</button></div>)}</div>}
   <p className="muted">Le PDF sert de référence : il n’est pas converti automatiquement en géométrie. Le plan 2D reste modifiable pièce par pièce avant la prévisualisation 3D.</p>
   {recovery&&<button className="btn secondary" onClick={()=>{setPlan(recovery);setSaved(false);setChanged(true);setRecovery(null);setOpen(true)}}>Reprendre les modifications non enregistrées</button>}
   {!plan&&<div className="button-row"><button className="btn primary" onClick={()=>{change(starterPlan());setOpen(true)}}>Créer le plan 2D</button>{pdfs.length>0&&<button className="btn secondary" onClick={()=>{change(extensionTemplate());setOpen(true)}}>Créer un relevé maison / agrandissement</button>}{visitPlans.map(visit=><button className="btn secondary" key={visit.id} onClick={()=>{change(structuredClone(visit.data.plan));setOpen(true)}}>Reprendre le plan : {visit.data.title}</button>)}</div>}
   {plan&&!usablePlan&&<div className="notice"><b>Ce plan n’a pas de mesures utilisables.</b><p>Il faut au moins une pièce avec longueur, largeur et hauteur. Créez une base propre puis adaptez les cotes à partir du PDF.</p><button className="btn primary" disabled={busy} onClick={()=>{change(starterPlan());setOpen(true)}}>Réinitialiser avec une pièce mesurée</button><button className="btn secondary" disabled={busy} onClick={()=>{change(extensionTemplate());setOpen(true)}}>Créer le relevé maison / agrandissement</button><button className="btn danger-outline" disabled={busy} onClick={resetPlan}>Supprimer ce plan</button></div>}
   {plan&&usablePlan&&<><div className="button-row"><button className="btn primary" onClick={()=>setOpen(value=>!value)}>{open?'Fermer la visualisation':plan.validated?'Visualiser en 3D':'Ouvrir le plan 2D'}</button><button className="btn secondary" disabled={busy} onClick={persist}>Enregistrer maintenant</button><button className="btn danger-outline" disabled={busy} onClick={resetPlan}>Supprimer le plan 2D/3D</button></div>{open&&<PlanEditor value={plan} onChange={change} initialView="design" references={pdfs.map(document=>({id:document.id,name:document.data.name,href:`/api/documents?id=${document.id}`}))}/>} {saved&&plan.validated&&<PlanInvitations id={record.id} email={email} demo={demo}/>}</>}
   {message&&<p role="status">{message}</p>}
  </div>
  <ProjectOperations record={record} demo={demo} onSave={onSave}/>
 </section></>;
}
