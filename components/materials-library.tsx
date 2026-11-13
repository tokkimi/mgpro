'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AppWindow,Armchair,Bath,Blinds,Box,Car,ChevronDown,ChevronRight,DoorOpen,Download,Fence,House,Lightbulb,Loader2,Plug,Refrigerator,Search,ShowerHead,Sparkles,Sun,Toilet,TreePine,Upload,Waves,Droplets,Footprints,X} from 'lucide-react';
import {groupsOf,iconOf,isPriced,isSurface,label,loadMaterials,matches,pricesFromCsv,pricesToCsv,swatchStyle,unitPrice,type Group,type IconKey,type MaterialPrice,type MaterialPrices,type MaterialRow} from '@/lib/material-library';
import {money} from '@/lib/model';
import './materials-library.css';

const ICONS:Record<IconKey,typeof Box>={bath:Bath,shower:ShowerHead,toilet:Toilet,sink:Droplets,tap:Droplets,light:Lightbulb,door:DoorOpen,window:AppWindow,blinds:Blinds,fence:Fence,pool:Waves,appliance:Refrigerator,cabinet:Armchair,stairs:Footprints,car:Car,home:House,sun:Sun,plug:Plug,tree:TreePine,box:Box};
const UNIVERSES=[{key:'interieur',title:'Intérieur'},{key:'exterieur',title:'Extérieurs, piscines & extensions'}] as const;
const fmt=(n:number)=>n.toLocaleString('fr-CA');

function Tile({row,price,onOpen}:{row:MaterialRow;price?:MaterialPrice;onOpen:()=>void}){
 const surface=isSurface(row);const Icon=ICONS[iconOf(row)];
 return <button type="button" className={`mat-tile${isPriced(price)?' priced':''}`} onClick={onOpen} title={`${row[0]} — ${label(row)}`}>
  <span className={`mat-swatch${surface?'':' object'}`} style={surface?swatchStyle(row):undefined}>{!surface&&<Icon size={30} strokeWidth={1.4}/>}</span>
  <span className="mat-name">{row[3]}</span>
  {row[4]&&<span className="mat-variant">{row[4]}</span>}
  <span className={`mat-price${isPriced(price)?'':' todo'}`}>{isPriced(price)?`${money(unitPrice(price))} / ${row[6]}`:'À sourcer'}</span>
 </button>;
}

/** Admin library of every catalogue reference, with MG Pro's own prices (used by the AI quote). */
export default function MaterialsLibrary({value,onSave,readOnly=false}:{value:MaterialPrices;onSave:(prices:MaterialPrices)=>Promise<void>;readOnly?:boolean}){
 const [rows,setRows]=useState<MaterialRow[]>([]);
 const [group,setGroup]=useState<string>('');const [sub,setSub]=useState<string>('');
 const [query,setQuery]=useState('');const [onlyPriced,setOnlyPriced]=useState<'all'|'priced'|'todo'>('all');
 const [open,setOpen]=useState<MaterialRow|null>(null);const [status,setStatus]=useState('');
 const top=useRef<HTMLDivElement>(null);const main=useRef<HTMLDivElement>(null);const file=useRef<HTMLInputElement>(null);
 useEffect(()=>{void loadMaterials().then(setRows)},[]);
 const groups=useMemo(()=>groupsOf(rows),[rows]);
 const pricedCount=useMemo(()=>rows.filter(r=>isPriced(value[r[0]])).length,[rows,value]);
 const keep=(r:MaterialRow)=>onlyPriced==='all'||(onlyPriced==='priced')===isPriced(value[r[0]]);
 const visible=useMemo(()=>rows.filter(r=>(!group||r[1]===group)&&(!sub||r[2]===sub)&&matches(r,query)&&keep(r)),[rows,group,sub,query,onlyPriced,value]);
 function choose(g:string,s=''){setGroup(g);setSub(s);setQuery('');requestAnimationFrame(()=>((g&&window.innerWidth<900?main:top).current)?.scrollIntoView({block:'start',behavior:'smooth'}))}
 async function persist(next:MaterialPrices,msg:string){setStatus('Enregistrement…');try{await onSave(next);setStatus(msg)}catch(e){setStatus((e as Error).message||'Enregistrement impossible.')}}
 function exportCsv(){const list=group?rows.filter(r=>r[1]===group):rows;const blob=new Blob([pricesToCsv(list,value)],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mgpro-prix-materiaux${group?'-'+group.toLowerCase().replace(/[^a-z0-9]+/gi,'-'):''}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
 async function importCsv(f:File){try{const {prices,updated}=pricesFromCsv(await f.text(),value);await persist(prices,`${fmt(updated)} référence(s) mises à jour depuis le fichier.`)}catch(e){setStatus((e as Error).message)}}
 const current=groups.find(g=>g.name===group);
 const sections=useMemo(()=>{const m=new Map<string,MaterialRow[]>();for(const r of visible){const k=group?r[2]:`${r[1]} — ${r[2]}`;(m.get(k)||m.set(k,[]).get(k)!).push(r)}return [...m.entries()]},[visible,group]);
 const searching=!!query||onlyPriced!=='all';

 return <div className="mat-lib" ref={top}>
  <header className="mat-head">
   <div><p className="mat-eyebrow">MG Pro · Catalogue complet</p><h2>Bibliothèque des <em>matériaux</em></h2><p className="mat-sub">Toutes les références intérieures et extérieures. Renseignez vos prix : ils sont repris automatiquement par l’outil de visite, les finitions du plan 3D et le devis IA.</p></div>
   <div className="mat-stats"><span><b>{fmt(rows.length)}</b> références</span><span><b>{fmt(pricedCount)}</b> prix renseignés</span><span><b>{fmt(rows.length-pricedCount)}</b> à sourcer</span></div>
  </header>
  <div className="mat-toolbar">
   <label className="mat-search"><Search size={16}/><input placeholder="Rechercher : chêne, liner, zinc, MGP-00120…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="Effacer" onClick={()=>setQuery('')}><X size={14}/></button>}</label>
   <div className="mat-filter" role="group" aria-label="Filtre prix">{([['all','Tout'],['priced','Avec prix'],['todo','À sourcer']] as const).map(([k,t])=><button type="button" key={k} aria-pressed={onlyPriced===k} onClick={()=>setOnlyPriced(k)}>{t}</button>)}</div>
   <button type="button" className="mat-ghost" onClick={exportCsv} disabled={!rows.length}><Download size={15}/>Exporter les prix (Excel)</button>
   {!readOnly&&<><button type="button" className="mat-ghost" onClick={()=>file.current?.click()}><Upload size={15}/>Importer des prix</button><input ref={file} type="file" accept=".csv,text/csv" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void importCsv(f)}}/></>}
  </div>
  {status&&<p className="mat-status" role="status">{status}</p>}
  {!rows.length?<p className="mat-loading"><Loader2 size={18} className="spin"/>Chargement du catalogue…</p>:
  <div className="mat-body">
   <nav className="mat-nav" aria-label="Catégories de matériaux">
    <button type="button" className={`mat-nav-home${!group?' active':''}`} onClick={()=>choose('')}><Sparkles size={15}/>Accueil catalogue<span>{fmt(rows.length)}</span></button>
    {UNIVERSES.map(u=><div key={u.key} className="mat-nav-block"><p>{u.title}</p>
     {groups.filter(g=>g.universe===u.key).map(g=><div key={g.name} className={`mat-nav-group${group===g.name?' open':''}`}>
      <button type="button" className={group===g.name&&!sub?'active':''} aria-expanded={group===g.name} onClick={()=>group===g.name&&!sub?choose(''):choose(g.name)}>{group===g.name?<ChevronDown size={14}/>:<ChevronRight size={14}/>}{g.name}<span>{g.count}</span></button>
      {group===g.name&&<div className="mat-nav-subs">{g.subs.map(s=><button type="button" key={s.name} className={sub===s.name?'active':''} onClick={()=>choose(g.name,sub===s.name?'':s.name)}>{s.name}<span>{s.count}</span></button>)}</div>}
     </div>)}
    </div>)}
   </nav>
   <div className="mat-main" ref={main}>
    {!group&&!searching?<Home groups={groups} rows={rows} prices={value} onGroup={choose} onOpen={setOpen}/>:<>
     {current&&<div className="mat-banner" style={{backgroundImage:`linear-gradient(90deg,rgba(10,10,11,.92),rgba(10,10,11,.35)),url(${current.photo})`}}><p className="mat-eyebrow">{current.universe==='interieur'?'Intérieur':'Extérieurs & extensions'}</p><h3>{current.name}{sub&&<> · <em>{sub}</em></>}</h3><p>{fmt(visible.length)} référence(s) · {fmt(visible.filter(r=>isPriced(value[r[0]])).length)} avec prix</p></div>}
     {searching&&!current&&<p className="mat-count">{fmt(visible.length)} résultat(s){visible.length>400?' — affinez la recherche (400 premiers affichés)':''}</p>}
     {sections.length===0&&<p className="mat-empty">Aucune référence ne correspond.</p>}
     {(()=>{let budget=400;return sections.map(([name,list])=>{if(budget<=0)return null;const shown=list.slice(0,budget);budget-=shown.length;return <section className="mat-section" key={name}>
      <div className="mat-section-head"><h4>{name}</h4><span>{list.length} réf. · {list.filter(r=>isPriced(value[r[0]])).length} avec prix</span></div>
      <div className="mat-grid">{shown.map(r=><Tile key={r[0]} row={r} price={value[r[0]]} onOpen={()=>setOpen(r)}/>)}</div>
     </section>})})()}
    </>}
   </div>
  </div>}
  {open&&<PriceDrawer row={open} rows={rows} prices={value} readOnly={readOnly} onClose={()=>setOpen(null)} onSave={async(next,msg)=>{await persist(next,msg);setOpen(null)}}/>}
 </div>;
}

function Home({groups,rows,prices,onGroup,onOpen}:{groups:Group[];rows:MaterialRow[];prices:MaterialPrices;onGroup:(g:string,s?:string)=>void;onOpen:(r:MaterialRow)=>void}){
 return <>{UNIVERSES.map(u=><section key={u.key} className="mat-universe">
  <h3>{u.title}</h3>
  <div className="mat-cards">{groups.filter(g=>g.universe===u.key).map(g=><button type="button" key={g.name} className="mat-card" style={{backgroundImage:`linear-gradient(0deg,rgba(8,8,9,.88),rgba(8,8,9,.05) 62%),url(${g.photo})`}} onClick={()=>onGroup(g.name)}><b>{g.name}</b><span>{g.count} références · {g.subs.length} sous-catégories</span></button>)}</div>
  <div className="mat-previews">{groups.filter(g=>g.universe===u.key).map(g=>{const seen=new Set<string>();const sample=rows.filter(r=>r[1]===g.name&&!seen.has(r[2]+r[3])&&seen.add(r[2]+r[3])).filter((r,i,a)=>a.findIndex(x=>x[2]===r[2])===i||i%7===0).slice(0,6);
   return <div className="mat-preview" key={g.name}><div className="mat-section-head"><h4>{g.name}</h4><button type="button" onClick={()=>onGroup(g.name)}>Voir tout <ChevronRight size={13}/></button></div><div className="mat-grid compact">{sample.map(r=><Tile key={r[0]} row={r} price={prices[r[0]]} onOpen={()=>onOpen(r)}/>)}</div></div>})}</div>
 </section>)}</>;
}

function PriceDrawer({row,rows,prices,readOnly,onClose,onSave}:{row:MaterialRow;rows:MaterialRow[];prices:MaterialPrices;readOnly:boolean;onClose:()=>void;onSave:(next:MaterialPrices,msg:string)=>Promise<void>}){
 const p=prices[row[0]]||{};
 const [f,setF]=useState({buy:p.buy?String(p.buy):'',sell:p.sell?String(p.sell):'',labour:p.labour?String(p.labour):'',waste:p.waste?String(p.waste):'',supplier:p.supplier||'',ref:p.ref||''});
 const [scope,setScope]=useState<'one'|'variants'|'sub'>('one');const [busy,setBusy]=useState(false);
 const n=(s:string)=>{const v=Number(s.replace(',','.').replace(/\s/g,''));return Number.isFinite(v)&&v>0?Math.round(v*100)/100:undefined};
 const buy=n(f.buy),sell=n(f.sell),labour=n(f.labour);const margin=buy&&sell?Math.round((sell-buy)/sell*1000)/10:null;
 const variants=rows.filter(r=>r[1]===row[1]&&r[2]===row[2]&&r[3]===row[3]);const subRows=rows.filter(r=>r[1]===row[1]&&r[2]===row[2]);
 const surface=isSurface(row);const Icon=ICONS[iconOf(row)];
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[onClose]);
 async function submit(clear=false){setBusy(true);const now=new Date().toISOString();const target=scope==='one'?[row]:scope==='variants'?variants:subRows;const next={...prices};
  for(const r of target){if(clear){delete next[r[0]];continue}const v:MaterialPrice={buy,sell,labour,waste:n(f.waste),supplier:f.supplier.trim()||undefined,ref:scope==='one'?f.ref.trim()||undefined:prices[r[0]]?.ref,updated:now};for(const k of Object.keys(v) as (keyof MaterialPrice)[])if(v[k]===undefined)delete v[k];if(Object.keys(v).some(k=>k!=='updated'))next[r[0]]=v;else delete next[r[0]]}
  try{await onSave(next,clear?`Prix retiré${target.length>1?` sur ${target.length} références`:''}.`:`Prix enregistré${target.length>1?` sur ${target.length} références`:''} — utilisé par les devis.`)}finally{setBusy(false)}}
 return <div className="mat-drawer-wrap" role="dialog" aria-modal="true" aria-label={label(row)} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <aside className="mat-drawer">
   <button type="button" className="mat-close" aria-label="Fermer" onClick={onClose}><X size={18}/></button>
   <span className={`mat-swatch big${surface?'':' object'}`} style={surface?swatchStyle(row):undefined}>{!surface&&<Icon size={54} strokeWidth={1.2}/>}</span>
   <p className="mat-eyebrow">{row[1]} · {row[2]}</p>
   <h3>{row[3]}{row[4]&&<em> · {row[4]}</em>}</h3>
   <dl className="mat-meta"><div><dt>Référence</dt><dd>{row[0]}</dd></div><div><dt>Unité de devis</dt><dd>{row[6]}</dd></div><div><dt>Statut</dt><dd>{isPriced(p)?'Prix renseigné':'À sourcer'}</dd></div><div><dt>Variantes</dt><dd>{variants.length}</dd></div></dl>
   <p className="mat-note">Aperçu indicatif : référence générique à sourcer chez votre fournisseur (texture et modèle 3D réels à associer).</p>
   <fieldset className="mat-form" disabled={readOnly||busy}>
    <legend>Vos prix (avant taxes, par {row[6]})</legend>
    <label>Prix d’achat<input inputMode="decimal" value={f.buy} onChange={e=>setF({...f,buy:e.target.value})} placeholder="0,00"/></label>
    <label>Prix de vente<input inputMode="decimal" value={f.sell} onChange={e=>setF({...f,sell:e.target.value})} placeholder="0,00"/></label>
    <label>Pose / main-d’œuvre<input inputMode="decimal" value={f.labour} onChange={e=>setF({...f,labour:e.target.value})} placeholder="0,00"/></label>
    <label>Pertes / chutes %<input inputMode="decimal" value={f.waste} onChange={e=>setF({...f,waste:e.target.value})} placeholder="10"/></label>
    <label className="wide">Fournisseur<input value={f.supplier} onChange={e=>setF({...f,supplier:e.target.value})} placeholder="Ex. Rona, Canac, Ceragres…"/></label>
    {scope==='one'&&<label className="wide">Réf. fournisseur<input value={f.ref} onChange={e=>setF({...f,ref:e.target.value})}/></label>}
    <p className="mat-total wide">Prix utilisé au devis : <b>{money(unitPrice({buy,sell,labour}))} / {row[6]}</b>{margin!==null&&<> · marge {margin} %</>}</p>
    <div className="mat-scope wide" role="radiogroup" aria-label="Appliquer à">
     <label><input type="radio" checked={scope==='one'} onChange={()=>setScope('one')}/>Cette référence</label>
     {variants.length>1&&<label><input type="radio" checked={scope==='variants'} onChange={()=>setScope('variants')}/>Toutes les variantes « {row[3]} » ({variants.length})</label>}
     <label><input type="radio" checked={scope==='sub'} onChange={()=>setScope('sub')}/>Toute la sous-catégorie {row[2]} ({subRows.length})</label>
    </div>
    <div className="mat-actions wide">
     <button type="button" className="mat-gold" onClick={()=>void submit()}>{busy?<Loader2 size={16} className="spin"/>:null}Enregistrer le prix</button>
     {isPriced(p)&&<button type="button" className="mat-ghost" onClick={()=>void submit(true)}>Retirer le prix</button>}
    </div>
   </fieldset>
  </aside>
 </div>;
}
