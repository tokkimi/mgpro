'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Plan} from '@/lib/plan';
import {surfacesFor,type CatalogueRow,type FinishChoice} from '@/lib/finishes';

let catalogue:Promise<CatalogueRow[]>|null=null;
const load=()=>catalogue??=import('@/lib/finish-catalogue.json').then(m=>(m.default as unknown as CatalogueRow[]));

/** Choose, room by room, the finishes from the MG Pro catalogue; the 3D model updates immediately. */
export default function FinishPanel({plan,roomId,onRoom,onChange,onClose}:{plan:Plan;roomId:string;onRoom:(id:string)=>void;onChange:(plan:Plan)=>void;onClose:()=>void}){
 const rooms=plan.rooms.filter(r=>r.phase!=='remove');
 const room=rooms.find(r=>r.id===roomId)||rooms[0];
 const [rows,setRows]=useState<CatalogueRow[]>([]);const [query,setQuery]=useState('');
 useEffect(()=>{void load().then(setRows)},[]);
 const surfaces=room?surfacesFor(room.furniture):[];
 const chosen=(room&&plan.finishes?.[room.id])||{};
 const options=useMemo(()=>{const map:Record<string,Map<string,CatalogueRow[]>>={};for(const s of surfaces){const names=new Map<string,CatalogueRow[]>();for(const r of rows)if(s.subs.includes(r[2])&&(!query||`${r[3]} ${r[2]}`.toLowerCase().includes(query.toLowerCase()))){const k=`${r[2]}|${r[3]}`;names.set(k,[...(names.get(k)||[]),r])}map[s.key]=names}return map},[rows,surfaces.map(s=>s.key).join(),query]);
 if(!room)return null;
 function set(key:string,choice:FinishChoice|null){const roomF={...(plan.finishes?.[room.id]||{})};if(choice)roomF[key]=choice;else delete roomF[key];onChange({...plan,finishes:{...(plan.finishes||{}),[room.id]:roomF}})}
 return <aside className="finish-panel" aria-label="Finitions">
  <header><b>Finitions</b><button type="button" aria-label="Fermer" onClick={onClose}>✕</button></header>
  <div className="finish-rooms">{rooms.map(r=><button type="button" key={r.id} className={r.id===room.id?'active':''} onClick={()=>onRoom(r.id)}>{r.name}</button>)}</div>
  <input className="finish-search" placeholder="Rechercher (chêne, marbre, noir mat…)" value={query} onChange={e=>setQuery(e.target.value)}/>
  {!rows.length&&<p className="muted">Chargement du catalogue…</p>}
  {surfaces.map(s=>{const groups=options[s.key]||new Map();const current=chosen[s.key];const variants=current?(groups.get(`${current.sub}|${current.name}`)||[]):[];
   return <div className="finish-row" key={s.key}>
    <label>{s.label}
     <select value={current?`${current.sub}|${current.name}`:''} onChange={e=>{const list=groups.get(e.target.value);if(!list){set(s.key,null);return}const r=list[0];set(s.key,{id:r[0],name:r[3],variant:r[4],sub:r[2]})}}>
      <option value="">Par défaut</option>
      {current&&!groups.has(`${current.sub}|${current.name}`)&&<option value={`${current.sub}|${current.name}`}>{current.name}</option>}
      {s.subs.map(sub=>{const items=[...groups.entries()].filter(([k])=>k.startsWith(sub+'|'));return items.length?<optgroup key={sub} label={sub}>{items.map(([k,list])=><option key={k} value={k}>{list[0][3]}</option>)}</optgroup>:null})}
     </select>
    </label>
    {current&&variants.length>1&&<label className="finish-variant">Variante<select value={current.id} onChange={e=>{const r=variants.find(v=>v[0]===e.target.value);if(r)set(s.key,{id:r[0],name:r[3],variant:r[4],sub:r[2]})}}>{variants.map(v=><option key={v[0]} value={v[0]}>{v[4]}</option>)}</select></label>}
    {current&&<small className="muted">Réf. {current.id} · à sourcer</small>}
   </div>})}
  <p className="muted finish-note">Rendu 3D indicatif : les textures définitives seront appliquées dès que les fiches fabricant seront sourcées. Les finitions sont reprises dans le devis et la photo réaliste IA.</p>
 </aside>;
}
