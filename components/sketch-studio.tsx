'use client';
import {useRef,useState} from 'react';
import {fromRooms,type Plan} from '@/lib/plan';
import PlanEditor from './plan-editor';
import HandwrittenNotebook,{type Notebook} from './handwritten-notebook';
import {photoToJpeg} from './visit-ai-tools';

export default function SketchStudio({demo}:{demo:boolean}){
 const fileInput=useRef<HTMLInputElement>(null);
 const [photo,setPhoto]=useState('');
 const [notes,setNotes]=useState<Notebook>({strokes:[],text:''});
 const [reference,setReference]=useState('');
 const [plan,setPlan]=useState<Plan|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [revision,setRevision]=useState(0);

 async function read(file?:File){
  if(!file||busy)return;
  setBusy(true);setError('');
  try{setPhoto(await photoToJpeg(file))}
  catch{setError('Image illisible. Choisissez une photo JPEG ou PNG.')}
  finally{setBusy(false)}
 }
 function canvasImage(){
  if(photo)return photo;
  if(!notes.strokes.length)return '';
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=500;
  const ctx=canvas.getContext('2d');if(!ctx)return '';
  ctx.fillStyle='#fff';ctx.fillRect(0,0,800,500);
  ctx.strokeStyle='#1c271f';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
  for(const stroke of notes.strokes){
   if(!stroke.length)continue;
   ctx.beginPath();ctx.moveTo(stroke[0].x,stroke[0].y);
   for(const point of stroke)ctx.lineTo(point.x,point.y);
   ctx.stroke();
  }
  return canvas.toDataURL('image/jpeg',.82);
 }
 async function convert(){
  if(demo||busy)return;
  setBusy(true);setError('');
  try{
   const image=canvasImage();if(!image)throw new Error('Ajoutez une photo ou dessinez un croquis.');
   const res=await fetch('/api/visit-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sketch',image,reference:reference.trim()||undefined})});
   const out=await res.json().catch(()=>null);
   if(!res.ok||!out?.plan)throw new Error(out?.error||'Conversion indisponible. Vous pouvez dessiner le plan manuellement.');
   setPlan(out.plan);setRevision(value=>value+1);
  }catch(error){setError((error as Error).message)}
  finally{setBusy(false)}
 }
 return <section className="sketch-studio">
  <p>Importez une photo de plan ou dessinez un croquis. Vérifiez ensuite les cotes, exportez le PDF et ouvrez la visite 3D.</p>
  <div className="sketch-source">
   <div className="sketch-drop" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void read(event.dataTransfer.files[0])}}>
    <button className="btn secondary" type="button" disabled={busy} onClick={()=>fileInput.current?.click()}>Choisir une photo de plan</button>
    <span>ou glissez le fichier ici</span>
    <input hidden ref={fileInput} type="file" accept="image/*" onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';void read(file)}}/>
    {photo&&<><img src={photo} alt="Croquis importé"/><button className="btn ghost" type="button" disabled={busy} onClick={()=>setPhoto('')}>Retirer la photo</button></>}
   </div>
   <HandwrittenNotebook value={notes} onChange={setNotes}/>
  </div>
  <label>Cote de référence (facultative)<input value={reference} maxLength={240} placeholder="Ex. mur du fond : 4,25 m" onChange={event=>setReference(event.target.value)}/></label>
  <div className="button-row">
   <button type="button" className="btn primary" disabled={busy||demo||(!photo&&!notes.strokes.length)} onClick={()=>void convert()}>{busy?'Préparation du plan…':'Convertir en plan 2D'}</button>
   {!plan&&<button type="button" className="btn secondary" disabled={busy} onClick={()=>setPlan(fromRooms([]))}>Tracer un plan manuellement</button>}
  </div>
  {demo&&<p>En démo, le tracé manuel est disponible.</p>}
  {error&&<p role="alert">{error}</p>}
  {plan&&<PlanEditor key={revision} value={plan} onChange={setPlan}/>}
 </section>;
}
