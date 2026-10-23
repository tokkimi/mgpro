import test from 'node:test';
import assert from 'node:assert/strict';
import type {RecordItem} from '../lib/model';
import {invoiceRegister,invoiceRegisterSummary,invoiceRegisterCsv} from '../lib/invoice-register';
const rec=(id:string,kind:any,data:any):RecordItem=>({id,kind,data,client_id:'c',project_id:'p',version:1,created_at:'2026-10-01',updated_at:'2026-10-01'});
const filters={query:'',projectId:'',status:'',from:'',to:''};
test('invoice register filters by derived payment state and uses exact document taxes',()=>{
 const records=[rec('c','client',{name:'Client'}),rec('p','project',{title:'Cuisine'}),rec('i','invoice',{number:'F1',status:'Émise',date:'2026-10-01',lines:[{quantity:1,price:100}],paid:50}),rec('draft','invoice',{status:'Brouillon',lines:[{quantity:1,price:1000}]}),rec('cancel','invoice',{status:'Annulée',lines:[{quantity:1,price:2000}]}),rec('deleted','invoice',{deleted_at:'2026-10-02',status:'Émise'})];
 const rows=invoiceRegister(records,filters,'2026-10-23');
 assert.equal(rows.length,3);
 assert.deepEqual(invoiceRegisterSummary(rows),{billed:114.98,paid:50,balance:64.98});
 const partial=invoiceRegister(records,{...filters,status:'Partiellement payée',query:'cuisine',from:'2026-10-01',to:'2026-10-01'},'2026-10-23');
 assert.equal(partial.length,1);assert.equal(partial[0].client,'Client');
 assert.equal(invoiceRegister(records,{...filters,projectId:'other'},'2026-10-23').length,0);
});
test('invoice register export neutralizes formulas and preserves quotes',()=>{
 const csv=invoiceRegisterCsv(invoiceRegister([rec('i','invoice',{title:'=DANGEROUS',number:'"F1"',status:'Brouillon'})],filters,'2026-10-23'));
 assert.ok(csv.includes("'=DANGEROUS"));assert.ok(csv.includes('""F1""'));assert.ok(csv.startsWith('\ufeff'));
});

test('customer payments use explicit journals, excluding supplier payments, credits and issue entries',async()=>{
 const {customerPayments,customerPaymentsCsv}=await import('../lib/invoice-register');
 const invoice=rec('i','invoice',{number:'F-1',status:'Émise',paid:999});
 const entry=(id:string,operation:string,source_id:string,amount:number)=>rec(id,'journal',{operation,source_id,date:'2026-10-20',reference:'=REF',entries:[{account:'1000 Banque',debit:amount,credit:0},{account:'1100 Clients',debit:0,credit:amount}]});
 const records=[invoice,rec('c','client',{name:'Client'}),entry('pay1','payment','i',20.10),entry('pay2','payment','i',30.20),entry('issue','issue','i',100),entry('supplier','pay_expense','expense',100),entry('orphan','payment','missing',100)];
 const filters={query:'',invoiceId:'',projectId:'',from:'',to:''};
 const rows=customerPayments(records,filters);
 assert.deepEqual(rows.map(r=>r.amount),[20.10,30.20]);
 assert.equal(rows[0].client,'Client');
 assert.equal(customerPayments(records,{...filters,from:'2026-10-21'}).length,0);
 assert.equal(customerPayments(records,{...filters,invoiceId:'other'}).length,0);
 assert.ok(customerPaymentsCsv(rows).includes("'=REF"));
});
