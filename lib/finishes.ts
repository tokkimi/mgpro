// Finishes chosen per room from the MG Pro catalogue (2060 references, to source),
// and how each one is rendered in the 3D model.
export type FinishChoice={id:string;name:string;variant?:string;sub?:string};
export type CatalogueRow=[id:string,cat:string,sub:string,name:string,variant:string,application:string,unit:string];
export type SurfaceKey='floor'|'walls'|'ceiling'|'fronts'|'worktop'|'splash'|'bathWalls'|'taps'|'vanity';
export type Surface={key:SurfaceKey;label:string;subs:string[]};

export const SURFACES:Record<string,Surface[]>={
 common:[{key:'floor',label:'Sol',subs:['Parquets','Carrelages','Sols souples','Sols techniques']},{key:'walls',label:'Murs',subs:['Peintures','Finitions peinture','Enduits','Revêtements muraux','Panneaux décoratifs','Parements']},{key:'ceiling',label:'Plafond',subs:['Finitions']}],
 kitchen:[{key:'fronts',label:'Façades de cuisine',subs:['Façades']},{key:'worktop',label:'Plan de travail',subs:['Plans de travail']},{key:'splash',label:'Crédence',subs:['Crédences']},{key:'taps',label:'Robinetterie',subs:['Robinetterie']}],
 bath:[{key:'bathWalls',label:'Carrelage mural',subs:['Carrelage mural']},{key:'vanity',label:'Meuble vasque',subs:['Meubles']},{key:'taps',label:'Robinetterie',subs:['Robinetterie']}],
};
export function surfacesFor(furniture:string){return [...SURFACES.common,...(furniture==='kitchen'?SURFACES.kitchen:furniture==='bath'?SURFACES.bath:[])]}

const COLORS:[RegExp,string][]=[
 [/blanc pur|blanc brillant|blanc polaire/,'#f7f7f5'],[/blanc cass|ivoire|crème|creme/,'#efe8da'],[/blanc chaud/,'#f3ede2'],[/blanc mat|blanc/,'#f2f1ee'],
 [/greige/,'#cfc6b8'],[/lin\b|sable/,'#d9ccb4'],[/beige/,'#d8c8ad'],[/taupe/,'#9a8c7e'],[/gris perle|gris clair/,'#d3d3d0'],[/gris moyen|gris\b/,'#a3a39f'],[/anthracite|graphite/,'#3b3d3f'],[/noir/,'#202020'],
 [/bleu nuit|bleu marine/,'#23324a'],[/bleu/,'#7d93ad'],[/vert sauge|sauge/,'#a8b5a0'],[/vert/,'#5f7a62'],[/terracotta|terre cuite/,'#c06a4a'],[/ocre/,'#c99a4a'],[/rose/,'#e3c4bd'],[/jaune/,'#e8cf7a'],[/bordeaux/,'#6d2a32'],
];
const WOODS:[RegExp,string][]=[[/blanchi/,'#d8c6a8'],[/fumé|fume/,'#6e5038'],[/noyer/,'#5e4030'],[/huilé|huile/,'#a87a4c'],[/verni/,'#b58450'],[/frêne|frene|érable|erable|bouleau/,'#d2b48c'],[/hêtre|hetre/,'#c99a6a'],[/bambou/,'#c8a96a'],[/teck/,'#9c6b3c'],[/chêne|chene|bois|parquet|lames|bâtons|batons|hongrie|bateau/,'#b8895a']];
export const colorOf=(name:string,fallback:string)=>{const n=name.toLowerCase();return COLORS.find(([re])=>re.test(n))?.[1]||fallback};

export type Look={finish:'wood'|'tile'|'concrete'|'paint'|'brick'|'quartz'|'marble'|'wallTile'|'fabric';color:string;roughness:number;metal?:boolean};

/** Turns a catalogue designation into a 3D appearance (procedural, indicative until real PBR assets are sourced). */
export function lookOf(choice:FinishChoice|undefined,surface:SurfaceKey,fallback:Look):Look{
 if(!choice)return fallback;
 const n=`${choice.name} ${choice.sub||''}`.toLowerCase(),v=(choice.variant||'').toLowerCase();
 const rough=v==='mat'?.85:v==='satiné'||v==='satine'?.5:v==='premium'?.35:fallback.roughness;
 if(surface==='taps'){const c=/noir/.test(n)?'#1c1c1c':/laiton|or\b|doré|dore/.test(n)?'#b8965a':/bronze|cuivre/.test(n)?'#8a5a3a':/nickel|inox|brossé|brosse/.test(n)?'#b9bbbd':'#e9ecef';return {finish:'paint',color:c,roughness:/brossé|brosse|mat/.test(n)?.35:.1,metal:true}}
 const wood=WOODS.find(([re])=>re.test(n));
 if(/marbre|marble|calacatta|carrare/.test(n))return {finish:'marble',color:/noir/.test(n)?'#2b2b2e':'#eeece8',roughness:Math.min(rough,.25)};
 if(/granit|quartz|quartzite|composite|céramique|ceramique|pierre|ardoise|terrazzo|dekton/.test(n)&&!/grès|gres|carrel|faïence|faience/.test(n))return {finish:/ardoise/.test(n)?'concrete':'quartz',color:colorOf(n,/noir|ardoise|foncé|fonce/.test(n)?'#2e2e30':/pierre|bleue/.test(n)?'#8c8f8f':'#e9e6df'),roughness:Math.min(rough,.3)};
 if(/béton|beton|microciment|résine|resine|ciment(?! décor)/.test(n))return {finish:'concrete',color:colorOf(n,'#a8a7a2'),roughness:/poli|ciré|cire|époxy|epoxy/.test(n)?.3:rough};
 if(/grès|gres|carrel|faïence|faience|mosaïque|mosaique|hexagonal|ciment décor|zellige|métro|metro|tomette/.test(n)){const base=/bois/.test(n)?(wood?.[1]||'#b8895a'):/marbre/.test(n)?'#ece9e3':/béton|beton/.test(n)?'#a8a7a2':/pierre/.test(n)?'#b3aea5':colorOf(n,'#e4e0d8');return {finish:surface==='floor'?'tile':'wallTile',color:base,roughness:/mat/.test(n+v)?.6:.22}}
 if(wood||/parquet|lvt|stratifié|stratifie|vinyle/.test(n))return {finish:'wood',color:wood?.[1]||colorOf(n,'#b8895a'),roughness:/verni|brillant/.test(n)?.3:/huil/.test(n)?.55:.45};
 if(/brique|parement/.test(n))return {finish:'brick',color:colorOf(n,'#9b5a42'),roughness:.9};
 if(/moquette|textile|velours|bouclée|liège|liege|linoléum|linoleum|pvc|caoutchouc/.test(n))return {finish:'fabric',color:colorOf(n,'#9c968c'),roughness:.95};
 return {finish:surface==='floor'?'concrete':'paint',color:colorOf(n,fallback.color),roughness:rough};
}

/** Text for quotes and photorealistic renders. */
export function describeFinishes(finishes:Record<string,Record<string,FinishChoice>>|undefined,rooms:{id:string;name:string;furniture?:string}[]){
 if(!finishes)return '';
 return rooms.map(r=>{const f=finishes[r.id];if(!f)return '';const parts=surfacesFor(r.furniture||'none').filter(s=>f[s.key]).map(s=>`${s.label.toLowerCase()} : ${f[s.key].name}${f[s.key].variant?` (${f[s.key].variant})`:''} [${f[s.key].id}]`);return parts.length?`${r.name} — ${parts.join(', ')}`:''}).filter(Boolean).join(' ; ');
}
