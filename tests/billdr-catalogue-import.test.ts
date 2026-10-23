import test from 'node:test';
import assert from 'node:assert/strict';
import {appendBilldrCatalogue,billdrCatalogueEntries,billdrTemplateEntry,exportedNumber} from '../lib/billdr-catalogue-import';
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

test('template migration preserves untitled priced tasks, category fees and explicit source rounding',()=>{
 const source={id:'source',name:'Test',description:'Détails',url:'https://app.billdr.co/templates/source/edit-v2',categories:[{id:'fee',index:0,name:'Gestion',displayedTotal:'$500'},{id:'work',index:3,name:'Travaux'}],tasks:[{sourceId:'line',index:5,title:'',description:'Consigne',quantity:'2',unit:'pi2',material:'$10',labour:'$15',markup:'10',costCode:'Code de coût',displayedTotal:'$55.00$27.50/pi2'}]};
 const entry=billdrTemplateEntry(source,555.08);
 assert.equal(entry.lines.length,3);
 assert.equal(entry.lines[0].category,'Travaux');
 assert.equal(entry.lines[0].notes,'Consigne');
 assert.equal(entry.lines[1].price,500);
 assert.equal(entry.lines[2].price,.08);
 assert.equal(entry.source?.taskCount,1);
 assert.equal(Math.round(entry.lines.reduce((sum,line)=>sum+lineSale(line),0)*100),55508);
 assert.throws(()=>billdrTemplateEntry(source,560));
 assert.throws(()=>billdrTemplateEntry(source,554.99));
 assert.throws(()=>billdrTemplateEntry({...source,tasks:[{...source.tasks[0],material:'$11'}]},555.08));
});
