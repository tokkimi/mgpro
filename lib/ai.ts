// One entry point for every AI call of the app.
// Order of preference:
//  1. ANTHROPIC_API_KEY  → Anthropic API directly.
//  2. AI_GATEWAY_API_KEY → Vercel AI Gateway with that key.
//  3. Vercel OIDC token  → Vercel AI Gateway, no key to manage (works on any Vercel deployment).
// The OIDC token is read from the environment or, on Vercel Functions, from the
// `x-vercel-oidc-token` request header.

export type AiContent =
 | {type:'text';text:string}
 | {type:'image';source:{type:'url';url:string}}
 | {type:'image';source:{type:'base64';media_type:'image/jpeg'|'image/png'|'image/webp';data:string}};
export type AiMessage = {role:'user'|'assistant';content:string|AiContent[]};
export type AiProvider = {kind:'anthropic'|'gateway';url:string;headers:Record<string,string>;models:(tier:'best'|'smart'|'fast')=>string[]};

// Ordered candidates: when a model is not available on the account (e.g. AI Gateway free tier),
// the next one is tried. AI_MODEL overrides the first choice.
const MODELS = {
 anthropic:{best:['claude-opus-5-5','claude-sonnet-5-5','claude-sonnet-4-5'],smart:['claude-sonnet-5-5','claude-sonnet-4-5'],fast:['claude-haiku-5-5','claude-haiku-4-5']},
 gateway:{best:['anthropic/claude-opus-4.6','anthropic/claude-sonnet-5.5','anthropic/claude-sonnet-5','google/gemini-2.5-pro','google/gemini-2.5-flash'],smart:['anthropic/claude-sonnet-5.5','anthropic/claude-sonnet-5','anthropic/claude-sonnet-4.6','anthropic/claude-sonnet-4.5','anthropic/claude-haiku-4.5','google/gemini-2.5-flash','openai/gpt-5-mini'],fast:['anthropic/claude-haiku-5.5','anthropic/claude-haiku-4.5','google/gemini-2.5-flash','openai/gpt-5-mini']}
};
const withOverride=(list:readonly string[])=>{const o=process.env.AI_MODEL?.trim();return o?[o,...list.filter(m=>m!==o)]:[...list]};

export function aiProvider(req?:Request):AiProvider|null{
 const key=process.env.ANTHROPIC_API_KEY?.trim();
 if(key)return {kind:'anthropic',url:'https://api.anthropic.com/v1/messages',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},models:t=>withOverride(MODELS.anthropic[t])};
 const token=process.env.AI_GATEWAY_API_KEY?.trim()||process.env.VERCEL_OIDC_TOKEN?.trim()||req?.headers.get('x-vercel-oidc-token')?.trim();
 if(token)return {kind:'gateway',url:'https://ai-gateway.vercel.sh/v1/messages',headers:{authorization:`Bearer ${token}`,'anthropic-version':'2023-06-01','content-type':'application/json'},models:t=>withOverride(MODELS.gateway[t])};
 return null;
}

export function aiConfigured(req?:Request){return aiProvider(req)!==null;}

export let lastModel='';export let lastStop='';
// Models refused by the account (plan restrictions) are skipped for a while on this instance.
const unavailable=new Map<string,number>();
export class AiError extends Error{constructor(message:string,public status=502){super(message)}}

/** Calls Claude and returns the concatenated text answer. Throws AiError with a French message. */
export async function aiText({req,system,messages,maxTokens=2000,tier='smart',timeoutMs=55000}:{req?:Request;system:string;messages:AiMessage[];maxTokens?:number;tier?:'best'|'smart'|'fast';timeoutMs?:number}):Promise<string>{
 const provider=aiProvider(req);
 if(!provider)throw new AiError('IA non configurée sur ce déploiement.',503);
 let res:Response|null=null,lastBody='';
 const deadline=Date.now()+timeoutMs;
 const candidates=provider.models(tier).filter(m=>(unavailable.get(m)||0)<Date.now());
 for(const model of candidates.length?candidates:provider.models(tier)){
  const remaining=deadline-Date.now();if(remaining<3000)break;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),remaining);
  try{
   res=await fetch(provider.url,{method:'POST',signal:controller.signal,headers:provider.headers,body:JSON.stringify({model,max_tokens:maxTokens,system,messages})});
  }catch(e){throw new AiError((e as Error).name==='AbortError'?'L’IA a mis trop de temps à répondre. Réessayez.':'Service IA injoignable.',504)}
  finally{clearTimeout(timer)}
  if(res.ok){lastModel=model;break}
  lastBody=await res.text().catch(()=>'');
  console.error('ai error',provider.kind,model,res.status,lastBody.slice(0,300));
  // Model not available on this account / plan: try the next candidate.
  const restricted=/RestrictedModels|not_found|model_not_found|no_providers_available|does not have access|invalid model/i.test(lastBody)||res.status===404;
  if(!restricted)break;
  unavailable.set(model,Date.now()+15*60_000);
 }
 if(!res)throw new AiError('Service IA indisponible.',502);
 if(!res.ok){
  if(/Free tier|top-up|credits/i.test(lastBody))throw new AiError('Crédits IA à activer sur Vercel AI Gateway (offre gratuite insuffisante).',402);
  if(res.status===401||res.status===403)throw new AiError('Accès IA refusé (clé ou crédits AI Gateway à vérifier).',502);
  if(res.status===402)throw new AiError('Crédits IA épuisés sur le compte Vercel AI Gateway.',502);
  if(res.status===429)throw new AiError('Service IA saturé, réessayez dans un instant.',429);
  throw new AiError(`Service IA indisponible (${res.status}).`,502);
 }
 const data=await res.json();
 lastStop=String(data?.stop_reason||'');
 if(data?.stop_reason==='refusal')throw new AiError('L’IA a refusé de traiter cette demande.',422);
 return Array.isArray(data?.content)?data.content.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('\n'):'';
}

/** Extracts the first JSON object from a model answer (tolerates ```json fences and prose). */
export function extractJson<T=any>(text:string):T|null{
 const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/);const source=fenced?fenced[1]:text;
 const start=source.indexOf('{'),end=source.lastIndexOf('}');
 if(start<0||end<=start)return null;
 try{return JSON.parse(source.slice(start,end+1)) as T}catch{return null}
}
