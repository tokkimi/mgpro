'use client';

import {useMemo,useRef,useState} from 'react';
import {Camera,Loader2,Ruler,Sparkles,Video,Check,X,Images,ShieldCheck,AlertTriangle,CircleCheck,Calculator,MapPin,RotateCcw} from 'lucide-react';
import type {Plan} from '@/lib/plan';
import {autoPlan,checkPlan,SIDE_LABEL,type Check as PlanCheckItem,type MeasureResult,type QuoteDraft,type Review} from '@/lib/visit-ai';
import './visit-ai-tools.css';

type Data=Record<string,any>;
type Measure=MeasureResult;

const MAX_SIDE=1280,QUALITY=.78,MAX_PHOTOS=8,VIDEO_FRAMES=8;

function toJpeg(source:CanvasImageSource,w:number,h:number){
 const scale=Math.min(1,MAX_SIDE/Math.max(w,h));const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Traitement d’image indisponible sur cet appareil.');
 ctx.drawImage(source,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',QUALITY);
}

async function photoToJpeg(file:File){
 if('createImageBitmap' in window){
  try{const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'} as any);const out=toJpeg(bitmap,bitmap.width,bitmap.height);bitmap.close?.();return out}catch{/* fall back to <img> */}
 }
 const url=URL.createObjectURL(file);
 try{const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Photo illisible : ${file.name}. Utilisez le format JPEG ou PNG.`));i.src=url});return toJpeg(img,img.naturalWidth,img.naturalHeight)}
 finally{URL.revokeObjectURL(url)}
}

/** Extracts evenly spaced frames from a walkthrough video, entirely in the browser.
 * Works on iPhone Safari: the element is attached to the page, muted and inline, and briefly
 * played so that iOS starts decoding (otherwise iOS never fires the loading events). */
async function videoFrames(file:File,count=VIDEO_FRAMES){
 const url=URL.createObjectURL(file);const video=document.createElement('video');
 video.muted=true;video.defaultMuted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('muted','');
 video.preload='auto';
 Object.assign(video.style,{position:'fixed',left:'0',top:'0',width:'2px',height:'2px',opacity:'0',pointerEvents:'none',zIndex:'-1'});
 document.body.appendChild(video);
 const once=(event:string,ms:number,message:string)=>new Promise<void>((resolve,reject)=>{
  const done=()=>{clearTimeout(t);video.removeEventListener(event,done);video.removeEventListener('error',fail);resolve()};
  const fail=()=>{clearTimeout(t);video.removeEventListener(event,done);video.removeEventListener('error',fail);reject(new Error('Format vidéo non lisible sur cet appareil. Utilisez des photos à la place.'))};
  const t=setTimeout(()=>{video.removeEventListener(event,done);video.removeEventListener('error',fail);reject(new Error(message))},ms);
  video.addEventListener(event,done);video.addEventListener('error',fail);
 });
 const painted=()=>new Promise<void>(resolve=>{const v=video as any;if(typeof v.requestVideoFrameCallback==='function'){let settled=false;const t=setTimeout(()=>{if(!settled){settled=true;resolve()}},400);v.requestVideoFrameCallback(()=>{if(!settled){settled=true;clearTimeout(t);resolve()}})}else setTimeout(resolve,150)});
 try{
  const meta=once('loadedmetadata',15000,'La vidéo ne se lit pas sur cet appareil. Réessayez, ou utilisez des photos.');
  video.src=url;video.load();
  await meta;
  // iOS: start decoding with a short muted play, then pause.
  try{await video.play()}catch{/* autoplay refused: seeking below still works on most browsers */}
  video.pause();
  if(video.readyState<2)await once('loadeddata',10000,'La vidéo ne se lit pas sur cet appareil. Réessayez, ou utilisez des photos.').catch(()=>{});
  let duration=video.duration;
  if(!Number.isFinite(duration)||duration<=0){video.currentTime=1e7;await once('seeked',5000,'Durée de la vidéo illisible.').catch(()=>{});duration=Number.isFinite(video.duration)?video.duration:0}
  if(!duration||!video.videoWidth)throw new Error('Vidéo illisible. Utilisez des photos à la place.');
  const frames:string[]=[];
  for(let k=0;k<count;k++){
   const time=Math.min(Math.max(0,duration-.05),duration*(k+.5)/count);
   const seeked=once('seeked',8000,'Lecture de la vidéo interrompue.');
   video.currentTime=time;
   await seeked;await painted();
   frames.push(toJpeg(video,video.videoWidth,video.videoHeight));
  }
  return frames;
 }finally{video.pause();video.removeAttribute('src');video.load();video.remove();URL.revokeObjectURL(url)}
}

async function postJson(body:Data){
 const res=await fetch('/api/visit-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const out=await res.json().catch(()=>({error:res.status===413?'Images trop lourdes : envoyez moins de photos.':'Réponse invalide du serveur.'}));
 if(!res.ok)throw new Error(out.error||`Erreur ${res.status}`);return out;
}

const fromM=(m:number,unit:string)=>unit==='m'?Math.round(m*100)/100:Math.round(m/.3048*10)/10;
const money=(n:number)=>n.toLocaleString('fr-CA',{style:'currency',currency:'CAD'});
const CORNERS=['Coin 1','Coin 2','Coin 3','Coin 4','Vue d’ensemble'];
const REFERENCES=['Porte standard 32 po visible','Plafond 8 pi','Plafond 9 pi','Comptoir 36 po de haut'];
export const newRoomId=()=>Math.random().toString(36).slice(2,10);

/** Per-room measurement: one photo per corner (most precise), a walkthrough video, or free photos. */
export function RoomMeasure({room,onApply,disabled=false,demo=false}:{room:Data;onApply:(patch:Data)=>void;disabled?:boolean;demo?:boolean}){
 const [mode,setMode]=useState<'corners'|'video'|'photos'>('corners');
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[result,setResult]=useState<Measure|null>(null),[reference,setReference]=useState(''),[previews,setPreviews]=useState<string[]>([]);
 const [corners,setCorners]=useState<(string|null)[]>([null,null,null,null,null]);
 const photoInput=useRef<HTMLInputElement>(null),videoInput=useRef<HTMLInputElement>(null),cornerInput=useRef<HTMLInputElement>(null),cornerSlot=useRef(0);
 const unit=room.unit==='m'?'m':'pi';
 const cornerCount=corners.slice(0,4).filter(Boolean).length;

 async function send(images:string[],labels:string[]|undefined,source:'photo'|'video'){
  setBusy('L’IA relève la pièce coin par coin… (30 à 60 s)');
  try{const out=await postJson({action:'measure',source,images,labels,room:room.name||undefined,reference:reference.trim()||undefined});setResult(out.measure)}
  catch(e){setError((e as Error).message)}finally{setBusy('')}
 }
 async function run(files:File[],source:'photo'|'video'){
  setError('');setResult(null);
  if(demo){setError('Démonstration : la mesure IA est disponible dans l’espace réel.');return}
  try{
   setBusy(source==='video'?'Extraction des images de la vidéo…':'Préparation des photos…');
   let images:string[];
   if(source==='video'){if(files[0].size>500*1024*1024)throw new Error('Vidéo trop lourde (500 Mo max).');images=await videoFrames(files[0])}
   else{if(files.length>MAX_PHOTOS)setError(`Seules les ${MAX_PHOTOS} premières photos sont utilisées.`);images=[];for(const f of files.slice(0,MAX_PHOTOS))images.push(await photoToJpeg(f))}
   setPreviews(images);setBusy('');
   await send(images,source==='video'?images.map((_,i)=>`Image ${i+1} de la vidéo (ordre du tour)`):undefined,source);
  }catch(e){setError((e as Error).message);setBusy('')}
 }
 async function addCorner(file:File){
  setError('');try{const img=await photoToJpeg(file);setCorners(c=>c.map((x,i)=>i===cornerSlot.current?img:x))}catch(e){setError((e as Error).message)}
 }
 function measureCorners(){
  setError('');setResult(null);
  if(demo){setError('Démonstration : la mesure IA est disponible dans l’espace réel.');return}
  const picked=corners.map((img,i)=>img?{img,label:i<4?`${CORNERS[i]} (photo prise depuis le coin ${i+1}, sens horaire, en visant la pièce)`:'Vue d’ensemble de la pièce'}:null).filter(Boolean) as {img:string;label:string}[];
  setPreviews(picked.map(p=>p.img));void send(picked.map(p=>p.img),picked.map(p=>p.label),'photo');
 }
 function apply(){
  if(!result)return;
  const walls=result.walls.length?`Murs : ${result.walls.map(w=>`${w.name} ${fromM(w.length,unit)} ${unit}`).join(', ')}.`:'';
  const extra=[result.observations,result.features.length?`Éléments : ${result.features.join(', ')}.`:'',walls].filter(Boolean).join(' ');
  onApply({length:fromM(result.length,unit),width:fromM(result.width,unit),height:fromM(result.height,unit),...(!room.name&&result.name?{name:result.name}:{}),notes:[room.notes,extra&&!String(room.notes||'').includes(result.observations)?`[Relevé IA] ${extra}`:''].filter(Boolean).join('\n'),features:{doors:result.doors,windows:result.windows,list:result.features,walls:result.walls,shape:result.shape},measured_by:'ia',measure_margin:result.margin});
  setResult(null);setPreviews([]);setCorners([null,null,null,null,null]);
 }

 return <div className="room-ai-measure">
  <p className="room-ai-head"><Ruler size={15}/><b>Mesurer avec l’IA</b></p>
  <div className="room-ai-modes" role="tablist">
   <button type="button" role="tab" aria-selected={mode==='corners'} className={mode==='corners'?'active':''} onClick={()=>setMode('corners')}><Camera size={14}/>4 coins <small>le plus précis</small></button>
   <button type="button" role="tab" aria-selected={mode==='video'} className={mode==='video'?'active':''} onClick={()=>setMode('video')}><Video size={14}/>Vidéo</button>
   <button type="button" role="tab" aria-selected={mode==='photos'} className={mode==='photos'?'active':''} onClick={()=>setMode('photos')}><Images size={14}/>Photos libres</button>
  </div>
  <label className="room-ai-reference">Une mesure au ruban (fortement conseillé : précision ± 3 à 5 %)<input value={reference} disabled={!!busy||disabled} onChange={e=>setReference(e.target.value)} placeholder="ex. mur de la fenêtre 10 pi 6 po"/></label>
  <div className="room-ai-chips">{REFERENCES.map(r=><button type="button" key={r} disabled={!!busy||disabled} onClick={()=>setReference(x=>x?`${x} ; ${r}`:r)}>{r}</button>)}</div>
  {mode==='corners'&&<>
   <p className="muted">Placez-vous dans chaque coin, dans le sens des aiguilles d’une montre, et photographiez la pièce en entier (sol et plafond visibles).</p>
   <div className="room-ai-corners">{CORNERS.map((label,i)=><button type="button" key={label} className={corners[i]?'filled':''} disabled={!!busy||disabled} onClick={()=>{cornerSlot.current=i;cornerInput.current?.click()}}>{corners[i]?<img src={corners[i]!} alt={label}/>:<Camera size={18}/>}<span>{label}{i===4?' (facultatif)':''}</span></button>)}</div>
   <input ref={cornerInput} hidden type="file" accept="image/*" capture="environment" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void addCorner(f)}}/>
   <div className="button-row"><button type="button" className="btn primary" disabled={!!busy||disabled||cornerCount<3} onClick={measureCorners}><Ruler size={16}/>Mesurer la pièce ({cornerCount}/4 coins)</button>{corners.some(Boolean)&&<button type="button" className="btn ghost" disabled={!!busy} onClick={()=>setCorners([null,null,null,null,null])}><RotateCcw size={15}/>Recommencer</button>}</div>
  </>}
  {mode==='video'&&<><p className="muted">Filmez lentement le tour complet de la pièce depuis l’entrée, en montrant chaque coin (10 à 30 s).</p><div className="button-row"><button type="button" className="btn secondary" disabled={!!busy||disabled} onClick={()=>videoInput.current?.click()}><Video size={16}/>Choisir ou filmer une vidéo</button></div></>}
  {mode==='photos'&&<div className="button-row"><button type="button" className="btn secondary" disabled={!!busy||disabled} onClick={()=>photoInput.current?.click()}><Images size={16}/>Choisir des photos</button></div>}
  <input ref={photoInput} hidden type="file" accept="image/*" multiple onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)void run(files,'photo')}}/>
  <input ref={videoInput} hidden type="file" accept="video/*" onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)void run(files,'video')}}/>
  {busy&&<p className="room-ai-status" role="status"><Loader2 size={15} className="spin"/>{busy}</p>}
  {previews.length>0&&mode!=='corners'&&<div className="room-ai-previews">{previews.map((src,i)=><img key={i} src={src} alt={`Image ${i+1} analysée`}/>)}</div>}
  {error&&<p className="error" role="alert">{error}</p>}
  {result&&<div className="room-ai-result">
   <p className="room-ai-dims"><b>{fromM(result.length,unit)} × {fromM(result.width,unit)} {unit}</b> · hauteur {fromM(result.height,unit)} {unit} · {Math.round(fromM(result.length,unit)*fromM(result.width,unit)*10)/10} {unit}²</p>
   {result.walls.length>0&&<p className="room-ai-walls">{result.walls.map(w=><span key={w.name}>{w.name} : <b>{fromM(w.length,unit)} {unit}</b></span>)}</p>}
   <p className="muted">Fiabilité {result.confidence} · marge ± {result.margin} %{result.walls.length>=4?` · écart entre murs opposés ${result.discrepancy} %`:''} · forme {result.shape} · {result.doors} porte(s), {result.windows} fenêtre(s){result.name?` · ${result.name}`:''}</p>
   {result.discrepancy>8&&<p className="notice">Les murs opposés diffèrent de {result.discrepancy} % : confirmez au ruban la longueur d’un mur, puis relancez la mesure.</p>}
   {result.references.length>0&&<p className="muted">Étalons utilisés : {result.references.join(', ')}</p>}
   {result.observations&&<p>{result.observations}</p>}
   {result.advice&&<p className="muted">À confirmer au ruban : {result.advice}</p>}
   <div className="button-row"><button type="button" className="btn primary" onClick={apply}><Check size={16}/>Appliquer à la pièce</button><button type="button" className="btn ghost" onClick={()=>{setResult(null);setPreviews([])}}><X size={16}/>Ignorer</button></div>
  </div>}
 </div>;
}

/** Where a room sits relative to another one: gives the real floor plan. */
export function RoomPlacement({rooms,index,onRooms}:{rooms:Data[];index:number;onRooms:(rooms:Data[])=>void}){
 const room=rooms[index];const p=room.position||null;const unit=room.unit==='m'?'m':'pi';
 const withIds=()=>rooms.map(r=>r.id?r:{...r,id:newRoomId()});
 function update(patch:Data|null){const next=withIds();const ref=patch?.ref??p?.ref??next[index-1]?.id??next[0].id;next[index]={...next[index],position:patch===null?null:{side:'right',align:'start',offset:0,door:true,...(p||{}),...patch,ref}};onRooms(next)}
 const others=rooms.map((r,i)=>({r,i})).filter(x=>x.i!==index);
 return <div className="room-placement">
  <p className="room-ai-head"><MapPin size={15}/><b>Où se trouve cette pièce ?</b></p>
  {!p?<><p className="muted">Indiquez sa position par rapport à une autre pièce : le plan 2D et la 3D la placeront exactement à cet endroit.</p><button type="button" className="btn secondary" onClick={()=>update({})}><MapPin size={15}/>Indiquer la position</button></>:
  <div className="form-grid">
   <label>Elle est<select value={p.side} onChange={e=>update({side:e.target.value})}>{Object.entries(SIDE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   <label>la pièce<select value={p.ref} onChange={e=>update({ref:e.target.value})}>{others.map(({r,i})=><option key={r.id||i} value={r.id||''} disabled={!r.id}>{r.name||`Pièce ${i+1}`}</option>)}</select></label>
   <label>Alignement<select value={p.align||'start'} onChange={e=>update({align:e.target.value})}>{(p.side==='right'||p.side==='left'?[['start','Murs du haut (nord) alignés'],['center','Centrée'],['end','Murs du bas (sud) alignés']]:[['start','Murs de gauche (ouest) alignés'],['center','Centrée'],['end','Murs de droite (est) alignés']]).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   <label>Décalage ({unit})<input type="number" step="0.1" value={p.offset??0} onChange={e=>update({offset:Number(e.target.value)||0})}/></label>
   <label className="check-label"><input type="checkbox" checked={p.door!==false} onChange={e=>update({door:e.target.checked})}/>Porte ou passage entre les deux pièces</label>
   <button type="button" className="text-button" onClick={()=>update(null)}>Retirer la position</button>
  </div>}
 </div>;
}

/** Live sketch of the floor plan while rooms are measured and positioned. */
export function LayoutPreview({rooms}:{rooms:Data[]}){
 const plan=useMemo(()=>{try{return autoPlan(rooms as any)}catch{return null}},[rooms]);
 if(!plan||!rooms.some(r=>Number(r.length)>0))return null;
 const maxX=Math.max(...plan.rooms.map(r=>r.x+r.length)),maxY=Math.max(...plan.rooms.map(r=>r.y+r.width));const pad=.6;
 const unit=rooms[0]?.unit==='m'?'m':'pi';const f=(m:number)=>unit==='m'?`${Math.round(m*100)/100} m`:`${Math.round(m/.3048*10)/10} pi`;
 return <figure className="layout-preview">
  <figcaption><b>Aperçu de la disposition</b> · nord en haut</figcaption>
  <svg viewBox={`${-pad} ${-pad} ${maxX+pad*2} ${maxY+pad*2}`} role="img" aria-label="Disposition des pièces">
   {plan.rooms.map(r=><g key={r.id}><rect x={r.x} y={r.y} width={r.length} height={r.width} className="lp-room"/><text x={r.x+r.length/2} y={r.y+r.width/2} className="lp-name">{r.name}</text><text x={r.x+r.length/2} y={r.y+r.width/2+.42} className="lp-dim">{f(r.length)} × {f(r.width)}</text></g>)}
   {plan.elements.filter(e=>e.kind==='door').map(e=><rect key={e.id} x={e.x} y={e.y} width={e.length} height={e.width} className="lp-door"/>)}
  </svg>
 </figure>;
}

/** Builds the payload shared by plan, review and quote requests. */
export function planRequestFromVisit(d:Data){
 const notes=[...(d.voice_notes||[]).map((v:Data)=>v.transcript),d.notes,d.notebook?.text].filter(Boolean).join('\n');
 return {action:'plan',rooms:(d.rooms||[]).map((r:Data,i:number)=>({id:r.id||`piece-${i+1}`,name:r.name,length:Number(r.length)||0,width:Number(r.width)||0,height:Number(r.height)||0,unit:r.unit==='m'?'m':'pi',notes:r.notes||'',features:r.features,position:r.position||null})),scope:d.scope||undefined,constraints:d.constraints||undefined,materials:d.materials||undefined,notes:notes||undefined};
}

/** One button: Claude draws the 2D plan (and therefore the 3D model) from the visit. */
export function PlanGenerator({request,onPlan,disabled=false,demo=false,label='Générer le plan 2D / 3D avec l’IA',hasPlan=false}:{request:Data;onPlan:(plan:Plan,note:string)=>void;disabled?:boolean;demo?:boolean;label?:string;hasPlan?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function generate(){
  setMessage('');
  if(hasPlan&&!window.confirm('Remplacer le plan actuel par un nouveau plan généré par l’IA ?'))return;
  setBusy(true);
  try{
   if(demo){onPlan(autoPlan(request.rooms||[]),'Démonstration : plan disposé selon les positions indiquées.');return}
   const out=await postJson(request);
   const note=out.source==='model'?'Plan dessiné par l’IA : pièces placées selon vos positions, cotes du relevé. Vérifiez le contrôle ci-dessous, puis validez le plan.':out.note||'Plan disposé automatiquement.';
   onPlan(out.plan,note);setMessage(note);
  }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 return <div className="plan-ai-generator">
  <button type="button" className="btn primary" disabled={busy||disabled} onClick={()=>void generate()}>{busy?<Loader2 size={16} className="spin"/>:<Sparkles size={16}/>}{busy?'L’IA dessine le plan… (30 à 90 s)':label}</button>
  {message&&<p className="muted" role="status">{message}</p>}
 </div>;
}

/** Plan control: instant geometric checks, then a review by the AI before validation. */
export function PlanCheck({request,plan,demo=false,onRelayout}:{request:Data;plan:Plan|null|undefined;demo?:boolean;onRelayout:(plan:Plan)=>void}){
 const [busy,setBusy]=useState(false),[review,setReview]=useState<Review|null>(null),[note,setNote]=useState(''),[reviewedRevision,setReviewedRevision]=useState<string>('');
 const checks:PlanCheckItem[]=useMemo(()=>plan?checkPlan(plan,request.rooms||[]):[],[plan,request.rooms]);
 if(!plan)return null;
 const errors=checks.filter(c=>c.level==='error').length,warns=checks.filter(c=>c.level==='warn').length;
 const key=JSON.stringify([plan.rooms.map(r=>[r.x,r.y,r.length,r.width]),plan.elements.length]);
 async function ask(){setBusy(true);setNote('');try{if(demo){setNote('Démonstration : la vérification IA est disponible dans l’espace réel.');return}const out=await postJson({...request,action:'review',plan});setReview(out.review);setReviewedRevision(key);if(out.note)setNote(out.note)}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 return <section className={`plan-check ${errors?'has-errors':warns?'has-warns':'is-ok'}`}>
  <header><ShieldCheck size={17}/><b>Contrôle du plan</b><span>{errors?`${errors} erreur(s) à corriger`:warns?`${warns} point(s) à vérifier`:'Conforme au relevé'}</span></header>
  <ul>{checks.map((c,i)=><li key={i} className={c.level}>{c.level==='ok'?<CircleCheck size={14}/>:<AlertTriangle size={14}/>}{c.text}</li>)}</ul>
  {errors>0&&<button type="button" className="btn secondary" onClick={()=>onRelayout(autoPlan(request.rooms||[],plan.style))}><RotateCcw size={15}/>Replacer les pièces selon le relevé</button>}
  <button type="button" className="btn secondary" disabled={busy} onClick={()=>void ask()}>{busy?<Loader2 size={15} className="spin"/>:<Sparkles size={15}/>}{busy?'L’IA vérifie le plan…':'Faire vérifier le plan par l’IA'}</button>
  {review&&<div className={`plan-review ${review.verdict==='conforme'?'ok':'warn'}`}>
   <p><b>Avis de l’IA : {review.verdict}</b>{reviewedRevision!==key&&' (le plan a changé depuis, relancez la vérification)'}</p>
   {review.summary&&<p className="muted">{review.summary}</p>}
   {review.issues.length>0&&<ul>{review.issues.map((i,k)=><li key={k} className={i.severity==='bloquant'?'error':'warn'}><b>{i.severity}</b> · {i.text}</li>)}</ul>}
  </div>}
  {note&&<p className="muted" role="status">{note}</p>}
 </section>;
}

/** Priced quote built by the AI from rooms, plan, notes and the company catalogue. */
export function QuoteBuilder({request,plan,catalogue,draft,onDraft,demo=false,disabled=false}:{request:Data;plan:Plan|null|undefined;catalogue:Data[];draft:{lines?:Data[];assumptions?:string[];exclusions?:string[];summary?:string};onDraft:(draft:QuoteDraft)=>void;demo?:boolean;disabled?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const lines=draft.lines||[];const total=lines.reduce((s,l)=>s+(Number(l.quantity)||0)*(Number(l.price)||0),0);
 const priced=lines.length>0&&lines.every(l=>Number(l.price)>0);
 async function build(){
  setError('');if(lines.length&&!window.confirm('Remplacer les lignes actuelles par un nouveau chiffrage de l’IA ?'))return;
  if(demo){setError('Démonstration : le chiffrage IA est disponible dans l’espace réel.');return}
  setBusy(true);
  try{const items=catalogue.filter(c=>['Mon catalogue','Produits','Gabarits de départ'].includes(c.tab)).map(c=>({name:String(c.name||''),category:c.category||undefined,unit:c.unit||undefined,price:Number(c.price)||undefined,material:Number(c.material)||undefined,labour:Number(c.labour)||undefined,description:c.description?String(c.description).slice(0,300):undefined})).filter(c=>c.name);
   const out=await postJson({...request,action:'quote',plan:plan||null,catalogue:items});onDraft(out.quote)}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 const groups=lines.reduce((m:Record<string,Data[]>,l)=>{const k=String(l.category||'Travaux');(m[k]=m[k]||[]).push(l);return m},{});
 return <div className="quote-builder">
  <p className="eyebrow">DEVIS</p>
  <h3>Soumission chiffrée</h3>
  <p className="muted">L’IA calcule les quantités à partir des cotes et du plan (surfaces, murs, ouvertures) et applique d’abord les prix de votre catalogue, sinon les prix du marché du Grand Montréal.</p>
  <button type="button" className="btn primary" disabled={busy||disabled} onClick={()=>void build()}>{busy?<Loader2 size={16} className="spin"/>:<Calculator size={16}/>}{busy?'L’IA chiffre le devis… (30 à 90 s)':lines.length?'Rechiffrer avec l’IA':'Chiffrer le devis avec l’IA'}</button>
  {error&&<p className="error" role="alert">{error}</p>}
  {lines.length>0&&<>
   {Object.entries(groups).map(([cat,items])=><div className="quote-group" key={cat}><h4>{cat}</h4>{items.map((l,i)=><div className="quote-row" key={i}><span>{l.description}{l.basis==='catalogue'&&<em className="tag">catalogue</em>}</span><small>{l.quantity} {l.unit} × {money(Number(l.price)||0)}</small><b>{money((Number(l.quantity)||0)*(Number(l.price)||0))}</b></div>)}</div>)}
   <p className="quote-total">Total avant taxes : <b>{money(total)}</b></p>
   {!priced&&<p className="notice">Certaines lignes n’ont pas de prix : complétez-les dans la soumission.</p>}
   {draft.assumptions&&draft.assumptions.length>0&&<details><summary>Hypothèses ({draft.assumptions.length})</summary><ul>{draft.assumptions.map((a,i)=><li key={i}>{a}</li>)}</ul></details>}
   {draft.exclusions&&draft.exclusions.length>0&&<details><summary>Exclusions ({draft.exclusions.length})</summary><ul>{draft.exclusions.map((a,i)=><li key={i}>{a}</li>)}</ul></details>}
  </>}
 </div>;
}

/** Plan shown for a visit: the saved plan, or the layout built from measured rooms and their positions. */
export function visitPlan(d:Data):Plan{return d.plan||autoPlan(planRequestFromVisit(d).rooms as any)}

/** Keeps the visit rooms in step with plan edits without losing ids, positions, units, measures or notes. */
export function syncRoomsFromPlan(plan:Plan,rooms:Data[]):Data[]{
 const clean=(v:string)=>v.replace(/[^\w-]/g,'-').slice(0,60);
 const used=new Set<number>();
 return plan.rooms.filter(r=>r.phase!=='remove').map(r=>{
  let k=rooms.findIndex((v,i)=>!used.has(i)&&clean(String(v.id||`piece-${i+1}`))===r.id);
  if(k<0)k=rooms.findIndex((v,i)=>!used.has(i)&&String(v.name||'').trim().toLowerCase()===r.name.trim().toLowerCase());
  if(k>=0)used.add(k);
  const prev=k>=0?rooms[k]:null;const unit=prev?.unit==='m'?'m':prev?'pi':'m';
  const conv=(m:number)=>unit==='m'?Math.round(m*100)/100:Math.round(m/.3048*10)/10;
  const same=prev&&Math.abs(Number(prev.length)*(unit==='m'?1:.3048)-r.length)<.03&&Math.abs(Number(prev.width)*(unit==='m'?1:.3048)-r.width)<.03&&Math.abs(Number(prev.height)*(unit==='m'?1:.3048)-r.height)<.03;
  return {...(prev||{id:r.id,notes:'',materials:{}}),name:r.name,unit,...(same?{}:{length:conv(r.length),width:conv(r.width),height:conv(r.height)})};
 });
}

const UNIT_KEY='mgpro-unit';
/** Unit used for new rooms: the last one chosen on this device (feet by default). */
export function preferredUnit():'pi'|'m'{try{return localStorage.getItem(UNIT_KEY)==='m'?'m':'pi'}catch{return 'pi'}}
const convert=(v:unknown,from:string,to:string)=>{const n=Number(v);if(!Number.isFinite(n)||!n||from===to)return v;return to==='m'?Math.round(n*.3048*100)/100:Math.round(n/.3048*10)/10};
/** Changes a room's unit and converts its sizes (14 pi becomes 4.27 m, not 14 m). */
export function convertRoomUnit(room:Data,unit:string):Data{
 const from=room.unit==='m'?'m':'pi',to=unit==='m'?'m':'pi';if(from===to)return room;
 try{localStorage.setItem(UNIT_KEY,to)}catch{}
 return {...room,unit:to,length:convert(room.length,from,to),width:convert(room.width,from,to),height:convert(room.height,from,to),...(room.position?{position:{...room.position,offset:convert(room.position.offset,from,to)||0}}:{})};
}
/** Visit-wide switch between feet (Québec) and metres (France), converting every room. */
export function UnitSwitch({rooms,onRooms}:{rooms:Data[];onRooms:(rooms:Data[])=>void}){
 const metric=rooms.length>0&&rooms.every(r=>r.unit==='m');
 const choose=(unit:'pi'|'m')=>{try{localStorage.setItem(UNIT_KEY,unit)}catch{}onRooms(rooms.map(r=>convertRoomUnit(r,unit)))};
 return <div className="unit-switch" role="group" aria-label="Unités de mesure">
  <span>Unités</span>
  <button type="button" className={!metric?'active':''} aria-pressed={!metric} onClick={()=>choose('pi')}>Pieds · pi²</button>
  <button type="button" className={metric?'active':''} aria-pressed={metric} onClick={()=>choose('m')}>Mètres · m²</button>
 </div>;
}
