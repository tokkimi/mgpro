import {createHash} from 'node:crypto';
import {catalogueFrom,type CatalogueEntry,type CatalogueTab} from './catalogue';
import {lineSale} from './pricing';
import type {Data} from './model';

type SourceRow=Record<string,string>;
export type CatalogueExports={tasks:SourceRow[];categories:SourceRow[];codes:SourceRow[]};
const importId=(scope:string)=>{const hex=createHash('sha256').update('billdr:catalogue:'+scope).digest('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`};

/** CSV exports contain unformatted numbers; reject a malformed value instead of silently changing a price. */
export function exportedNumber(value:string|undefined){
 if(value==null||!value.trim())return 0;
 const number=Number(value);
 if(!Number.isFinite(number)||number<0)throw new Error('Valeur numérique Billdr invalide.');
 return number;
}

export function billdrCatalogueEntries(exports:CatalogueExports):CatalogueEntry[]{
 const entries:CatalogueEntry[]=[];
 for(const [family,rows,tab] of [['tasks',exports.tasks,'Mon catalogue'],['categories',exports.categories,'Mes catégories'],['codes',exports.codes,'Codes de coût']] as const){
  rows.forEach((row,index)=>{
   const name=(row.Nom||row.nom||'').trim();
   if(!name)throw new Error(`Ligne ${index+2} sans nom dans ${family}.`);
   // Source line distinguishes legitimate duplicate labels and remains stable on replay of the same export.
   const source={system:'billdr',family,line:index+2,fields:structuredClone(row)};
   const common={id:importId(`${family}:${index+2}:${JSON.stringify(row)}`),tab:tab as CatalogueTab,name,source};
   const entry=family==='tasks'?{
    ...common,description:row.Description||'',unit:row['Unité']||'unité',category:row['Catégorie']||'',
    material:exportedNumber(row['Coût unitaire de matériel']),labour:exportedNumber(row["Coût unitaire de main d'oeuvre"]),
    markup:exportedNumber(row['Pourcentage de majoration']),quantity:row['Quantité']?.trim()?exportedNumber(row['Quantité']):1,
    hourlyRate:exportedNumber(row["Taux horaire de main d'oeuvre"]),code:row['Code du code de coût']||''
   }:family==='categories'?{
    ...common,markup:exportedNumber(row['Pourcentage de majoration par défaut']),
    hourlyRate:exportedNumber(row["Taux horaire de main d'oeuvre par défaut"]),code:row['Code du code de coût']||''
   }:{...common,code:row.Code||'',division:row.Division||'',description:row.Description||''};
   entries.push(catalogueFrom([entry])[0]);
  });
 }
 return entries;
}

/** Add-only migration: keep all user changes and pre-existing MG Pro tools/data on repeated imports. */
export function appendBilldrCatalogue(existing:CatalogueEntry[],incoming:CatalogueEntry[]){
 const ids=new Set(existing.map(entry=>entry.id));
 const additions=incoming.filter(entry=>!ids.has(entry.id));
 if(new Set(incoming.map(entry=>entry.id)).size!==incoming.length)throw new Error('Identifiants source dupliqués.');
 return {entries:[...existing,...additions],additions};
}

type TemplateCategory={id:string;index:number|null;name:string;displayedTotal?:string};
type TemplateTask={sourceId:string;index:number;title:string;description:string;quantity:string;unit:string;material:string;labour:string;markup:string;costCode:string;displayedTotal:string};
export type BilldrTemplateSource={id:string;name:string;description:string;url:string;categories:TemplateCategory[];tasks:TemplateTask[]};
function displayedNumber(value:string){
 const cleaned=value.replace(/[$,\s]/g,'');
 if(!/^\d+(?:\.\d+)?$/.test(cleaned))throw new Error('Montant affiché Billdr invalide.');
 return exportedNumber(cleaned);
}
const cents=(value:number)=>Math.round((value+Number.EPSILON)*100)/100||0;

/** Check task totals to the cent (Billdr rounds sale, MG Pro rounds base and markup), then retain fees and rounding. */
export function billdrTemplateEntry(source:BilldrTemplateSource,subtotal:number):CatalogueEntry{
 if(!source.name?.trim()||!source.tasks.length||!Number.isFinite(subtotal)||subtotal<0)throw new Error('Gabarit Billdr incomplet.');
 const categories=[...new Map(source.categories.filter(c=>Number.isFinite(c.index)).sort((a,b)=>Number(a.index)-Number(b.index)).map(c=>[c.id,c])).values()].sort((a,b)=>Number(a.index)-Number(b.index));
 const lines:Data[]=source.tasks.map(task=>{
  const category=categories.filter(c=>Number(c.index)<task.index).at(-1);
  const material=displayedNumber(task.material),labour=displayedNumber(task.labour);
  const line:Data={description:task.title.trim()||`${category?.name||'Prestation'} — prestation sans titre`,notes:task.description,quantity:displayedNumber(task.quantity),unit:task.unit||'unité',price:material+labour,pricing_mode:'split',material_cost:material,labour_cost:labour,margin:displayedNumber(task.markup),category:category?.name||'',cost_code:task.costCode==='Code de coût'?'':task.costCode,billdr_source_id:task.sourceId};
  const observed=task.displayedTotal.match(/\$[\d,.]+/);
  if(!observed||Math.abs(lineSale(line)-displayedNumber(observed[0]))>.011)throw new Error(`Le total de ${task.sourceId} diffère du relevé Billdr (${lineSale(line)} / ${observed?.[0]}).`);
  return line;
 });
 for(const category of categories){
  if(lines.some(line=>line.category===category.name)||!category.displayedTotal)continue;
  const fee=displayedNumber(category.displayedTotal);
  if(fee)lines.push({description:category.name,category:category.name,quantity:1,unit:'forfait',price:fee,billdr_category_fee:category.id});
 }
 const rounding=cents(subtotal-lines.reduce((sum,line)=>sum+lineSale(line),0));
 // Larger or negative discrepancies require further source inspection, never a fabricated balancing price.
 if(rounding<0||rounding>.5)throw new Error('Écart de total Billdr à contrôler avant import.');
 if(rounding)lines.push({description:'Arrondi du gabarit Billdr',category:'Ajustement d’arrondi',quantity:1,unit:'forfait',price:rounding,billdr_rounding:true});
 if(cents(lines.reduce((sum,line)=>sum+lineSale(line),0))!==cents(subtotal))throw new Error('Rapprochement du gabarit incomplet.');
 return catalogueFrom([{id:importId('template:'+source.id),tab:'Mes soumissions',name:source.name,description:source.description,lines,source:{system:'billdr',family:'templates',sourceId:source.id,url:source.url,taskCount:source.tasks.length,subtotal,rounding,categories,fields:structuredClone(source)}}])[0];
}
