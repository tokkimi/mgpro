import {NextResponse} from 'next/server';
import {identity,db} from '@/lib/supabase';
import {aiInstructions} from '@/lib/settings-model';
import {sameOrigin} from '@/lib/access';
import {z} from 'zod';
import {aiConfigured,aiText} from '@/lib/ai';
import {analyzeTranscript,buildAnalysisMessages,parseModelAnalysis,Analysis} from '@/lib/analyze';
export const dynamic='force-dynamic';
export const maxDuration=60;
const schema=z.object({transcript:z.string().min(1).max(20000),context:z.object({scope:z.string().max(6000).optional(),rooms:z.array(z.object({name:z.string().optional(),length:z.number().optional(),width:z.number().optional(),height:z.number().optional(),unit:z.string().optional()})).max(40).optional()}).optional()});
// Analyse a dictated visit note into draft quote lines. Claude refines the result
// when an AI provider is available (see lib/ai.ts); otherwise the deterministic heuristic answers.
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Origine refusée.'},{status:403});
 const user=await identity();if(user?.role!=='admin')return NextResponse.json({error:'Accès refusé.'},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Note vocale invalide.'},{status:400});
 const {transcript,context={}}=parsed.data;
 const fallback:Analysis=analyzeTranscript(transcript,context);
 const configured=aiConfigured(req);
 if(configured){
  try{
   const built=buildAnalysisMessages(transcript,context),messages=built.messages;const preferences=(await db().from('records').select('data').eq('kind','settings').limit(1).maybeSingle()).data?.data?.ai_preferences;const system=`${built.system}\n\n${aiInstructions(preferences)}`;
   const textOut=await aiText({req,system,messages,maxTokens:8000,timeoutMs:50000});
   const analysis=parseModelAnalysis(textOut);
   if(analysis)return NextResponse.json({analysis});
  }catch(e){console.error('analyze',(e as Error).message)}
 }
 return NextResponse.json({analysis:fallback,note:configured?'Analyse locale utilisée (le service IA n’a pas répondu).':undefined});
}
