import test from 'node:test';
import assert from 'node:assert/strict';
import {operationsFrom} from '../lib/project-operations';
import {purchaseOrderFigures,validatePurchaseOrderEdit} from '../lib/purchase-register';

test('purchase figures follow linked bills, applied credits and emitted payments without mixing projects or drafts',()=>{
 const ops=operationsFrom({purchaseOrders:[{id:'o',supplier:'Test',title:'Test',amount:115,taxRate:15,status:'Envoyé',lines:[{id:'l',description:'Test',quantity:2,price:50,received:1}]}],vendorBills:[
 {id:'b',orderId:'o',supplier:'Test',subtotal:60,tax:9,status:'À payer'},
 {id:'draft',orderId:'o',subtotal:1000,tax:150,status:'Brouillon'},
 {id:'other',orderId:'other',subtotal:500,tax:0,status:'À payer'}],vendorPayments:[{id:'p',billId:'b',amount:20,status:'Émis'},{id:'cancel',billId:'b',amount:100,status:'Annulé'},{id:'other',billId:'other',amount:30,status:'Émis'}],vendorCredits:[{id:'c',billId:'b',subtotal:10,tax:1.5,status:'Appliqué'}]});
 const before=JSON.stringify(ops);
 assert.deepEqual(purchaseOrderFigures(ops,'o'),{billed:69,paid:20,payable:37.5,unbilled:40,progress:50});
 assert.equal(JSON.stringify(ops),before);
 assert.equal(purchaseOrderFigures(ops,'missing'),null);
});

test('global editor protects invoiced orders and rejects invalid receptions and dates',()=>{
 const ops=operationsFrom({purchaseOrders:[{id:'o',supplier:'Test',title:'Test',amount:100,status:'Envoyé'}],vendorBills:[{id:'b',supplier:'Test',orderId:'o',subtotal:50,tax:0,status:'À payer'}]});
 const order=ops.purchaseOrders[0];
 assert.deepEqual(validatePurchaseOrderEdit(ops,order),[]);
 assert.match(validatePurchaseOrderEdit(ops,{...order,status:'Annulé'}).join(' '),/déjà des factures/);
 assert.match(validatePurchaseOrderEdit(ops,{...order,supplier:'Autre'}).join(' '),/fournisseur/);
 assert.match(validatePurchaseOrderEdit(ops,{...order,neededBy:'2026-02-30',lines:[{id:'l',description:'Test',quantity:1,unit:'u',price:10,received:2}]}).join(' '),/date.*réception/);
});
