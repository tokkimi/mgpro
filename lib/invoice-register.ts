import {round,totals,type RecordItem} from './model';
import {invoiceState,outstanding} from './billing';
export type InvoiceFilters={query:string;projectId:string;status:string;from:string;to:string};
export function invoiceRegister(records:RecordItem[],filters:InvoiceFilters,today:string){
 const clients=new Map(records.filter(r=>r.kind==='client').map(r=>[r.id,String(r.data.name||'')]));
 const projects=new Map(records.filter(r=>r.kind==='project').map(r=>[r.id,String(r.data.title||'')]));
 const query=filters.query.trim().toLocaleLowerCase('fr');
 return records.filter(r=>r.kind==='invoice'&&!r.data.deleted_at).map(r=>({record:r,client:clients.get(r.client_id||'')||String(r.data.client_name||''),project:projects.get(r.project_id||'')||'',date:String(r.data.date||'').slice(0,10),state:invoiceState(r.data,today),amounts:totals(r.data),balance:outstanding(r.data)})).filter(r=>(!filters.projectId||r.record.project_id===filters.projectId)&&(!filters.status||r.state===filters.status)&&(!filters.from||r.date>=filters.from)&&(!filters.to||r.date<=filters.to)&&(!query||[r.record.data.number,r.record.data.title,r.client,r.project,...(r.record.data.lines||[]).map((l:any)=>l.description)].join(' ').toLocaleLowerCase('fr').includes(query))).sort((a,b)=>b.date.localeCompare(a.date)||String(b.record.data.number||'').localeCompare(String(a.record.data.number||''),'fr',{numeric:true}));
}
export function invoiceRegisterSummary(rows:ReturnType<typeof invoiceRegister>){
 const issued=rows.filter(r=>!['Brouillon','Annulée'].includes(r.state));
 return {billed:round(issued.reduce((s,r)=>s+r.amounts.total,0)),paid:round(issued.reduce((s,r)=>s+Number(r.record.data.paid||0),0)),balance:round(issued.reduce((s,r)=>s+r.balance,0))};
}
export function invoiceRegisterCsv(rows:ReturnType<typeof invoiceRegister>){
 const cell=(v:unknown)=>'"'+String(v??'').replace(/^([\s]*[=+@-])/,"'$1").replaceAll('"','""')+'"';
 return '\ufeff'+[['Référence','Client','Description','Projet','Facturée le','Envoyée le','Ouverte le','Échéance','Sous-total HT','TPS','TVQ','Total TTC','Payé','Solde dû','Statut'],...rows.map(r=>[r.record.data.number,r.client,r.record.data.title,r.project,r.date,r.record.data.sent_at,r.record.data.first_viewed_at,r.record.data.due,r.amounts.net,r.amounts.tps,r.amounts.tvq,r.amounts.total,r.record.data.paid||0,r.balance,r.state])].map(row=>row.map(cell).join(';')).join('\r\n');
}

export type PaymentFilters={query:string;projectId:string;invoiceId:string;from:string;to:string};
/** Only explicit customer payment journals; invoice paid totals never fabricate individual transfers. */
export function customerPayments(records:RecordItem[],filters:PaymentFilters){
 const invoices=new Map(records.filter(r=>r.kind==='invoice'&&!r.data.deleted_at).map(r=>[r.id,r]));
 const clients=new Map(records.filter(r=>r.kind==='client').map(r=>[r.id,String(r.data.name||'')]));
 const query=filters.query.trim().toLocaleLowerCase('fr');
 return records.filter(r=>r.kind==='journal'&&!r.data.deleted_at&&r.data.operation==='payment'&&invoices.has(r.data.source_id)).map(record=>{
  const invoice=invoices.get(record.data.source_id)!;
  const amount=round((Array.isArray(record.data.entries)?record.data.entries:[]).filter((e:{account?:string})=>e.account==='1100 Clients').reduce((sum:number,e:{credit?:number;debit?:number})=>sum+Number(e.credit||0)-Number(e.debit||0),0));
  return {record,invoice,client:clients.get(invoice.client_id||'')||'',date:String(record.data.date||'').slice(0,10),reference:String(record.data.reference||''),amount};
 }).filter(r=>r.amount>0&&(!filters.projectId||r.invoice.project_id===filters.projectId)&&(!filters.invoiceId||r.invoice.id===filters.invoiceId)&&(!filters.from||r.date>=filters.from)&&(!filters.to||r.date<=filters.to)&&(!query||[r.client,r.reference,r.invoice.data.number,r.invoice.data.title].join(' ').toLocaleLowerCase('fr').includes(query))).sort((a,b)=>b.date.localeCompare(a.date)||a.record.id.localeCompare(b.record.id));
}
export function customerPaymentsCsv(rows:ReturnType<typeof customerPayments>){
 const cell=(v:unknown)=>'"'+String(v??'').replace(/^([\s]*[=+@-])/,"'$1").replaceAll('"','""')+'"';
 return '\ufeff'+[['Identifiant écriture','Client','Facture','Référence paiement','Reçu le','Montant enregistré'],...rows.map(r=>[r.record.id,r.client,r.invoice.data.number,r.reference,r.date,r.amount])].map(row=>row.map(cell).join(';')).join('\r\n');
}
