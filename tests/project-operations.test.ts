import test from 'node:test';
import assert from 'node:assert/strict';
import {operationsFrom,operationTotals} from '../lib/project-operations';

test('project operations sanitize incomplete rows and calculate job exposure',()=>{
 const operations=operationsFrom({budget:[{id:'a',name:'Cuisine',budget:10000,actual:2500}],purchaseOrders:[{id:'b',supplier:'Bois',title:'Plancher',amount:1200,status:'Envoyé'},{id:'c',supplier:'X',title:'Annulé',amount:400,status:'Annulé'}],changeOrders:[{id:'d',title:'Mur',amount:700,days:1,status:'Approuvée'}],timesheets:[{id:'e',date:'2026-09-27',person:'Équipe',hours:7.5}]});
 assert.deepEqual(operationTotals(operations),{planned:10000,actual:2500,committed:1200,approvedChanges:700,hours:7.5,remaining:6300});
});
