import test from 'node:test';
import assert from 'node:assert/strict';
import {groupsOf,pricedForQuote,pricesFrom,pricesFromCsv,pricesToCsv,unitPrice,swatchStyle,type MaterialRow} from '../lib/material-library';
import interior from '../lib/finish-catalogue.json';
import exterior from '../lib/exterior-catalogue.json';

const rows=[...(interior as unknown as MaterialRow[]),...(exterior as unknown as MaterialRow[])];

test('both inventories are loaded without collisions',()=>{
 assert.equal(rows.length,2060+377);
 assert.equal(new Set(rows.map(r=>r[0])).size,rows.length);
 const groups=groupsOf(rows);
 assert.ok(groups.some(g=>g.name==='Piscines et bassins'&&g.universe==='exterieur'));
 assert.equal(groups.reduce((s,g)=>s+g.count,0),rows.length);
 for(const r of rows.slice(0,50))assert.ok(swatchStyle(r).background.length>5);
});

test('prices are sanitised and the quote price includes installation',()=>{
 const p=pricesFrom({'MGP-00001':{buy:'12.5',sell:20,labour:15,supplier:'Rona'},'BAD':{sell:1},'MGP-00002':{sell:0}});
 assert.deepEqual(Object.keys(p),['MGP-00001']);
 assert.equal(unitPrice(p['MGP-00001']),35);
 assert.equal(unitPrice({buy:10}),10);
});

test('CSV export/import round-trips prices (Excel French format)',()=>{
 const sample=rows.slice(0,3);
 const csv=pricesToCsv(sample,{'MGP-00001':{sell:22.5,supplier:'Canac; Laval'}});
 const edited=csv.replace('MGP-00002;Murs;Peintures;blanc chaud;premium;m²;;;;;;','MGP-00002;Murs;Peintures;blanc chaud;premium;m²;10;18,5;12;10;BMR;X1');
 const {prices,updated}=pricesFromCsv(edited,{});
 assert.equal(updated,2);
 assert.equal(prices['MGP-00001'].supplier,'Canac; Laval');
 assert.equal(prices['MGP-00002'].sell,18.5);
 assert.equal(unitPrice(prices['MGP-00002']),30.5);
});

test('finishes chosen on the plan come first in the quote catalogue',()=>{
 const prices=pricesFrom({'MGP-00001':{sell:20},'EXT-00001':{sell:30000},'MGP-00500':{sell:90,labour:40}});
 const out=pricedForQuote(rows,prices,[{id:'MGP-00500',where:'Cuisine — sol'}]);
 assert.equal(out.length,3);
 assert.match(out[0].name,/^\[CHOISI Cuisine — sol\]/);
 assert.equal(out[0].price,130);
});
