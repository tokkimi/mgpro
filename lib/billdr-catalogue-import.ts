import {createHash} from 'node:crypto';
import {catalogueFrom,type CatalogueEntry,type CatalogueTab} from './catalogue';

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
