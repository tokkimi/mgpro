import {round} from './model';
import type {ProjectOperations} from './project-operations';
import {billBalance,billTotal,orderBilling} from './vendor-finance';

/** Derived values only: orders, bills and payments retain their original records. */
export function purchaseOrderFigures(operations:ProjectOperations,orderId:string){
 const order=operations.purchaseOrders.find(o=>o.id===orderId);
 if(!order)return null;
 const bills=operations.vendorBills.filter(b=>b.orderId===orderId&&!['Brouillon','Annulée'].includes(b.status));
 const billIds=new Set(bills.map(b=>b.id));
 const billing=orderBilling(operations,order);
 const paid=round(operations.vendorPayments.filter(p=>billIds.has(p.billId)&&p.status==='Émis').reduce((s,p)=>s+p.amount,0));
 return {billed:round(bills.reduce((s,b)=>s+billTotal(b),0)),paid,payable:round(bills.reduce((s,b)=>s+billBalance(operations,b.id),0)),unbilled:billing.unbilled,progress:billing.value?Math.min(100,Math.round(billing.received/billing.value*100)):0};
}

/** Preserve existing accounting links when an order is edited from the global register. */
export function validatePurchaseOrderEdit(operations:ProjectOperations,order:ProjectOperations['purchaseOrders'][number]){
 const errors:string[]=[];
 if(!order.supplier?.trim()||!order.title?.trim())errors.push('Renseignez le fournisseur et l’objet.');
 if(!Number.isFinite(order.amount)||order.amount<0)errors.push('Le montant doit être positif ou nul.');
 if(order.neededBy){const date=new Date(order.neededBy+'T12:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==order.neededBy)errors.push('La date de livraison est invalide.');}
 for(const line of order.lines||[]){
  if(!line.description.trim())errors.push('Chaque ligne doit avoir une description.');
  if(!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isFinite(line.price)||line.price<0)errors.push('Vérifiez les quantités et les prix des lignes.');
  if(!Number.isFinite(line.received)||line.received<0||line.received>line.quantity)errors.push('Une réception doit rester entre zéro et la quantité commandée.');
 }
 const bills=operations.vendorBills.filter(b=>b.orderId===order.id&&!['Brouillon','Annulée'].includes(b.status));
 if(bills.length){
  if(order.status==='Annulé')errors.push('Ce bon a déjà des factures : annulez-les avant le bon.');
  if(bills.some(b=>b.supplier!==order.supplier))errors.push('Le fournisseur doit correspondre aux factures liées au bon.');
 }
 return [...new Set(errors)];
}
