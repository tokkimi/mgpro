import models from '@/lib/catalogue-models.json';

const modelNames=new Set([
 ...Object.values(models).map(([name])=>name),
 'coffee-table','floor-lamp','framed-abstract-print','potted-houseplant','round-jute-rug',
]);

export async function GET(request:Request,{params}:{params:Promise<{model:string}>}){
 const {model}=await params;
 if(!modelNames.has(model))return new Response(null,{status:404});
 const lod=new URL(request.url).searchParams.get('lod')==='1'?'1':'0';
 try{
  const response=await fetch(`https://tevy.dev/models/${model}/v1/lod${lod}.glb`,{signal:AbortSignal.timeout(10000)});
  if(!response.ok||!response.body)return new Response(null,{status:502});
  return new Response(response.body,{headers:{
   'Content-Type':'model/gltf-binary',
   'Cache-Control':'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  }});
 }catch{
  return new Response(null,{status:502});
 }
}
