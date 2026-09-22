import {PDFDocument,StandardFonts,rgb,PDFFont,PDFPage} from 'pdf-lib';
import {Data,defaults,totals,money,paymentRows,defaultPaymentSchedule} from './model';
// Professional soumission / facture / report layout built on pdf-lib. Keeps the
// original signature so existing callers (quote, invoice, visit, accounting) work.
const INK=rgb(.11,.15,.13),MUTED=rgb(.42,.46,.42),GOLD=rgb(.67,.52,.28),FOREST=rgb(.13,.25,.2),SOFT=rgb(.96,.965,.94),LINE=rgb(.85,.87,.83);
export async function makePdf(title:string,data:Data,client:Data={},settings:Data=defaults,photos:{bytes:Uint8Array;mime:string;caption:string}[]=[]){
 const pdf=await PDFDocument.create();
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const W=595,H=842,L=45,R=550,top=800,bottom=60;
 let page=pdf.addPage([W,H]);let y=top;
 const clean=(s:any)=>String(s??'').replace(/[  ]/g,' ').replace(/[–—]/g,'-').replace(/[’]/g,"'").replace(/[^\x20-\x7e\xa0-\xff\n]/g,'');
 const width=(s:string,size:number,f=font)=>f.widthOfTextAtSize(s,size);
 const ensure=(space:number)=>{if(y-space<bottom){page=pdf.addPage([W,H]);y=top;}};
 const wrap=(s:string,size:number,maxW:number,f=font)=>{const out:string[]=[];for(const raw of clean(s).split('\n')){let cur='';for(const w of raw.split(/\s+/)){if(!w)continue;const t=cur?cur+' '+w:w;if(width(t,size,f)>maxW&&cur){out.push(cur);cur=w;}else cur=t;}out.push(cur);}return out;};
 const draw=(s:string,x:number,size:number,{f=font,color=INK}:{f?:PDFFont;color?:any}={})=>{page.drawText(clean(s),{x,y,size,font:f,color});};
 const right=(s:string,x:number,size:number,{f=font,color=INK}:{f?:PDFFont;color?:any}={})=>{page.drawText(clean(s),{x:x-width(clean(s),size,f),y,size,font:f,color});};
 const para=(s:string,x:number,size:number,maxW:number,{f=font,color=INK,gap=5}:{f?:PDFFont;color?:any;gap?:number}={})=>{for(const ln of wrap(s,size,maxW,f)){ensure(size+gap);page.drawText(ln,{x,y,size,font:f,color});y-=size+gap;}};

 // Accounting report keeps a simple, dense layout.
 if(data.reportLines){
  draw(settings.name||defaults.name,L,20,{f:bold});y-=26;draw(title,L,15,{f:bold,color:FOREST});y-=22;
  for(const l of data.reportLines)para(l,L,10,R-L,{color:MUTED,gap:6});
  return finish();
 }

 // ---- Header band ----
 page.drawRectangle({x:0,y:H-6,width:W,height:6,color:GOLD});
 draw(settings.name||defaults.name,L,20,{f:bold});
 const num=data.number||'';
 const isInvoice=/facture/i.test(title),isQuote=/soumission|devis/i.test(title);
 right(title,R,17,{f:bold,color:FOREST});y-=15;
 draw(settings.address||'',L,9,{color:MUTED});right(isInvoice?`Facture ${num?'# '+num:''}`:num,R,10,{color:INK});y-=13;
 draw(`${settings.phone||''}  •  ${settings.email||''}`,L,9,{color:MUTED});right(`${isInvoice?'Date de facturation':'Date'} : ${clean(data.date||new Date().toISOString().slice(0,10))}`,R,9,{color:MUTED});y-=13;
 const lic=[settings.rbq?`RBQ ${settings.rbq}`:'',settings.tps_number?`TPS ${settings.tps_number}`:'',settings.tvq_number?`TVQ ${settings.tvq_number}`:''].filter(Boolean).join('  •  ');
 draw(lic,L,8.5,{color:MUTED});if(data.signed_at)right(`Signé le ${clean(data.signed_at)}`,R,9,{color:MUTED});y-=18;
 page.drawLine({start:{x:L,y},end:{x:R,y},thickness:1,color:LINE});y-=22;

 // ---- Client / billing ----
 const colR=310;const startY=y;
 draw('CLIENT',L,8,{f:bold,color:GOLD});y-=15;
 if(client.name)draw(client.name,L,12,{f:bold});y-=15;
 for(const v of [client.email,client.phone,data.project_number?`Projet ${data.project_number}`:'',client.address].filter(Boolean)){para(String(v),L,9.5,colR-L-15,{color:MUTED,gap:4});}
 const leftEnd=y;y=startY;
 if(client.billing_address){draw('ADRESSE DE FACTURATION',colR,8,{f:bold,color:GOLD});y-=15;para(String(client.billing_address),colR,9.5,R-colR,{color:MUTED,gap:4});}
 y=Math.min(leftEnd,y)-16;

 // ---- Cost summary box (quotes/invoices) ----
 const t=totals(data);
 const summary:[string,string][]=[['Sous-total',money(t.subtotal)]];
 if(t.discount>0)summary.push(['Remise',`- ${money(t.discount)}`]);
 summary.push([`TPS (${data.tps??5} %)`,money(t.tps)],[`TVQ (${data.tvq??9.975} %)`,money(t.tvq)]);
 const boxH=26+summary.length*15+30;ensure(boxH+10);
 page.drawRectangle({x:L,y:y-boxH,width:R-L,height:boxH,color:SOFT,borderColor:LINE,borderWidth:1});
 y-=20;draw('Résumé des coûts',L+16,11,{f:bold,color:FOREST});y-=18;
 for(const [k,v] of summary){draw(k,L+16,10,{color:MUTED});right(v,R-16,10);y-=15;}
 page.drawLine({start:{x:L+16,y:y+4},end:{x:R-16,y:y+4},thickness:1,color:LINE});y-=4;
 draw('Total',L+16,13,{f:bold,color:FOREST});right(money(t.total),R-16,14,{f:bold,color:FOREST});y-=30;

 // ---- Line items table ----
 const qtyX=405,puX=478,amtX=R;
 const header=()=>{ensure(30);page.drawRectangle({x:L,y:y-8,width:R-L,height:22,color:FOREST});const ty=y;const wl=(s:string,x:number,r=false)=>page.drawText(s,{x:r?x-width(s,8.5,bold):x,y:ty,size:8.5,font:bold,color:rgb(1,1,1)});wl('Description',L+10);wl('Qté',qtyX,true);wl('Coût unit.',puX,true);wl('Montant',amtX-10,true);y-=24;};
 header();
 let lastSection='';
 for(const l of (data.lines||[])){
  if(l.section&&l.section!==lastSection){lastSection=l.section;ensure(24);draw(String(l.section),L+2,10.5,{f:bold,color:GOLD});y-=18;}
  const descLines=wrap(l.description||'',10,qtyX-L-70,bold);
  ensure(descLines.length*14+18);
  // description (first line bold, rest normal muted)
  draw(descLines[0]||'',L+10,10,{f:bold});
  right(`${clean(String(l.quantity))} ${clean(l.unit||'')}`,qtyX,9.5,{color:MUTED});
  right(money(Number(l.price)),puX,9.5,{color:MUTED});
  right(money(Number(l.quantity)*Number(l.price)),amtX-10,10,{f:bold});
  y-=14;
  for(const dl of descLines.slice(1)){ensure(14);draw(dl,L+10,9.5,{color:MUTED});y-=13;}
  if(l.notes){for(const nl of wrap(l.notes,9,qtyX-L-70)){ensure(13);draw(nl,L+14,9,{color:MUTED});y-=12;}}
  page.drawLine({start:{x:L,y:y-2},end:{x:R,y:y-2},thickness:.5,color:LINE});y-=12;
 }
 y-=6;right(`Total : ${money(t.total)}`,R,13,{f:bold,color:FOREST});y-=26;

 // ---- Payment schedule + validity (quotes) ----
 if(isQuote){
  const schedule=Array.isArray(data.payment_schedule)&&data.payment_schedule.length?data.payment_schedule:defaultPaymentSchedule;
  const rows=paymentRows(t.total,schedule);
  if(rows.length){ensure(30+rows.length*15);draw('Échéancier de paiement',L,11,{f:bold,color:FOREST});y-=18;
   for(const r of rows){draw(r.label,L+10,10,{color:MUTED});right(`${r.percent} %`,puX,10,{color:MUTED});right(money(r.amount),amtX-10,10);y-=15;}y-=8;}
  const validity=data.validity||settings.validity||defaults.validity;
  if(validity){ensure(20);draw(`Validité : ${validity}`,L,10,{f:bold,color:MUTED});y-=20;}
 }

 // ---- Rooms & materials ----
 if(Array.isArray(data.rooms)&&data.rooms.length){ensure(24);draw('Pièces et mesures',L,11,{f:bold,color:FOREST});y-=17;
  for(const room of data.rooms){const u=room.unit||'pi';para(`${room.name||'Pièce'} — ${Number(room.length||0)} × ${Number(room.width||0)} × ${Number(room.height||0)} ${u} · surface ${Number(room.length||0)*Number(room.width||0)} ${u}²`,L+6,9.5,R-L-6,{color:MUTED,gap:4});if(room.notes)para(room.notes,L+6,9,R-L-6,{color:MUTED,gap:4});}y-=8;}
 if(Array.isArray(data.material_selection)&&data.material_selection.length){ensure(24);draw('Matériaux sélectionnés',L,11,{f:bold,color:FOREST});y-=17;for(const m of data.material_selection)para(`• ${m.surface||''} : ${m.name||''}${m.room?` (${m.room})`:''}`,L+6,9.5,R-L-6,{color:MUTED,gap:4});y-=6;}

 // ---- Free-text sections ----
 for(const [key,label] of [['scope','Travaux prévus'],['constraints','Contraintes et accès'],['materials','Matériaux et finitions'],['notes','Notes'],['conditions','Conditions']] as [string,string][]) if(data[key]){ensure(26);draw(label,L,10.5,{f:bold,color:FOREST});y-=16;para(data[key],L,9.5,R-L,{color:MUTED,gap:5});y-=6;}
 const terms=data.terms||settings.terms;
 if(terms){ensure(26);draw('Termes et conditions',L,10.5,{f:bold,color:FOREST});y-=16;para(terms,L,8.5,R-L,{color:MUTED,gap:4});}

 // ---- Photos ----
 for(const p of photos){try{const img=p.mime==='image/png'?await pdf.embedPng(p.bytes):p.mime==='image/jpeg'?await pdf.embedJpg(p.bytes):null;if(!img)continue;const dims=img.scaleToFit(R-L,300);ensure(dims.height+24);page.drawImage(img,{x:L,y:y-dims.height,width:dims.width,height:dims.height});y-=dims.height+6;para(p.caption||'',L,9,R-L,{color:MUTED});y-=10;}catch{para('Photo non intégrable au PDF. Consultez le dossier en ligne.',L,9,R-L,{color:MUTED});}}

 return finish();

 function finish(){const pages=pdf.getPages();pages.forEach((p,i)=>{p.drawText(clean(`${settings.name||defaults.name}`),{x:L,y:34,size:8,font,color:MUTED});p.drawText(`${i+1} / ${pages.length}`,{x:R-30,y:34,size:8,font,color:MUTED});p.drawLine({start:{x:L,y:46},end:{x:R,y:46},thickness:.5,color:LINE});});return pdf.save();}
}
