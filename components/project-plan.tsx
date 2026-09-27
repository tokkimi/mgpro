'use client';

import {useEffect,useRef,useState} from 'react';
import {extensionTemplate,fromRooms,planSchema,type Plan} from '@/lib/plan';
import type {RecordItem,Data} from '@/lib/model';
import PlanEditor from './plan-editor';
import PlanInvitations from './plan-invitations';
import ProjectOperations from './project-operations';

type Props={
 record:RecordItem;visits:RecordItem[];documents:RecordItem[];email:string;
 demo:boolean;userId:string;onSave:(data:Data)=>Promise<RecordItem>;onUpload:(file:File)=>Promise<void>
};

export default function ProjectPlan({record,visits,documents,email,demo,userId,onSave,onUpload}:Props){
 const [plan,setPlan]=useState<Plan|null>(record.data.plan||null);
 const [removedDocuments,setRemovedDocuments]=useState<string[]>([]);
 const [open,setOpen]=useState(false);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [recovery,setRecovery]=useState<Plan|null>(null);
 const [saved,setSaved]=useState(!!record.data.plan);
 const [changed,setChanged]=useState(false);
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
 return <section className="panel project-plan-panel">
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
 </section>;
}
