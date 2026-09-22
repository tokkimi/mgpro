'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {X,Download,Send,Save,Plus,Trash2,Box,Layers,Info} from 'lucide-react';
import {Data,RecordItem,money,totals,round} from '@/lib/model';
import {materialsBySurface,findMaterial,materialLine,surfaceLabels,Surface} from '@/lib/materials';
import Room3D from './room-3d';
// "Dernière modification" of a quote: a visual studio where the room is shown in
// 3D from the visit measurements, materials are previewed and priced live, then
// the quote can be saved, downloaded as PDF or emailed to the client.
const SURFACES:Surface[]=['floor','wall','counter'];
const seedRoom=():Data=>({name:'Pièce',length:12,width:10,height:8,unit:'pi',materials:{}});
export default function QuoteStudio({quote,client,settings,busy,onSave,onClose,onPdf,onSend,error,readOnly=false}:{quote:RecordItem;client:Data;settings:Data;busy:boolean;onSave:(data:Data)=>Promise<void>|void;onClose:()=>void;onPdf:()=>void;onSend:(data:Data)=>void;error?:string;readOnly?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>{ref.current?.close();};},[]);
 const [data,setData]=useState<Data>(()=>{const d=structuredClone(quote.data);if(!Array.isArray(d.rooms)||!d.rooms.length)d.rooms=[seedRoom()];d.rooms=d.rooms.map((r:Data)=>({...r,materials:r.materials||{}}));if(!Array.isArray(d.lines))d.lines=[];return d;});
 const [active,setActive]=useState(0);
 const [saved,setSaved]=useState(false);
 const room:Data=data.rooms[active]||data.rooms[0];
 const t=useMemo(()=>totals(data),[data]);
 const dirty=useRef(false);
 function update(next:Data){if(readOnly)return;dirty.current=true;setSaved(false);setData(next);}
 // Recompute the priced line for one surface of a room from its selected material.
 function syncLine(next:Data,r:Data,surface:Surface){
  const mid=r.materials?.[surface];
  next.lines=(next.lines||[]).filter((l:Data)=>!(l.surface===surface&&l.room===(r.name||'')));
  const m=findMaterial(mid);
  if(m)next.lines=[...next.lines,materialLine(r,surface,m)];
 }
 function chooseMaterial(surface:Surface,id:string){
  const next=structuredClone(data);const r=next.rooms[active];
  r.materials={...(r.materials||{}),[surface]:r.materials?.[surface]===id?'':id};
  syncLine(next,r,surface);
  next.material_selection=SURFACES.flatMap(s=>next.rooms.map((rm:Data)=>{const mm=findMaterial(rm.materials?.[s]);return mm?{surface:surfaceLabels[s],name:mm.name,room:rm.name,id:mm.id}:null;})).filter(Boolean);
  update(next);
 }
 function editRoom(key:string,value:any){
  const next=structuredClone(data);const r=next.rooms[active];if(key==='name')next.lines=next.lines.map((l:Data)=>l.room===r.name?{...l,room:value}:l);r[key]=key==='name'||key==='unit'?value:Number(value);
  for(const s of SURFACES)if(r.materials?.[s])syncLine(next,r,s);// re-price on dimension change
  update(next);
 }
 function addRoom(){const next=structuredClone(data);next.rooms=[...next.rooms,{...seedRoom(),name:`Pièce ${next.rooms.length+1}`}];update(next);setActive(next.rooms.length-1);}
 function editLine(i:number,key:string,value:any){const next=structuredClone(data);next.lines[i]={...next.lines[i],[key]:key==='description'||key==='unit'?value:Number(value)};update(next);}
 function removeLine(i:number){const next=structuredClone(data);const l=next.lines[i];next.lines.splice(i,1);if(l?.surface&&l?.room){const rm=next.rooms.find((r:Data)=>r.name===l.room);if(rm?.materials)rm.materials[l.surface]='';}update(next);}
 function addLine(){const next=structuredClone(data);next.lines=[...(next.lines||[]),{description:'',quantity:1,unit:'forfait',price:0}];update(next);}
 async function persist(){await onSave(data);dirty.current=false;setSaved(true);}
 async function withSave(fn:()=>void){if(!readOnly)await persist();fn();}
 const floor=findMaterial(room?.materials?.floor),walls=findMaterial(room?.materials?.wall),counter=findMaterial(room?.materials?.counter);
 return <dialog ref={ref} className="app-dialog wide studio-dialog" onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}>
  <header><div><h2>Aperçu 3D & matériaux</h2><small className="studio-sub">{quote.data.number} · {client?.name||'Client'}</small></div><button className="icon-button" aria-label="Fermer" onClick={onClose}><X/></button></header>
  <div className="studio-body">
   <section className="studio-visual">
    <Room3D room={room} floor={floor} walls={walls} counter={counter}/>
    <div className="studio-rooms">
     {data.rooms.map((r:Data,i:number)=><button key={i} type="button" className={i===active?'active':''} onClick={()=>setActive(i)}><Box size={14}/>{r.name||`Pièce ${i+1}`}</button>)}
     <button type="button" className="studio-addroom" disabled={readOnly} onClick={addRoom}><Plus size={14}/>Pièce</button>
    </div>
    <div className="studio-dims">
     {[['name','Nom','text'],['length','Long.','number'],['width','Larg.','number'],['height','Haut.','number']].map(([k,label,type])=><label key={k}>{label}<input disabled={readOnly} type={type} value={room?.[k]??''} onChange={e=>editRoom(k,e.target.value)}/></label>)}
     <label>Unité<select disabled={readOnly} value={room?.unit||'pi'} onChange={e=>editRoom('unit',e.target.value)}><option value="pi">pi</option><option value="m">m</option></select></label>
    </div>
    <p className="studio-hint"><Info size={13}/>Aperçu visuel indicatif basé sur les mesures relevées.</p>
   </section>
   <section className="studio-controls">
    <div className="studio-scroll">
     {SURFACES.map(surface=><div className="material-group" key={surface}>
      <h4><Layers size={14}/>{surfaceLabels[surface]}</h4>
      <div className="material-swatches">
       {materialsBySurface(surface).map(m=>{const line=materialLine(room,surface,m);const total=round(line.quantity*line.price);const selected=room?.materials?.[surface]===m.id;return <button key={m.id} type="button" className={`material-swatch ${selected?'selected':''}`} disabled={readOnly} onClick={()=>chooseMaterial(surface,m.id)} title={m.description}>
        <span className="swatch-chip" style={{backgroundColor:m.color,backgroundImage:m.texture||'none'}}/>
        <span className="swatch-name">{m.name}</span>
        <span className="swatch-price">{money(line.price)}/{line.unit} · <b>{money(total)}</b></span>
       </button>;})}
      </div>
     </div>)}
     <div className="material-group">
      <h4>Lignes de la soumission</h4>
      {(data.lines||[]).map((l:Data,i:number)=><div className="studio-line" key={i}>
       <input disabled={readOnly} className="studio-line-desc" value={l.description||''} placeholder="Description" onChange={e=>editLine(i,'description',e.target.value)}/>
       <div className="studio-line-nums">
        <input disabled={readOnly} type="number" aria-label="Quantité" value={l.quantity??0} onChange={e=>editLine(i,'quantity',e.target.value)}/>
        <input disabled={readOnly} aria-label="Unité" value={l.unit||''} onChange={e=>editLine(i,'unit',e.target.value)}/>
        <input disabled={readOnly} type="number" aria-label="Prix unitaire" value={l.price??0} onChange={e=>editLine(i,'price',e.target.value)}/>
        <b>{money(Number(l.quantity||0)*Number(l.price||0))}</b>
        <button type="button" className="icon-button" aria-label="Supprimer" disabled={readOnly} onClick={()=>removeLine(i)}><Trash2 size={15}/></button>
       </div>
      </div>)}
      <button type="button" className="btn secondary small" disabled={readOnly} onClick={addLine}><Plus size={15}/>Ajouter une ligne</button>
     </div>
    </div>
    <div className="studio-footer">
     <div className="studio-totals">
      <div><span>Sous-total</span><b>{money(t.subtotal)}</b></div>
      <div><span>TPS + TVQ</span><b>{money(t.tps+t.tvq)}</b></div>
      <div className="studio-total"><span>Total</span><b>{money(t.total)}</b></div>
     </div>
     {error&&<p className="error">{error}</p>}
     <div className="studio-actions">
      {readOnly?<span className="studio-readonly"><Info size={14}/>Aperçu client — les prix évoluent selon les matériaux choisis.</span>:<button className="btn ghost small" onClick={persist} disabled={busy}><Save size={15}/>{saved&&!dirty.current?'Enregistré':'Enregistrer'}</button>}
      <button className="btn secondary small" onClick={()=>withSave(onPdf)} disabled={busy}><Download size={15}/>PDF</button>
      {!readOnly&&<button className="btn primary small" onClick={()=>onSend(data)} disabled={busy}><Send size={15}/>Envoyer au client</button>}
     </div>
    </div>
   </section>
  </div>
 </dialog>;
}
