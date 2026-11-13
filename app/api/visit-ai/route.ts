import {NextResponse} from 'next/server';
import {z} from 'zod';
import {identity} from '@/lib/supabase';
import {sameOrigin} from '@/lib/access';
import {aiConfigured,aiProvider,aiText,lastModel,lastStop,extractJson,AiError,type AiContent} from '@/lib/ai';
import {planSchema} from '@/lib/plan';
import {MEASURE_SYSTEM,PLAN_SYSTEM,REVIEW_SYSTEM,QUOTE_SYSTEM,measureUserText,planUserText,reviewUserText,quoteUserText,normalizeMeasure,normalizePlan,normalizeReview,normalizeQuote,autoPlan,checkPlan} from '@/lib/visit-ai';

export const dynamic='force-dynamic';
export const maxDuration=120;

const image=z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).max(1_400_000);
const position=z.object({ref:z.string().max(80),side:z.enum(['right','left','above','below']),align:z.enum(['start','center','end']).optional(),offset:z.coerce.number().min(-200).max(200).optional(),door:z.boolean().optional()}).nullable().optional();
const room=z.object({id:z.string().max(80).optional(),name:z.string().max(120).optional(),length:z.coerce.number().min(0).max(1000).optional(),width:z.coerce.number().min(0).max(1000).optional(),height:z.coerce.number().min(0).max(100).optional(),unit:z.string().max(4).optional(),notes:z.string().max(3000).optional(),features:z.any().optional(),position});
const context={rooms:z.array(room).max(40).default([]),scope:z.string().max(8000).optional(),constraints:z.string().max(4000).optional(),materials:z.string().max(4000).optional(),notes:z.string().max(20000).optional()};
const measureSchema=z.object({action:z.literal('measure'),images:z.array(image).min(1).max(10),labels:z.array(z.string().max(60)).max(10).optional(),room:z.string().max(120).optional(),reference:z.string().max(400).optional(),source:z.enum(['photo','video']).default('photo')});
const planIn=z.object({action:z.literal('plan'),...context,style:z.enum(['nature','contemporary','classic','industrial']).optional()});
const reviewIn=z.object({action:z.literal('review'),...context,plan:planSchema});
const quoteIn=z.object({action:z.literal('quote'),...context,plan:planSchema.nullable().optional(),catalogue:z.array(z.object({name:z.string().max(200),category:z.string().max(120).optional(),unit:z.string().max(40).optional(),price:z.coerce.number().optional(),material:z.coerce.number().optional(),labour:z.coerce.number().optional(),description:z.string().max(400).optional()})).max(400).optional()});
const body=z.discriminatedUnion('action',[measureSchema,planIn,reviewIn,quoteIn]);
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});

/** Visit AI: room measurement from photos/video, 2D/3D plan, plan control and priced quote. */
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Origine refusée.'},403);
 const user=await identity();
 if(!user)return json({error:'Connexion requise.'},401);
 if(user.role==='client')return json({error:'Accès refusé.'},403);
 const parsed=body.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return json({error:parsed.error.issues[0]?.path.includes('images')?'Images invalides ou trop lourdes.':'Demande invalide.'},400);
 const input=parsed.data;
 const configured=aiConfigured(req);

 if(input.action==='measure'){
  if(!configured)return json({error:'IA non configurée sur ce déploiement.'},503);
  const content:AiContent[]=[];
  input.images.forEach((src,i)=>{const [,mime,data]=src.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)!;const label=input.labels?.[i];content.push({type:'text',text:`Image ${i+1}${label?` — ${label}`:''}`});content.push({type:'image',source:{type:'base64',media_type:mime as 'image/jpeg',data}})});
  content.push({type:'text',text:measureUserText({room:input.room,reference:input.reference,source:input.source,count:input.images.length,labels:input.labels})});
  try{
   const text=await aiText({req,system:MEASURE_SYSTEM,messages:[{role:'user',content}],maxTokens:12000,tier:'best',timeoutMs:110000});
   const measure=normalizeMeasure(extractJson(text));
   if(!measure)return json({error:'L’IA n’a pas pu mesurer cette pièce. Reprenez une photo depuis chaque coin, avec une porte ou une mesure au ruban visible.'},422);
   return json({measure,model:lastModel});
  }catch(e){const err=e as AiError;return json({error:err.message},err.status||502)}
 }

 if(input.action==='plan'){
  const fallback=autoPlan(input.rooms,input.style);
  if(!configured)return json({plan:fallback,checks:checkPlan(fallback,input.rooms),source:'auto',note:'Plan disposé à partir des positions indiquées (IA non configurée).'});
  try{
   const text=await aiText({req,system:PLAN_SYSTEM,messages:[{role:'user',content:planUserText(input)}],maxTokens:16000,timeoutMs:110000});
   const plan=normalizePlan(extractJson(text),input.rooms,input.style);
   if(plan)return json({plan,checks:checkPlan(plan,input.rooms),source:'model'});
   return json({plan:fallback,checks:checkPlan(fallback,input.rooms),source:'auto',note:'Réponse IA inutilisable : plan disposé à partir des positions indiquées.'});
  }catch(e){return json({plan:fallback,checks:checkPlan(fallback,input.rooms),source:'auto',note:`${(e as Error).message} Plan disposé à partir des positions indiquées.`})}
 }

 if(input.action==='review'){
  const checks=checkPlan(input.plan,input.rooms);
  if(!configured)return json({checks,review:null,note:'Contrôle automatique uniquement (IA non configurée).'});
  try{
   const text=await aiText({req,system:REVIEW_SYSTEM,messages:[{role:'user',content:reviewUserText(input.plan,input,checks)}],maxTokens:8000,timeoutMs:90000});
   return json({checks,review:normalizeReview(extractJson(text))});
  }catch(e){return json({checks,review:null,note:(e as Error).message})}
 }

 // action === 'quote'
 if(!configured)return json({error:'IA non configurée sur ce déploiement.'},503);
 try{
  const text=await aiText({req,system:QUOTE_SYSTEM,messages:[{role:'user',content:quoteUserText(input)}],maxTokens:16000,timeoutMs:110000});
  const quote=normalizeQuote(extractJson(text));
  if(!quote)return json({error:'L’IA n’a pas pu chiffrer ce devis. Complétez les travaux souhaités puis réessayez.'},422);
  return json({quote});
 }catch(e){const err=e as AiError;return json({error:err.message},err.status||502)}
}

/** Status for the UI, and an operator health check protected by AI_PROBE_SECRET. */
export async function GET(req:Request){
 const url=new URL(req.url),probe=url.searchParams.get('probe'),secret=process.env.AI_PROBE_SECRET;
 if(probe&&secret&&probe===secret){
  try{
   const test=url.searchParams.get('test');
   if(test==='plan'){
    const rooms=[{id:'cuisine',name:'Cuisine',length:14,width:11,height:8,unit:'pi'},{id:'salon',name:'Salon',length:16,width:13,height:8,unit:'pi',position:{ref:'cuisine',side:'right' as const,align:'start' as const,door:true}},{id:'sdb',name:'Salle de bain',length:8,width:6,height:8,unit:'pi',position:{ref:'cuisine',side:'below' as const,align:'start' as const,door:false}},{id:'chambre',name:'Chambre',length:12,width:11,height:8,unit:'pi',position:{ref:'salon',side:'below' as const,align:'end' as const,door:true}}];
    const ctx={rooms,scope:'Ouvrir le mur entre cuisine et salon, ajouter un îlot, refaire la salle de bain avec douche en céramique.'};
    const text=await aiText({req,system:PLAN_SYSTEM,messages:[{role:'user',content:planUserText(ctx)}],maxTokens:16000,timeoutMs:110000});
    const plan=normalizePlan(extractJson(text),rooms);
    if(url.searchParams.get('quote')&&plan){const q=await aiText({req,system:QUOTE_SYSTEM,messages:[{role:'user',content:quoteUserText({...ctx,plan})}],maxTokens:16000,timeoutMs:110000});const quote=normalizeQuote(extractJson(q));return json({ok:!!quote,model:lastModel,lines:quote?.lines.length,total:quote?.lines.reduce((s,l)=>s+l.quantity*l.price,0),sample:quote?.lines.slice(0,6),exclusions:quote?.exclusions.slice(0,3)})}
    return json({ok:!!plan,model:lastModel,stop:lastStop,rooms:plan?.rooms.map(r=>[r.name,r.x,r.y,r.length,r.width]),elements:plan?.elements.map(e=>`${e.kind}:${e.label}`),checks:plan?checkPlan(plan,rooms):null});
   }
   const text=await aiText({req,system:'Réponds uniquement OK.',messages:[{role:'user',content:'Test'}],maxTokens:300,tier:'fast',timeoutMs:20000});
   return json({ok:true,provider:aiProvider(req)?.kind,model:lastModel,answer:text.slice(0,20)});
  }catch(e){return json({ok:false,provider:aiProvider(req)?.kind||null,error:(e as Error).message})}
 }
 const user=await identity();
 if(!user||user.role==='client')return json({error:'Accès refusé.'},403);
 return json({configured:aiConfigured(req)});
}
