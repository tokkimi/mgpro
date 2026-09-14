import {NextResponse} from 'next/server';
import {z} from 'zod';
import sharp from 'sharp';
import {configured,db} from '@/lib/supabase';
import {sameOrigin} from '@/lib/access';
import {createHash,randomUUID} from 'crypto';
const schema=z.object({name:z.string().min(2).max(150),email:z.email(),phone:z.string().min(7).max(40),address:z.string().min(3).max(500),service:z.string().min(2).max(100),budget:z.string().max(100),timeline:z.string().max(100),description:z.string().min(10).max(10000),consent:z.literal(true),website:z.string().max(0),locale:z.enum(['fr','en']).default('fr')});
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Origine refusée.'},{status:403});
 if(!configured())return NextResponse.json({error:'Service indisponible. Appelez-nous au 514-317-6305.'},{status:503});
 if(Number(req.headers.get('content-length'))>4000000)return NextResponse.json({error:'Les photos sont trop volumineuses.'},{status:413});
 let payload:unknown;let files:File[]=[];
 try{if(req.headers.get('content-type')?.includes('multipart/form-data')){const form=await req.formData();payload=JSON.parse(String(form.get('data')));const entries=form.getAll('photos');if(entries.some(f=>!(f instanceof File)))throw Error();files=entries as File[]}else payload=await req.json()}catch{return NextResponse.json({error:'Demande invalide.'},{status:400})}
 const p=schema.safeParse(payload);if(!p.success)return NextResponse.json({error:'Veuillez vérifier les champs obligatoires et votre consentement.'},{status:400});
 if(files.length>10||files.reduce((sum,f)=>sum+f.size,0)>3500000||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)))return NextResponse.json({error:'Ajoutez au maximum 10 photos JPEG, PNG ou WebP.'},{status:400});
 const key=createHash('sha256').update(req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').digest('hex');const limit=await db().rpc('rate_limit',{p_key:key});if(limit.error||!limit.data)return NextResponse.json({error:'Trop de demandes. Réessayez plus tard ou appelez-nous.'},{status:429});
 const photos:{name:string;bytes:Buffer}[]=[];
 try{for(const file of files){const bytes=await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:25000000}).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer();photos.push({name:file.name.replace(/\.[^.]+$/,'').slice(0,140)+'.jpg',bytes})}}catch{return NextResponse.json({error:'Une photo est illisible. Retirez-la puis réessayez.'},{status:400})}
 const client=db();const {data,error}=await client.from('records').insert({kind:'request',data:{...p.data,status:'Nouvelle',source:'Site web'}}).select('id').single();if(error)return NextResponse.json({error:'La demande n’a pas pu être enregistrée. Réessayez.'},{status:503});
 const paths:string[]=[];const ids:string[]=[];
 try{for(const photo of photos){const path=`${data.id}/${randomUUID()}`;const upload=await client.storage.from('documents').upload(path,photo.bytes,{contentType:'image/jpeg'});if(upload.error)throw upload.error;paths.push(path);const doc=await client.from('records').insert({kind:'document',data:{name:photo.name,path,mime:'image/jpeg',size:photo.bytes.length,parent_id:data.id,visibility:'internal',caption:'Photo jointe à la demande'}}).select('id').single();if(doc.error)throw doc.error;ids.push(doc.data.id)}return NextResponse.json({id:data.id,photoCount:photos.length})}
 catch{if(paths.length)await client.storage.from('documents').remove(paths);await client.from('records').delete().in('id',[...ids,data.id]);return NextResponse.json({error:'Les photos n’ont pas pu être enregistrées. Veuillez réessayer.'},{status:503})}
}
