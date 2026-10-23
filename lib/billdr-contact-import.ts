import {createHash} from 'node:crypto';
import type {Data,RecordItem} from './model';

export type BilldrContactRow=Record<string,string>;
export const contactNameKey=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[’']/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const unique=(values:string[])=>[...new Set(values.map(x=>x.trim()).filter(Boolean))];
const fingerprint=(row:BilldrContactRow)=>createHash('sha256').update(JSON.stringify(Object.entries(row).sort(([a],[b])=>a.localeCompare(b)))).digest('hex');
export function importUuid(key:string){const hex=createHash('sha256').update('mgpro:billdr:'+key).digest('hex').slice(0,32).split('');hex[12]='5';hex[16]=((parseInt(hex[16],16)&3)|8).toString(16);const id=hex.join('');return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`}

/** The user confirmed equal client names are one customer with several projects. Keep every source alias. */
export function billdrClientPlan(rows:BilldrContactRow[],existing:RecordItem[]){
 const groups=new Map<string,{row:BilldrContactRow;line:number}[]>();
 rows.forEach((row,index)=>{const key=contactNameKey(row.nom||'');if(!key)throw new Error(`Nom manquant à la ligne ${index+2}.`);groups.set(key,[...(groups.get(key)||[]),{row,line:index+2}])});
 return [...groups].map(([key,source])=>{
  const matches=existing.filter(r=>r.kind==='client'&&(r.data.billdr_import?.key===key||contactNameKey(String(r.data.name||''))===key));
  if(matches.length>1)throw new Error('Plusieurs fiches MG Pro correspondent à un client source. Résoudre ce conflit avant import.');
  const old=matches[0];
  const ordered=[...source].sort((a,b)=>(b.row['Créé le']||'').localeCompare(a.row['Créé le']||''));
  const emails=unique(ordered.map(({row})=>(row.Courriel||'').toLowerCase())),phones=unique(ordered.map(({row})=>row['Téléphone']||''));
  const companies=unique(ordered.map(({row})=>row["Nom de l'entreprise"]||''));
  const projectRefs=unique(source.flatMap(({row})=>(row['Projets associés']||'').split(/[,;\n]/)));
  const originalAliases=Array.isArray(old?.data.billdr_import?.aliases)?old!.data.billdr_import.aliases:[];
  const aliases=[...originalAliases];
  for(const {row,line} of source){const hash=fingerprint(row);if(!aliases.some(a=>a.fingerprint===hash))aliases.push({fingerprint:hash,line,fields:structuredClone(row)})}
  const data:Data={name:ordered[0].row.nom,email:emails.find(email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||'',phone:phones[0]||'',company:companies[0]||'',status:'Actif',language:ordered[0].row.Langue==='En'?'en-CA':'fr-CA',...old?.data,
   billdr_import:{...old?.data.billdr_import,source:'Billdr contacts export',key,aliases,emails:unique([...(old?.data.billdr_import?.emails||[]),...emails]),phones:unique([...(old?.data.billdr_import?.phones||[]),...phones]),companies:unique([...(old?.data.billdr_import?.companies||[]),...companies]),projectRefs:unique([...(old?.data.billdr_import?.projectRefs||[]),...projectRefs])}};
  return {id:old?.id||importUuid('client:'+key),old,data,sourceLines:source.map(x=>x.line),projectRefs};
 });
}
