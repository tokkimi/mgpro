import {NextResponse} from 'next/server';
import {identity,db} from '@/lib/supabase';
import {visible,sameOrigin} from '@/lib/access';
const IMAGE=['image/jpeg','image/png','image/webp'];
const AUDIO=['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'];
const ALLOWED=[...IMAGE,'application/pdf',...AUDIO];
// Confirm the file's leading bytes match its declared type before storing it.
function sniff(type:string,b:Uint8Array){const txt=(a:number,c:number)=>new TextDecoder().decode(b.slice(a,c));
 if(type==='application/pdf')return txt(0,5)==='%PDF-';
 if(type==='image/jpeg')return b[0]===255&&b[1]===216;
 if(type==='image/png')return b[0]===137&&b[1]===80;
 if(type==='image/webp')return txt(8,12)==='WEBP';
 if(type==='audio/webm')return b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3;
 if(type==='audio/ogg')return txt(0,4)==='OggS';
 if(type==='audio/mp4')return txt(4,8)==='ftyp';
 if(type==='audio/mpeg')return txt(0,3)==='ID3'||(b[0]===0xff&&(b[1]&0xe0)===0xe0);
 if(type==='audio/wav')return txt(0,4)==='RIFF'&&txt(8,12)==='WAVE';
 return false;}
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Origine refusée.'},{status:403});const user=await identity();if(!user)return NextResponse.json({error:'Connexion requise.'},{status:401});const form=await req.formData();const file=form.get('file');const parentId=String(form.get('parent_id')||'');const parent=(await db().from('records').select('*').eq('id',parentId).maybeSingle()).data;if(!parent||!await visible(user,parent))return NextResponse.json({error:'Dossier inaccessible.'},{status:403});if(user.role==='client')return NextResponse.json({error:'Seule l’équipe peut ajouter des documents.'},{status:403});
 const uploadId=String(form.get('upload_id')||crypto.randomUUID());if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadId))return NextResponse.json({error:'Identifiant invalide.'},{status:400});const existing=(await db().from('records').select('*').eq('id',uploadId).eq('kind','document').maybeSingle()).data;if(existing){if(existing.data.parent_id!==parentId||existing.data.uploaded_by!==user.id)return NextResponse.json({error:'Transfert incompatible.'},{status:409});return NextResponse.json({record:existing});}
 const mime=file instanceof File?file.type.split(';')[0].trim():'';
 if(!(file instanceof File)||file.size>10*1024*1024||!ALLOWED.includes(mime))return NextResponse.json({error:'Ajoutez une image (JPEG, PNG, WebP), un PDF ou une note vocale (moins de 10 Mo).'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());if(!sniff(mime,bytes))return NextResponse.json({error:'Le contenu du fichier ne correspond pas à son format.'},{status:400});
 const path=`${parentId}/${user.id}/${uploadId}`;const storage=db().storage.from('documents');const upload=await storage.upload(path,bytes,{contentType:mime});if(upload.error&&upload.error.message!=='The resource already exists')return NextResponse.json({error:'Téléversement impossible.'},{status:503});
 const isAudio=AUDIO.includes(mime);
 const extra=isAudio?{media:'audio',transcript:String(form.get('transcript')||'').slice(0,20000),duration:Number(form.get('duration')||0)}:{};
 const {data,error}=await db().from('records').insert({id:uploadId,kind:'document',client_id:parent.kind==='client'?parent.id:parent.client_id,project_id:parent.kind==='project'?parent.id:parent.project_id,data:{uploaded_by:user.id,name:file.name,path,mime,size:file.size,parent_id:parentId,visibility:user.role==='admin'&&form.get('visibility')==='client'?'client':'internal',caption:String(form.get('caption')||''),...extra}}).select().single();if(error){const retry=(await db().from('records').select('*').eq('id',uploadId).maybeSingle()).data;if(retry&&retry.data.uploaded_by===user.id&&retry.data.parent_id===parentId)return NextResponse.json({record:retry});await storage.remove([path]);return NextResponse.json({error:'Enregistrement du document impossible.'},{status:503});}return NextResponse.json({record:data});}
export async function GET(req:Request){const user=await identity();if(!user)return NextResponse.json({error:'Connexion requise.'},{status:401});const id=new URL(req.url).searchParams.get('id');const r=(await db().from('records').select('*').eq('id',id).eq('kind','document').maybeSingle()).data;if(!r||!await visible(user,r))return NextResponse.json({error:'Document inaccessible.'},{status:403});const {data,error}=await db().storage.from('documents').createSignedUrl(r.data.path,120);return error?NextResponse.json({error:'Ouverture impossible.'},{status:503}):NextResponse.redirect(data.signedUrl);}
