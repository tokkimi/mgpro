'use client';

import {useEffect,useRef,useState} from 'react';
import {ClipboardList,Clock3,Package,Plus,ReceiptText,TrendingUp} from 'lucide-react';
import type {Data,RecordItem} from '@/lib/model';
import {money} from '@/lib/model';
import {emptyOperations,operationsFrom,operationTotals,type ProjectOperations} from '@/lib/project-operations';

type Tab='budget'|'orders'|'field';
type Props={record:RecordItem;demo:boolean;onSave:(data:Data)=>Promise<RecordItem>};
const today=()=>new Date().toISOString().slice(0,10);
const id=()=>crypto.randomUUID();

export default function ProjectOperations({record,demo,onSave}:Props){
 const [tab,setTab]=useState<Tab>('budget');
 const [operations,setOperations]=useState(()=>operationsFrom(record.data.operations));
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const dataRef=useRef(record.data);
 const key=`mgpro-project-operations-${record.id}`;
 dataRef.current=record.data;
 useEffect(()=>{if(!demo)return;setOperations(operationsFrom(record.data.operations));},[demo,record.id,record.data.operations]);
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw)setOperations(operationsFrom(JSON.parse(raw)));}catch{}},[key]);
 const totals=operationTotals(operations);
 async function commit(next:ProjectOperations){
  setOperations(next);
  try{localStorage.setItem(key,JSON.stringify(next));}catch{}
  if(demo){setMessage('Démonstration : données conservées pour cette session.');return;}
  setBusy(true);
  try{await onSave({...dataRef.current,operations:next});localStorage.removeItem(key);setMessage('Cockpit de chantier enregistré.');}
  catch(error){setMessage(`${(error as Error).message} Les données restent sur cet appareil.`);}
  finally{setBusy(false)}
 }
 function replace<K extends keyof ProjectOperations>(key:K,rows:ProjectOperations[K]){void commit({...operations,[key]:rows});}
 return <section className="panel project-operations">
  <div className="panel-title"><div><p className="eyebrow">COCKPIT DE CHANTIER</p><h2>Pilotage du projet</h2></div><span>{busy?'Enregistrement…':'Synchronisé'}</span></div>
  <div className="operations-layout">
   <div className="operations-main">
    <div className="operations-tabs" role="tablist" aria-label="Pilotage du projet">
     <button className={tab==='budget'?'active':''} role="tab" aria-selected={tab==='budget'} onClick={()=>setTab('budget')}><TrendingUp size={16}/>Budget</button>
     <button className={tab==='orders'?'active':''} role="tab" aria-selected={tab==='orders'} onClick={()=>setTab('orders')}><Package size={16}/>Achats & modifications</button>
     <button className={tab==='field'?'active':''} role="tab" aria-selected={tab==='field'} onClick={()=>setTab('field')}><ClipboardList size={16}/>Terrain & heures</button>
    </div>
    {tab==='budget'&&<Budget operations={operations} replace={replace}/>} 
    {tab==='orders'&&<Orders operations={operations} replace={replace}/>} 
    {tab==='field'&&<Field operations={operations} replace={replace}/>} 
   </div>
   <aside className="operations-rail">
    <p className="eyebrow">À DROITE, COMME SUR LE CHANTIER</p>
    <h3>État financier</h3>
    <dl><div><dt>Budget prévu</dt><dd>{money(totals.planned)}</dd></div><div><dt>Engagé fournisseur</dt><dd>{money(totals.committed)}</dd></div><div><dt>Réel saisi</dt><dd>{money(totals.actual)}</dd></div><div><dt>Reste indicatif</dt><dd className={totals.remaining<0?'negative':''}>{money(totals.remaining)}</dd></div></dl>
    <div className="operations-quick"><button onClick={()=>setTab('budget')}><Plus size={16}/>Ajouter un poste budgétaire</button><button onClick={()=>setTab('orders')}><ReceiptText size={16}/>Bon de commande ou extra</button><button onClick={()=>setTab('field')}><Clock3 size={16}/>Rapport ou heures du jour</button></div>
    <p className="muted">Les données sont enregistrées dans le projet. Elles restent en brouillon local si le réseau coupe.</p>
   </aside>
  </div>
  {message&&<p className="operations-message" role="status">{message}</p>}
 </section>;
}

function Budget({operations,replace}:{operations:ProjectOperations;replace:<K extends keyof ProjectOperations>(key:K,rows:ProjectOperations[K])=>void}){
 return <div className="operations-section"><div className="operations-heading"><div><h3>Budget par poste</h3><p>Comparez le prévu et le réel sans quitter le dossier.</p></div></div><form className="operations-add" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);const name=String(form.get('name')||'').trim();if(!name)return;replace('budget',[...operations.budget,{id:id(),name,budget:Number(form.get('budget'))||0,actual:Number(form.get('actual'))||0}]);event.currentTarget.reset();}}><input name="name" aria-label="Poste budgétaire" placeholder="Ex. Électricité" required/><input name="budget" aria-label="Budget prévu" type="number" min="0" step="0.01" placeholder="Budget" required/><input name="actual" aria-label="Coût réel" type="number" min="0" step="0.01" placeholder="Réel"/><button className="btn primary"><Plus size={16}/>Ajouter</button></form><div className="operations-list">{operations.budget.map(line=><div className="operation-row" key={line.id}><b>{line.name}</b><span>Prévu <strong>{money(line.budget)}</strong></span><span>Réel <strong>{money(line.actual)}</strong></span><button aria-label={`Supprimer ${line.name}`} onClick={()=>replace('budget',operations.budget.filter(item=>item.id!==line.id))}>Supprimer</button></div>)}{!operations.budget.length&&<p className="muted">Ajoutez les postes issus du devis pour suivre la marge du projet.</p>}</div></div>;
}

function Orders({operations,replace}:{operations:ProjectOperations;replace:<K extends keyof ProjectOperations>(key:K,rows:ProjectOperations[K])=>void}){
 return <div className="operations-section"><div className="operations-heading"><div><h3>Achats et modifications</h3><p>Suivez ce qui est demandé, reçu et approuvé avec le client.</p></div></div><div className="operation-split"><form className="operations-form" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);replace('purchaseOrders',[...operations.purchaseOrders,{id:id(),supplier:String(form.get('supplier')||'').trim(),title:String(form.get('title')||'').trim(),amount:Number(form.get('amount'))||0,neededBy:String(form.get('neededBy')||''),status:'Brouillon'}]);event.currentTarget.reset();}}><h4>Bon de commande</h4><input name="supplier" placeholder="Fournisseur" required/><input name="title" placeholder="Matériaux ou prestation" required/><input name="amount" type="number" min="0" step="0.01" placeholder="Montant hors taxes" required/><input name="neededBy" type="date" defaultValue={today()}/><button className="btn secondary"><Plus size={16}/>Créer le bon</button></form><form className="operations-form" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);replace('changeOrders',[...operations.changeOrders,{id:id(),title:String(form.get('title')||'').trim(),amount:Number(form.get('amount'))||0,days:Number(form.get('days'))||0,status:'Brouillon'}]);event.currentTarget.reset();}}><h4>Modification / extra</h4><input name="title" placeholder="Description de la modification" required/><input name="amount" type="number" min="0" step="0.01" placeholder="Montant hors taxes" required/><input name="days" type="number" min="0" step="1" placeholder="Jours ajoutés"/><button className="btn secondary"><Plus size={16}/>Préparer l’extra</button></form></div><div className="operations-list">{operations.purchaseOrders.map(order=><div className="operation-row" key={order.id}><b>{order.title}<small>{order.supplier} · requis {order.neededBy||'à préciser'}</small></b><strong>{money(order.amount)}</strong><select value={order.status} aria-label={`Statut de ${order.title}`} onChange={event=>replace('purchaseOrders',operations.purchaseOrders.map(item=>item.id===order.id?{...item,status:event.target.value as typeof item.status}:item))}>{['Brouillon','Envoyé','Reçu','Annulé'].map(status=><option key={status}>{status}</option>)}</select></div>)}{operations.changeOrders.map(change=><div className="operation-row change" key={change.id}><b>{change.title}<small>{change.days?`${change.days} jour(s) ajouté(s)`:'Impact calendrier à préciser'}</small></b><strong>{money(change.amount)}</strong><select value={change.status} aria-label={`Statut de ${change.title}`} onChange={event=>replace('changeOrders',operations.changeOrders.map(item=>item.id===change.id?{...item,status:event.target.value as typeof item.status}:item))}>{['Brouillon','À approuver','Approuvée','Refusée'].map(status=><option key={status}>{status}</option>)}</select></div>)}{!operations.purchaseOrders.length&&!operations.changeOrders.length&&<p className="muted">Aucun achat ni extra : tout reste clair avant de commander ou de faire approuver un changement.</p>}</div></div>;
}

function Field({operations,replace}:{operations:ProjectOperations;replace:<K extends keyof ProjectOperations>(key:K,rows:ProjectOperations[K])=>void}){
 return <div className="operations-section"><div className="operations-heading"><div><h3>Rapport journalier et heures</h3><p>Gardez une trace exploitable de chaque journée de chantier.</p></div></div><div className="operation-split"><form className="operations-form" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);replace('dailyLogs',[{id:id(),date:String(form.get('date')||today()),summary:String(form.get('summary')||'').trim(),blockers:String(form.get('blockers')||'').trim()},...operations.dailyLogs]);event.currentTarget.reset();}}><h4>Rapport du jour</h4><input name="date" type="date" defaultValue={today()}/><textarea name="summary" placeholder="Travaux réalisés, livraisons, photos…" required/><input name="blockers" placeholder="Blocage ou prochaine action"/><button className="btn secondary"><ClipboardList size={16}/>Ajouter au journal</button></form><form className="operations-form" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);replace('timesheets',[{id:id(),date:String(form.get('date')||today()),person:String(form.get('person')||'').trim(),hours:Number(form.get('hours'))||0},...operations.timesheets]);event.currentTarget.reset();}}><h4>Feuille d’heures</h4><input name="date" type="date" defaultValue={today()}/><input name="person" placeholder="Nom de la personne" required/><input name="hours" type="number" min="0.25" step="0.25" placeholder="Heures" required/><button className="btn secondary"><Clock3 size={16}/>Enregistrer les heures</button></form></div><div className="operations-list">{operations.dailyLogs.map(log=><div className="operation-row log" key={log.id}><b>{log.date}<small>{log.summary}</small>{log.blockers&&<small>À suivre : {log.blockers}</small>}</b><button aria-label={`Supprimer le rapport du ${log.date}`} onClick={()=>replace('dailyLogs',operations.dailyLogs.filter(item=>item.id!==log.id))}>Supprimer</button></div>)}{operations.timesheets.map(sheet=><div className="operation-row" key={sheet.id}><b>{sheet.person}<small>{sheet.date}</small></b><strong>{sheet.hours} h</strong><button aria-label={`Supprimer les heures de ${sheet.person}`} onClick={()=>replace('timesheets',operations.timesheets.filter(item=>item.id!==sheet.id))}>Supprimer</button></div>)}{!operations.dailyLogs.length&&!operations.timesheets.length&&<p className="muted">Ajoutez le premier rapport ou les heures de l’équipe pour démarrer le suivi.</p>}</div></div>;
}
