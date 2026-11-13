// MG Pro materials library: interior catalogue (MGP-, 2060 refs) + exteriors/pools/extensions (EXT-, 377 refs).
// Both inventories are generic references "à sourcer": no invented prices, no verified-manufacturer claims.
// Prices are entered by MG Pro (settings.material_prices) and feed the AI quote.
import {lookOf,type CatalogueRow,type Look,type SurfaceKey} from './finishes';

export type MaterialRow=CatalogueRow;
export type MaterialPrice={buy?:number;sell?:number;labour?:number;waste?:number;supplier?:string;ref?:string;updated?:string};
export type MaterialPrices=Record<string,MaterialPrice>;
export type Universe='interieur'|'exterieur';
export type Group={name:string;universe:Universe;photo:string;count:number;subs:{name:string;count:number}[]};

let all:Promise<MaterialRow[]>|null=null;
/** Lazy-loads both inventories (≈200 KB) only when the library or the finishes panel opens. */
export const loadMaterials=()=>all??=Promise.all([import('./finish-catalogue.json'),import('./exterior-catalogue.json')]).then(([a,b])=>[...(a.default as unknown as MaterialRow[]),...(b.default as unknown as MaterialRow[])]);

export const universeOf=(row:MaterialRow):Universe=>row[0].startsWith('EXT-')?'exterieur':'interieur';

const PHOTOS:Record<string,string>={
 'Murs':'chambre','Sols':'salon','Plafonds':'extension','Cuisines':'cuisine','Salles de bain':'salle-de-bain','Menuiseries':'veranda','Garages':'garage','Terrasses':'terrasse','Piscines':'piscine','Façades':'facade','Escaliers':'exterieur','Éclairage':'ext-eclairage','Techniques':'ext-equipement','Extérieurs':'pergola',
 'Piscines et bassins':'ext-piscine','Terrasses et plages':'ext-terrasse','Vérandas et jardins d’hiver':'ext-veranda','Extensions et agrandissements':'ext-extension','Pergolas, auvents et abris':'ext-pergola','Façades et bardages':'ext-facade','Toitures et étanchéité':'ext-toiture','Garages et carports':'ext-garage','Clôtures, portails et accès':'ext-cloture','Jardins et aménagements paysagers':'ext-jardin','Éclairage et équipements extérieurs':'ext-eclairage',
};
export const photoOf=(group:string)=>`/catalogue/${PHOTOS[group]||'salon'}.webp`;

export function groupsOf(rows:MaterialRow[]):Group[]{
 const map=new Map<string,Group>();
 for(const r of rows){let g=map.get(r[1]);if(!g){g={name:r[1],universe:universeOf(r),photo:photoOf(r[1]),count:0,subs:[]};map.set(r[1],g)}g.count++;const s=g.subs.find(x=>x.name===r[2]);if(s)s.count++;else g.subs.push({name:r[2],count:1})}
 return [...map.values()];
}

export const label=(r:MaterialRow)=>`${r[3]}${r[4]?` · ${r[4]}`:''}`;
const norm=(s:string)=>s.toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g,'');
export const matches=(r:MaterialRow,q:string)=>!q||norm(`${r[0]} ${r[1]} ${r[2]} ${r[3]} ${r[4]}`).includes(norm(q));

/** Surface material (rendered as a swatch) vs. equipment / object (rendered as an icon tile). */
export function isSurface(r:MaterialRow){
 if(r[5]==='model_3d'||r[5]==='parametric_3d')return false;
 if(r[5]==='material_pbr')return true;
 return r[6]==='m²'||r[6]==='ml';
}

const EXTRA:[RegExp,string][]=[[/liner bleu|bleu piscine|bleu clair|turquoise|lagon|caraibes|caraïbes/,'#4aa3c8'],[/sable/,'#d9c9a3'],[/zinc/,'#8d9399'],[/ardoise/,'#4a4f55'],[/tuile|terre cuite|terracotta/,'#b5563b'],[/gazon|pelouse|végétal|vegetal/,'#5f8a3c'],[/gravier|graviers|stabilisé|stabilise/,'#bcb09a'],[/pavé|pave|dalle/,'#9d978d'],[/epdm|membrane|bitume|asphalte|enrobé|enrobe/,'#2f3133'],[/acier|alu|aluminium|inox/,'#9aa0a6'],[/cuivre/,'#a8643c'],[/corten|rouille/,'#8a4b2a'],[/composite/,'#8b6a4c'],[/travertin/,'#d8c7a5'],[/pierre/,'#b5ab99'],[/verre|vitr/,'#a9c6cf']];

function surfaceKey(r:MaterialRow):SurfaceKey{const s=norm(`${r[1]} ${r[2]}`);return /sol|parquet|carrel|terrasse|margelle|allee|pave|garage/.test(s)?'floor':/plan de travail/.test(s)?'worktop':/robinet/.test(s)?'taps':/plafond/.test(s)?'ceiling':'walls'}
const shade=(hex:string,k:number)=>{const n=parseInt(hex.slice(1),16);const f=(c:number)=>Math.max(0,Math.min(255,Math.round(c*k)));return `rgb(${f(n>>16)},${f((n>>8)&255)},${f(n&255)})`};

/** CSS background imitating the material (procedural, indicative until real PBR assets are sourced). */
export function swatchStyle(r:MaterialRow):{background:string;backgroundSize?:string}{
 const n=norm(`${r[3]} ${r[2]}`);
 const base:Look={finish:'paint',color:'#cfc8bc',roughness:.6};
 let look=lookOf({id:r[0],name:r[3],variant:r[4],sub:r[2]},surfaceKey(r),base);
 const extra=EXTRA.find(([re])=>re.test(n));
 if(extra&&look.color===base.color)look={...look,color:extra[1]};
 if(/liner|mosaique|piscine|bassin/.test(n)&&/bleu|liner/.test(n))look={finish:'wallTile',color:extra?.[1]||'#4aa3c8',roughness:.2};
 const c=look.color,d=shade(c,.82),l=shade(c,1.12);
 const gloss=look.roughness<.4?`linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,0) 45%),`:'';
 if(look.metal)return {background:`linear-gradient(135deg,${l},${d} 45%,${l} 60%,${d})`};
 switch(look.finish){
  case 'wood':return {background:`${gloss}repeating-linear-gradient(90deg,transparent 0 23px,rgba(0,0,0,.18) 23px 24px),repeating-linear-gradient(0deg,${c} 0 6px,${d} 6px 7px,${l} 7px 11px,${c} 11px 16px)`};
  case 'tile':return {background:`${gloss}linear-gradient(90deg,rgba(0,0,0,.16) 1px,transparent 1px),linear-gradient(0deg,rgba(0,0,0,.16) 1px,transparent 1px),radial-gradient(circle at 30% 30%,${l},${c})`,backgroundSize:'50% 50%,50% 50%,100% 100%'};
  case 'wallTile':return {background:`${gloss}linear-gradient(90deg,rgba(255,255,255,.55) 1px,transparent 1px),linear-gradient(0deg,rgba(255,255,255,.55) 1px,transparent 1px),linear-gradient(160deg,${l},${c})`,backgroundSize:'25% 25%,25% 25%,100% 100%'};
  case 'marble':return {background:`${gloss}linear-gradient(115deg,transparent 40%,${shade(c,.7)} 41%,transparent 43%),linear-gradient(60deg,transparent 62%,${shade(c,.78)} 63%,transparent 64%),radial-gradient(circle at 70% 20%,${l},${c})`};
  case 'quartz':return {background:`${gloss}radial-gradient(${d} 1px,transparent 1.5px) 0 0/7px 7px,radial-gradient(${l} 1px,transparent 1.5px) 3px 4px/9px 9px,${c}`};
  case 'concrete':return {background:`radial-gradient(circle at 20% 30%,${l},transparent 40%),radial-gradient(circle at 80% 70%,${d},transparent 45%),${c}`};
  case 'brick':return {background:`linear-gradient(0deg,#ddd3c4 2px,transparent 2px),linear-gradient(90deg,#ddd3c4 2px,transparent 2px),${c}`,backgroundSize:'100% 14px,28px 14px,auto'};
  case 'fabric':return {background:`repeating-linear-gradient(45deg,${d} 0 1px,transparent 1px 4px),repeating-linear-gradient(-45deg,${l} 0 1px,transparent 1px 4px),${c}`};
  default:return {background:`${gloss}linear-gradient(160deg,${l},${c} 60%,${d})`};
 }
}

export type IconKey='bath'|'shower'|'toilet'|'sink'|'tap'|'light'|'door'|'window'|'blinds'|'fence'|'pool'|'appliance'|'cabinet'|'stairs'|'car'|'home'|'sun'|'plug'|'tree'|'box';
export function iconOf(r:MaterialRow):IconKey{
 const s=norm(`${r[2]} ${r[3]}`);
 return /baignoire|spa|bain/.test(s)?'bath':/douche/.test(s)?'shower':/wc|toilette/.test(s)?'toilet':/vasque|evier|lavabo/.test(s)?'sink':/robinet|mitigeur/.test(s)?'tap':/eclairage|lumin|spot|borne|applique|led|lampe/.test(s)?'light':/porte|portail|portillon/.test(s)?'door':/fenetre|baie|vitrage|veranda|verriere/.test(s)?'window':/volet|store|occult|brise/.test(s)?'blinds':/cloture|garde-corps|grillage/.test(s)?'fence':/piscine|bassin|pompe|filtr|nage|chauffage piscine/.test(s)?'pool':/electromenager|four|plaque|hotte|refriger|lave|frigo/.test(s)?'appliance':/module|meuble|ilot|rangement|facade/.test(s)?'cabinet':/escalier|marche/.test(s)?'stairs':/garage|carport/.test(s)?'car':/pergola|abri|auvent|extension|surelevation|toiture/.test(s)?'home':/solaire|soleil/.test(s)?'sun':/technique|raccord|electri|prise/.test(s)?'plug':/jardin|vegetal|jardiniere|paysag|arbre/.test(s)?'tree':'box';
}

/** Unit price used in quotes: sale price (or purchase price) plus installation. */
export function unitPrice(p:MaterialPrice|undefined){if(!p)return 0;const supply=Number(p.sell)||Number(p.buy)||0;return Math.round((supply+(Number(p.labour)||0))*100)/100}
export const isPriced=(p:MaterialPrice|undefined)=>unitPrice(p)>0;

export function pricesFrom(value:unknown):MaterialPrices{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const out:MaterialPrices={};const num=(x:unknown)=>{const v=Number(x);return Number.isFinite(v)&&v>0?Math.round(v*100)/100:undefined};
 for(const [id,raw] of Object.entries(value as Record<string,any>)){
  if(!/^(MGP|EXT)-\d{5}$/.test(id)||!raw||typeof raw!=='object')continue;
  const p:MaterialPrice={buy:num(raw.buy),sell:num(raw.sell),labour:num(raw.labour),waste:num(raw.waste),supplier:raw.supplier?String(raw.supplier).slice(0,120):undefined,ref:raw.ref?String(raw.ref).slice(0,120):undefined,updated:raw.updated?String(raw.updated).slice(0,30):undefined};
  for(const k of Object.keys(p) as (keyof MaterialPrice)[])if(p[k]===undefined)delete p[k];
  if(Object.keys(p).some(k=>k!=='updated'))out[id]=p;
 }
 return out;
}

const CSV_HEAD=['Référence','Catégorie','Sous-catégorie','Désignation','Variante','Unité','Prix achat','Prix vente','Pose','Pertes %','Fournisseur','Réf. fournisseur'];
const cell=(v:unknown)=>{const s=v==null?'':String(v);return /[;"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
export function pricesToCsv(rows:MaterialRow[],prices:MaterialPrices){
 return '﻿'+[CSV_HEAD,...rows.map(r=>{const p=prices[r[0]]||{};return [r[0],r[1],r[2],r[3],r[4],r[6],p.buy??'',p.sell??'',p.labour??'',p.waste??'',p.supplier??'',p.ref??'']})].map(l=>l.map(cell).join(';')).join('\n');
}
function parseCsv(text:string){const out:string[][]=[];let row:string[]=[],cur='',q=false;const t=text.replace(/^﻿/,'');const sep=(t.split('\n')[0].match(/;/g)||[]).length>=(t.split('\n')[0].match(/,/g)||[]).length?';':',';
 for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}else if(ch==='"')q=true;else if(ch===sep){row.push(cur);cur=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cur);out.push(row);row=[];cur=''}else cur+=ch}
 if(cur||row.length){row.push(cur);out.push(row)}return out}
/** Imports prices from the CSV produced by pricesToCsv (Excel-friendly, ";" separated, decimal comma accepted). */
export function pricesFromCsv(text:string,current:MaterialPrices):{prices:MaterialPrices;updated:number}{
 const rows=parseCsv(text);const head=rows.shift()?.map(h=>norm(h.trim()))||[];const col=(name:string)=>head.indexOf(norm(name));
 const id=col('Référence');if(id<0)throw new Error('Colonne « Référence » introuvable : utilisez le fichier exporté depuis la bibliothèque.');
 const num=(s:string|undefined)=>{if(s==null||!s.trim())return undefined;const v=Number(s.replace(/\s| |\$|€/g,'').replace(',','.'));return Number.isFinite(v)&&v>=0?v:undefined};
 const next={...current};let updated=0;const now=new Date().toISOString();
 for(const r of rows){const key=(r[id]||'').trim();if(!/^(MGP|EXT)-\d{5}$/.test(key))continue;
  const p={buy:num(r[col('Prix achat')]),sell:num(r[col('Prix vente')]),labour:num(r[col('Pose')]),waste:num(r[col('Pertes %')]),supplier:(r[col('Fournisseur')]||'').trim()||undefined,ref:(r[col('Réf. fournisseur')]||'').trim()||undefined,updated:now};
  const clean=pricesFrom({[key]:p})[key];if(clean){next[key]=clean;updated++}else if(next[key]){delete next[key];updated++}}
 return {prices:next,updated};
}

export type PricedMaterial={name:string;category:string;unit:string;price:number;material?:number;labour?:number;description?:string};
/** Priced references for the AI quote: finishes chosen on the plan first, then the rest of the priced library. */
export function pricedForQuote(rows:MaterialRow[],prices:MaterialPrices,chosen:{id:string;where:string}[]=[],limit=180):PricedMaterial[]{
 const byId=new Map(rows.map(r=>[r[0],r]));const seen=new Set<string>();const out:PricedMaterial[]=[];
 const add=(id:string,where?:string)=>{const r=byId.get(id),p=prices[id];if(!r||!isPriced(p)||out.length>=limit)return;
  const key=id+(where||'');if(seen.has(key))return;seen.add(key);
  out.push({name:`${where?`[CHOISI ${where}] `:''}${r[2]} · ${label(r)} (${id})`,category:r[1],unit:r[6],price:unitPrice(p),material:Number(p!.sell)||Number(p!.buy)||undefined,labour:Number(p!.labour)||undefined,description:[p!.waste?`pertes ${p!.waste} %`:'',p!.supplier?`fournisseur ${p!.supplier}`:'',p!.ref?`réf. ${p!.ref}`:''].filter(Boolean).join(', ')||undefined})};
 for(const c of chosen)add(c.id,c.where);
 for(const id of Object.keys(prices))if(!chosen.some(c=>c.id===id))add(id);
 return out;
}
