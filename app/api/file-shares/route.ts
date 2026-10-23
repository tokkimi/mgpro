import {NextResponse} from 'next/server';
import {db,identity,configured} from '@/lib/supabase';
import {sameOrigin,visible} from '@/lib/access';
import {authorizedShare,fileShares,newFileShare} from '@/lib/file-share';
const uuid=/^[a-f0-9-]{36}$/i;
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export const dynamic='force-dynamic';
/** Public access is restricted to the exact uploaded document IDs explicitly published by an admin. */
export async function GET(req:Request){
 const url=new URL(req.url),token=url.searchParams.get('token')||'',parts=token.split('.');
 if(parts.length!==2||!uuid.test(parts[0]))return NextResponse.json({error:'Lien invalide ou expiré.'},{status:404,headers});
 if(!configured())return NextResponse.json({error:'Le partage de fichiers est indisponible.'},{status:503,headers});
 const client=db();const {data:project}=await client.from('records').select('*').eq('id',parts[0]).eq('kind','project').maybeSingle();
 const share=project&&!project.data.archived&&!project.data.deleted_at?authorizedShare(fileShares(project.data),parts[1]):null;
 if(!share)return NextResponse.json({error:'Lien invalide ou expiré.'},{status:404,headers});
 if(project.client_id){const {data:owner}=await client.from('records').select('data').eq('id',project.client_id).eq('kind','client').maybeSingle();if(!owner||owner.data.deleted_at)return NextResponse.json({error:'Lien indisponible.'},{status:404,headers})}
 const id=url.searchParams.get('id');
 if(id){
  if(!share.documentIds.includes(id))return NextResponse.json({error:'Document inaccessible.'},{status:404,headers});
  const {data:document}=await client.from('records').select('*').eq('id',id).eq('kind','document').eq('project_id',project.id).maybeSingle();
  if(!document?.data.path)return NextResponse.json({error:'Document indisponible.'},{status:404,headers});
  const {data,error}=await client.storage.from('documents').createSignedUrl(document.data.path,60,{download:String(document.data.name||'fichier')});
  if(error||!data)return NextResponse.json({error:'Téléchargement indisponible.'},{status:503,headers});
  return NextResponse.redirect(data.signedUrl,{headers});
 }
 // Chunk to avoid PostgREST URL limits and its default 1000-row result limit.
 const documents=[];
 for(let offset=0;offset<share.documentIds.length;offset+=100){const result=await client.from('records').select('id,data,updated_at').eq('kind','document').eq('project_id',project.id).in('id',share.documentIds.slice(offset,offset+100));if(result.error)return NextResponse.json({error:'Lecture impossible.'},{status:503,headers});documents.push(...(result.data||[]).map(d=>({id:d.id,name:String(d.data.name||'Fichier'),size:Number(d.data.size||0),type:String(d.data.mime||''),updated:d.updated_at})))}
 return NextResponse.json({label:share.label,expiresAt:share.expiresAt,documents},{headers});
}
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Origine refusée.'},{status:403});
 const user=await identity();if(user?.role!=='admin')return NextResponse.json({error:'Seul le dirigeant peut publier un lien.'},{status:403});
 let body;try{body=await req.json()}catch{return NextResponse.json({error:'Demande invalide.'},{status:400})}
 if(!body||typeof body!=='object'||!uuid.test(body.projectId||''))return NextResponse.json({error:'Projet invalide.'},{status:400});
 const client=db();const {data:project}=await client.from('records').select('*').eq('id',body.projectId).eq('kind','project').maybeSingle();
 if(!project||!await visible(user,project))return NextResponse.json({error:'Projet inaccessible.'},{status:404});
 const now=Date.now(),active=fileShares(project.data).filter(s=>Date.parse(s.expiresAt)>now);
 let next=active;let created:ReturnType<typeof newFileShare>|undefined;
 if(body.revokeId){next=active.filter(s=>s.id!==body.revokeId)}else{
  if(!Array.isArray(body.documentIds)||!body.documentIds.length||body.documentIds.length>2000||body.documentIds.some((id:unknown)=>typeof id!=='string'||!uuid.test(id)))return NextResponse.json({error:'Choisissez de 1 à 2000 fichiers.'},{status:400});
  if(active.length>=50)return NextResponse.json({error:'Révoquez un lien avant d’en créer un autre.'},{status:400});
  const ids=[...new Set<string>(body.documentIds)];
  for(let i=0;i<ids.length;i+=100){const {data:docs,error}=await client.from('records').select('*').eq('kind','document').eq('project_id',project.id).in('id',ids.slice(i,i+100));if(error||docs?.length!==ids.slice(i,i+100).length)return NextResponse.json({error:'Un fichier ne fait pas partie de ce projet.'},{status:400});for(const doc of docs)if(!await visible(user,doc))return NextResponse.json({error:'Document inaccessible.'},{status:403})}
  created=newFileShare(ids,String(body.label||'Fichiers partagés'),now);next=[...active,created.share];
 }
 const {data:updated,error}=await client.from('records').update({data:{...project.data,file_shares:next},version:project.version+1,updated_at:new Date(now).toISOString()}).eq('id',project.id).eq('version',project.version).select().maybeSingle();
 if(error)return NextResponse.json({error:'Enregistrement impossible.'},{status:503});
 if(!updated)return NextResponse.json({error:'Le projet a changé. Réessayez.'},{status:409});
 await client.from('audit_log').insert({actor_id:user.id,action:created?'file_share_created':'file_share_revoked',record_id:project.id,details:{share_id:created?.share.id||body.revokeId}});
 return NextResponse.json({record:updated,...(created?{token:`${project.id}.${created.secret}`,expiresAt:created.share.expiresAt}:{})},{headers});
}
