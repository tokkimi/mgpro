import {NextResponse} from 'next/server';
import {z} from 'zod';
import {identity} from '@/lib/supabase';
import {sameOrigin} from '@/lib/access';
import {aiConfigured,aiProvider,aiText,lastModel,extractJson,AiError,type AiContent} from '@/lib/ai';
import {MEASURE_SYSTEM,PLAN_SYSTEM,measureUserText,planUserText,normalizeMeasure,normalizePlan,autoPlan} from '@/lib/visit-ai';

export const dynamic='force-dynamic';
export const maxDuration=90;

const image=z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).max(1_400_000);
const room=z.object({name:z.string().max(120).optional(),length:z.coerce.number().min(0).max(1000).optional(),width:z.coerce.number().min(0).max(1000).optional(),height:z.coerce.number().min(0).max(100).optional(),unit:z.string().max(4).optional(),notes:z.string().max(3000).optional(),features:z.any().optional()});
const measureSchema=z.object({action:z.literal('measure'),images:z.array(image).min(1).max(10),room:z.string().max(120).optional(),reference:z.string().max(400).optional(),source:z.enum(['photo','video']).default('photo')});
const planSchemaIn=z.object({action:z.literal('plan'),rooms:z.array(room).max(40).default([]),scope:z.string().max(8000).optional(),constraints:z.string().max(4000).optional(),materials:z.string().max(4000).optional(),notes:z.string().max(20000).optional(),style:z.enum(['nature','contemporary','classic','industrial']).optional()});
const body=z.discriminatedUnion('action',[measureSchema,planSchemaIn]);

/** Visit AI: estimate a room's dimensions from photos / video frames, and draw the 2D/3D plan. */
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Origine refusée.'},{status:403});
 const user=await identity();
 if(!user)return NextResponse.json({error:'Connexion requise.'},{status:401});
 if(user.role==='client')return NextResponse.json({error:'Accès refusé.'},{status:403});
 const parsed=body.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.path.includes('images')?'Images invalides ou trop lourdes.':'Demande invalide.'},{status:400});
 const input=parsed.data;

 if(input.action==='measure'){
  if(!aiConfigured(req))return NextResponse.json({error:'IA non configurée sur ce déploiement.'},{status:503});
  const content:AiContent[]=input.images.map(src=>{const [, mime, data]=src.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)!;return {type:'image',source:{type:'base64',media_type:mime as 'image/jpeg',data}}});
  content.push({type:'text',text:measureUserText({room:input.room,reference:input.reference,source:input.source,count:input.images.length})});
  try{
   const text=await aiText({req,system:MEASURE_SYSTEM,messages:[{role:'user',content}],maxTokens:2000,timeoutMs:80000});
   const measure=normalizeMeasure(extractJson(text));
   if(!measure)return NextResponse.json({error:'L’IA n’a pas pu estimer cette pièce. Essayez avec plus de photos, prises depuis les coins.'},{status:422});
   return NextResponse.json({measure},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){const err=e as AiError;return NextResponse.json({error:err.message},{status:err.status||502})}
 }

 // action === 'plan'
 const fallback=autoPlan(input.rooms,input.style);
 if(!aiConfigured(req))return NextResponse.json({plan:fallback,source:'auto',note:'Plan disposé automatiquement (IA non configurée).'});
 try{
  const text=await aiText({req,system:PLAN_SYSTEM,messages:[{role:'user',content:planUserText(input)}],maxTokens:8000,timeoutMs:80000});
  const plan=normalizePlan(extractJson(text),input.rooms,input.style);
  if(plan)return NextResponse.json({plan,source:'model'},{headers:{'Cache-Control':'private, no-store'}});
  return NextResponse.json({plan:fallback,source:'auto',note:'Réponse IA inutilisable : plan disposé automatiquement à partir des mesures.'});
 }catch(e){
  return NextResponse.json({plan:fallback,source:'auto',note:`${(e as Error).message} Plan disposé automatiquement à partir des mesures.`});
 }
}

/** Lightweight status for the UI (no AI call). */
export async function GET(req:Request){
 const probe=new URL(req.url).searchParams.get('probe'),secret=process.env.AI_PROBE_SECRET;
 if(probe&&secret&&probe===secret){
  // Operator health check: one tiny model call, no data involved.
  try{
   const url=new URL(req.url),test=url.searchParams.get('test');
   if(test==='plan'){const rooms=[{name:'Cuisine',length:14,width:11,height:8,unit:'pi'},{name:'Salon',length:16,width:13,height:8,unit:'pi'},{name:'Salle de bain',length:8,width:6,height:8,unit:'pi'},{name:'Chambre',length:12,width:11,height:8,unit:'pi'}];const text=await aiText({req,system:PLAN_SYSTEM,messages:[{role:'user',content:planUserText({rooms,scope:'Ouvrir le mur entre cuisine et salon, ajouter un îlot, refaire la salle de bain avec douche en céramique.'})}],maxTokens:8000,timeoutMs:80000});const plan=normalizePlan(extractJson(text),rooms);return NextResponse.json({ok:!!plan,model:lastModel,rooms:plan?.rooms.map(r=>[r.name,r.x,r.y,r.length,r.width,r.furniture]),elements:plan?.elements.length,raw:plan?undefined:text.slice(0,800)})}
   if(test==='measure'){const img=url.searchParams.get('img')||'';const text=await aiText({req,system:MEASURE_SYSTEM,messages:[{role:'user',content:[{type:'image',source:{type:'url',url:img}},{type:'text',text:measureUserText({source:'photo',count:1})}]}],maxTokens:2000,timeoutMs:80000});return NextResponse.json({ok:true,model:lastModel,measure:normalizeMeasure(extractJson(text)),raw:text.slice(0,600)})}
   const text=await aiText({req,system:'Réponds uniquement OK.',messages:[{role:'user',content:'Test'}],maxTokens:300,tier:'fast',timeoutMs:20000});return NextResponse.json({ok:true,provider:aiProvider(req)?.kind,model:lastModel,answer:text.slice(0,20)})}
  catch(e){return NextResponse.json({ok:false,provider:aiProvider(req)?.kind||null,error:(e as Error).message},{status:200})}
 }
 const user=await identity();
 if(!user||user.role==='client')return NextResponse.json({error:'Accès refusé.'},{status:403});
 return NextResponse.json({configured:aiConfigured(req)},{headers:{'Cache-Control':'private, no-store'}});
}
