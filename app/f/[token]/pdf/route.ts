import {db} from '@/lib/supabase';
import {defaults,type RecordItem} from '@/lib/model';
import {makePdf} from '@/lib/pdf';
import {redact} from '@/lib/redact';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** PDF of a publicly linked invoice, rendered from the client-safe projection (no costs, no internal notes). */
export async function GET(_req:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!uuid.test(token))return new Response('Introuvable',{status:404});
 const raw=(await db().from('records').select('*').eq('kind','invoice').eq('data->>public_token',token).maybeSingle()).data as RecordItem|null;
 if(!raw||['Brouillon','Annulée'].includes(String(raw.data.status)))return new Response('Introuvable',{status:404});
 const invoice=redact({id:'public',name:'',email:'',role:'client',client_id:raw.client_id},raw);
 const client=raw.client_id?(await db().from('records').select('data').eq('id',raw.client_id).maybeSingle()).data?.data||{}:{};
 const settings=(await db().from('records').select('data').eq('kind','settings').limit(1).maybeSingle()).data?.data||defaults;
 const bytes=await makePdf('Facture',invoice.data,client,settings);
 return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${String(raw.data.number||'facture')}.pdf"`,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
}
