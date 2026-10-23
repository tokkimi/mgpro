import test from 'node:test';
import assert from 'node:assert/strict';
import {appendBilldrCatalogue,billdrCatalogueEntries,exportedNumber} from '../lib/billdr-catalogue-import';
import {catalogueFrom,catalogueLines,exportCatalogue,importCatalogue} from '../lib/catalogue';
import {lineSale} from '../lib/pricing';

test('Billdr task costs, zero quantities and provenance survive the whole catalogue/quote path',()=>{
 const rows:Record<string,string>[]=[{Nom:'Pose',Description:'Consigne complète',Unité:'pi2',Quantité:'2.5','Coût unitaire de matériel':'12.3',"Coût unitaire de main d'oeuvre":'7.7','Prix du matériel':'12.3','Pourcentage de majoration':'10'},{Nom:'Option',Quantité:'0','Coût unitaire de matériel':'100'}];
 const entries=billdrCatalogueEntries({tasks:rows,categories:[],codes:[]});
 const restored=importCatalogue(exportCatalogue(entries));
 assert.deepEqual(restored,entries);
 assert.equal(lineSale(catalogueLines(restored[0])[0]),55);
 assert.equal(catalogueLines(restored[0])[0].notes,'Consigne complète');
 assert.equal(lineSale(catalogueLines(restored[1])[0]),0);
 assert.equal(restored[0].source?.fields['Prix du matériel'],'12.3');
});

test('duplicate Billdr labels remain distinct and repeated imports preserve local edits',()=>{
 const incoming=billdrCatalogueEntries({tasks:[],categories:[{Nom:'Mur'},{Nom:'Mur'}],codes:[{nom:'Code sans numéro',Code:''}]});
 assert.equal(new Set(incoming.map(x=>x.id)).size,3);
 const original=catalogueFrom([{id:'local',tab:'Produits',name:'Notre outil'}]);
 const first=appendBilldrCatalogue(original,incoming);
 first.entries[1].name='Adapté dans MG Pro';
 const second=appendBilldrCatalogue(first.entries,incoming);
 assert.equal(second.additions.length,0);
 assert.equal(second.entries[1].name,'Adapté dans MG Pro');
 assert.deepEqual(second.entries[0],original[0]);
});

test('malformed source prices stop migration',()=>{
 assert.throws(()=>exportedNumber('12,50'));
 assert.throws(()=>exportedNumber('-1'));
 assert.throws(()=>billdrCatalogueEntries({tasks:[{Nom:'A','Quantité':'NaN'}],categories:[],codes:[]}));
 assert.equal(exportedNumber(''),0);
});
