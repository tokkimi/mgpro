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
