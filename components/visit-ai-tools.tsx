'use client';

import {useRef,useState} from 'react';
import {Camera,Loader2,Ruler,Sparkles,Video,Check,X} from 'lucide-react';
import type {Plan} from '@/lib/plan';
import './visit-ai-tools.css';

type Data=Record<string,any>;
type Measure={length:number;width:number;height:number;unit:'m';confidence:'faible'|'moyenne'|'bonne';margin:number;doors:number;windows:number;name?:string;features:string[];references:string[];observations:string;advice:string};

const MAX_SIDE=1024,QUALITY=.72,MAX_PHOTOS=8,VIDEO_FRAMES=8;

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

/** Extracts evenly spaced frames from a walkthrough video, entirely in the browser. */
async function videoFrames(file:File,count=VIDEO_FRAMES){
 const url=URL.createObjectURL(file);const video=document.createElement('video');
 video.muted=true;video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';video.src=url;
 try{
  await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Vidéo trop longue à charger. Essayez une vidéo plus courte (30 s à 1 min).')),20000);video.onloadeddata=()=>{clearTimeout(t);resolve()};video.onerror=()=>{clearTimeout(t);reject(new Error('Format vidéo non lisible sur cet appareil. Filmez en MP4/MOV ou utilisez des photos.'))}});
  const duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:0;
  if(!duration||!video.videoWidth)throw new Error('Vidéo illisible. Utilisez des photos à la place.');
  const frames:string[]=[];
  for(let k=0;k<count;k++){
   const time=Math.min(duration-.05,duration*(k+.5)/count);
   await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Lecture de la vidéo interrompue.')),8000);video.onseeked=()=>{clearTimeout(t);resolve()};video.currentTime=time});
   frames.push(toJpeg(video,video.videoWidth,video.videoHeight));
  }
  return frames;
 }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url)}
}

async function postJson(body:Data){
 const res=await fetch('/api/visit-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const out=await res.json().catch(()=>({error:res.status===413?'Images trop lourdes : envoyez moins de photos.':'Réponse invalide du serveur.'}));
 if(!res.ok)throw new Error(out.error||`Erreur ${res.status}`);return out;
}

const fromM=(m:number,unit:string)=>unit==='m'?Math.round(m*100)/100:Math.round(m/.3048*10)/10;

/** Per-room measurement: photos or a short video → dimensions estimated by Claude. */
export function RoomMeasure({room,onApply,disabled=false,demo=false}:{room:Data;onApply:(patch:Data)=>void;disabled?:boolean;demo?:boolean}){
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[result,setResult]=useState<Measure|null>(null),[reference,setReference]=useState(''),[previews,setPreviews]=useState<string[]>([]);
 const photoInput=useRef<HTMLInputElement>(null),videoInput=useRef<HTMLInputElement>(null);
 const unit=room.unit==='m'?'m':'pi';

 async function run(files:File[],source:'photo'|'video'){
  setError('');setResult(null);
  if(demo){setError('Démonstration : la mesure IA est disponible dans l’espace réel.');return}
  try{
   setBusy(source==='video'?'Extraction des images de la vidéo…':'Préparation des photos…');
   let images:string[];
   if(source==='video'){if(files[0].size>500*1024*1024)throw new Error('Vidéo trop lourde (500 Mo max).');images=await videoFrames(files[0])}
   else{if(files.length>MAX_PHOTOS)setError(`Seules les ${MAX_PHOTOS} premières photos sont utilisées.`);images=[];for(const f of files.slice(0,MAX_PHOTOS))images.push(await photoToJpeg(f))}
   setPreviews(images);
   setBusy('L’IA analyse la pièce… (20 à 40 s)');
   const out=await postJson({action:'measure',source,images,room:room.name||undefined,reference:reference.trim()||undefined});
   setResult(out.measure);
  }catch(e){setError((e as Error).message)}finally{setBusy('')}
 }

 function apply(){
  if(!result)return;
  const extra=[result.observations,result.features.length?`Éléments : ${result.features.join(', ')}.`:''].filter(Boolean).join(' ');
  onApply({length:fromM(result.length,unit),width:fromM(result.width,unit),height:fromM(result.height,unit),...(!room.name&&result.name?{name:result.name}:{}),notes:[room.notes,extra&&!String(room.notes||'').includes(result.observations)?`[Relevé IA] ${extra}`:''].filter(Boolean).join('\n'),features:{doors:result.doors,windows:result.windows,list:result.features},measured_by:'ia',measure_margin:result.margin});
  setResult(null);setPreviews([]);
 }

 return <div className="room-ai-measure">
  <p className="room-ai-head"><Ruler size={15}/><b>Mesurer avec l’IA</b><small>photos depuis les coins, ou une vidéo lente du tour de la pièce</small></p>
  <label className="room-ai-reference">Une mesure connue (facultatif, améliore la précision)<input value={reference} disabled={!!busy||disabled} onChange={e=>setReference(e.target.value)} placeholder="ex. porte 32 po · mur du fond 3,20 m · plafond 8 pi"/></label>
  <div className="button-row">
   <button type="button" className="btn secondary" disabled={!!busy||disabled} onClick={()=>photoInput.current?.click()}><Camera size={16}/>Photos</button>
   <button type="button" className="btn secondary" disabled={!!busy||disabled} onClick={()=>videoInput.current?.click()}><Video size={16}/>Vidéo</button>
   <input ref={photoInput} hidden type="file" accept="image/*" multiple onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)void run(files,'photo')}}/>
   <input ref={videoInput} hidden type="file" accept="video/*" onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)void run(files,'video')}}/>
  </div>
  {busy&&<p className="room-ai-status" role="status"><Loader2 size={15} className="spin"/>{busy}</p>}
  {previews.length>0&&<div className="room-ai-previews">{previews.map((src,i)=><img key={i} src={src} alt={`Image ${i+1} analysée`}/>)}</div>}
  {error&&<p className="error" role="alert">{error}</p>}
  {result&&<div className="room-ai-result">
   <p className="room-ai-dims"><b>{fromM(result.length,unit)} × {fromM(result.width,unit)} {unit}</b> · hauteur {fromM(result.height,unit)} {unit} · {Math.round(fromM(result.length,unit)*fromM(result.width,unit)*10)/10} {unit}²</p>
   <p className="muted">Estimation IA · fiabilité {result.confidence} · marge ± {result.margin} % · {result.doors} porte(s), {result.windows} fenêtre(s){result.name?` · ${result.name}`:''}</p>
   {result.references.length>0&&<p className="muted">Étalons utilisés : {result.references.join(', ')}</p>}
   {result.observations&&<p>{result.observations}</p>}
   {result.advice&&<p className="muted">À confirmer au ruban : {result.advice}</p>}
   <div className="button-row"><button type="button" className="btn primary" onClick={apply}><Check size={16}/>Appliquer à la pièce</button><button type="button" className="btn ghost" onClick={()=>{setResult(null);setPreviews([])}}><X size={16}/>Ignorer</button></div>
  </div>}
 </div>;
}

/** Builds the payload for plan generation from a visit record. */
export function planRequestFromVisit(d:Data){
 const notes=[...(d.voice_notes||[]).map((v:Data)=>v.transcript),d.notes,d.notebook?.text].filter(Boolean).join('\n');
 return {action:'plan',rooms:(d.rooms||[]).map((r:Data)=>({name:r.name,length:Number(r.length)||0,width:Number(r.width)||0,height:Number(r.height)||0,unit:r.unit==='m'?'m':'pi',notes:r.notes||'',features:r.features})),scope:d.scope||undefined,constraints:d.constraints||undefined,materials:d.materials||undefined,notes:notes||undefined};
}

/** One button: Claude draws the 2D plan (and therefore the 3D model) from the visit. */
export function PlanGenerator({request,onPlan,disabled=false,demo=false,label='Générer le plan 2D / 3D avec l’IA',hasPlan=false}:{request:Data;onPlan:(plan:Plan,note:string)=>void;disabled?:boolean;demo?:boolean;label?:string;hasPlan?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function generate(){
  setMessage('');
  if(hasPlan&&!window.confirm('Remplacer le plan actuel par un nouveau plan généré par l’IA ?'))return;
  setBusy(true);
  try{
   if(demo){const {autoPlan}=await import('@/lib/visit-ai');onPlan(autoPlan(request.rooms||[]),'Démonstration : plan disposé automatiquement.');return}
   const out=await postJson(request);
   const note=out.source==='model'?'Plan dessiné par l’IA à partir de la visite. Vérifiez les cotes, puis validez pour voir la 3D.':out.note||'Plan disposé automatiquement.';
   onPlan(out.plan,note);setMessage(note);
  }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 return <div className="plan-ai-generator">
  <button type="button" className="btn primary" disabled={busy||disabled} onClick={()=>void generate()}>{busy?<Loader2 size={16} className="spin"/>:<Sparkles size={16}/>}{busy?'L’IA dessine le plan… (30 à 60 s)':label}</button>
  {message&&<p className="muted" role="status">{message}</p>}
 </div>;
}
