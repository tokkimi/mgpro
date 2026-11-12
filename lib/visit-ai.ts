import {planSchema,palettes,type Plan,type PlanRoom,type PlanElement} from './plan';

// ───────────────────────── Measurement from photos / video frames ─────────────────────────

export type MeasureResult={
 length:number;width:number;height:number;unit:'m';
 confidence:'faible'|'moyenne'|'bonne';margin:number;
 doors:number;windows:number;
 name?:string;features:string[];references:string[];observations:string;advice:string;
};

export const MEASURE_SYSTEM=`Tu es un estimateur en rénovation résidentielle au Québec qui fait des relevés à partir de photos.
On te donne des photos (ou des images extraites d’une vidéo) d’UNE pièce. Estime ses dimensions intérieures en mètres :
- length = la plus grande dimension au sol, width = la plus petite, height = hauteur sous plafond.
- Raisonne avec des objets de taille standard visibles : porte intérieure 0,81 × 2,03 m (32 × 80 po), porte d’entrée 0,91 m, prise électrique à ~0,30 m du sol, interrupteur à ~1,20 m, comptoir de cuisine 0,91 m de haut et 0,64 m de profondeur, armoires hautes 0,76 m, toilette ~0,70 m de profondeur, baignoire 1,52 m, tuiles courantes 30 × 60 cm, lames de plancher ~12-19 cm, plafond résidentiel courant 2,44 m (8 pi) ou 2,74 m (9 pi), lit double 1,37 × 1,91 m, lit queen 1,52 × 2,03 m.
- Si l’utilisateur donne une dimension de référence mesurée, elle prime sur tout le reste : sers-t’en comme étalon.
- Croise toutes les images ; compte les portes et fenêtres de la pièce.
- Sois honnête sur la précision : margin = marge d’erreur estimée en % (typiquement 5 à 20).
Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"length":number,"width":number,"height":number,"unit":"m","confidence":"faible"|"moyenne"|"bonne","margin":number,"doors":number,"windows":number,"name":string,"features":[string],"references":[string],"observations":string,"advice":string}
- name : type de pièce reconnu (ex. « Cuisine », « Salle de bain », « Chambre »).
- features : éléments utiles au plan (ex. « îlot central », « escalier », « baignoire », « comptoir en L »).
- references : objets utilisés comme étalon.
- observations : état des lieux utile au devis (revêtements, dégâts visibles, matériaux), 2 phrases max.
- advice : ce qu’il faudrait mesurer au ruban pour confirmer, 1 phrase.`;

export function measureUserText({room,reference,source,count}:{room?:string;reference?:string;source:'photo'|'video';count:number}){
 return [
  `${count} ${source==='video'?'images extraites d’une vidéo de visite':'photo(s)'} de la pièce${room?` « ${room} »`:''}.`,
  reference?`Dimension de référence mesurée sur place : ${reference}`:'Aucune dimension de référence mesurée : base-toi sur les objets standard.',
  'Donne le JSON demandé.'
 ].join('\n');
}

const num=(v:unknown,min:number,max:number)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null};
const r2=(n:number)=>Math.round(n*100)/100;

export function normalizeMeasure(raw:any):MeasureResult|null{
 if(!raw||typeof raw!=='object')return null;
 let length=num(raw.length,.5,60),width=num(raw.width,.5,60);const height=num(raw.height,1.5,12)??2.44;
 if(length===null||width===null)return null;
 if(width>length)[length,width]=[width,length];
 const confidence=['faible','moyenne','bonne'].includes(raw.confidence)?raw.confidence:'moyenne';
 const list=(v:unknown)=>Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>x.slice(0,120)).slice(0,10):[];
 return {length:r2(length),width:r2(width),height:r2(height),unit:'m',confidence,margin:Math.round(num(raw.margin,1,60)??15),doors:Math.round(num(raw.doors,0,20)??0),windows:Math.round(num(raw.windows,0,30)??0),name:typeof raw.name==='string'?raw.name.slice(0,80):undefined,features:list(raw.features),references:list(raw.references),observations:String(raw.observations||'').slice(0,600),advice:String(raw.advice||'').slice(0,300)};
}

// ───────────────────────── Plan generation ─────────────────────────

export type InRoom={name?:string;length?:number;width?:number;height?:number;unit?:string;notes?:string;features?:any};
type Style=keyof typeof palettes;
const toM=(v:unknown,unit?:string)=>{const n=Number(v)||0;return unit==='m'?n:n*.3048};

/** Rooms in metres, with sensible defaults when a dimension is missing. */
export function metricRooms(rooms:InRoom[]){
 const list=rooms.length?rooms:[{name:'Pièce principale',length:5,width:4,height:2.5,unit:'m'}];
 return list.map((r,i)=>{let length=toM(r.length,r.unit),width=toM(r.width,r.unit);const height=toM(r.height,r.unit)||2.44;if(!length&&!width){length=4;width=3.5}else if(!length)length=width;else if(!width)width=length;return {name:(r.name||'').trim()||`Pièce ${i+1}`,length:r2(Math.min(100,Math.max(.6,length))),width:r2(Math.min(100,Math.max(.6,width))),height:r2(Math.min(20,Math.max(1.8,height))),notes:r.notes||'',features:r.features}});
}

export function guessFurniture(name:string):PlanRoom['furniture']{
 const n=name.toLowerCase();
 if(/cuisine|kitchen|cuisinette/.test(n))return 'kitchen';
 if(/bain|douche|toilette|wc|bath|salle d.?eau|buanderie/.test(n))return 'bath';
 if(/chambre|bedroom|dortoir/.test(n))return 'bedroom';
 if(/salon|séjour|sejour|living|famille|salle à manger|salle a manger|boudoir/.test(n))return 'living';
 return 'none';
}
const finishFor=(f:PlanRoom['furniture']):PlanRoom['floorFinish']=>f==='kitchen'||f==='bath'?'tile':'wood';

/** Deterministic layout: rooms packed in rows, adjacent walls shared. Always valid. */
export function autoPlan(rooms:InRoom[],style:Style='nature'):Plan{
 const metric=metricRooms(rooms),palette=palettes[style]||palettes.nature;
 const total=metric.reduce((s,r)=>s+r.length*r.width,0),rowMax=Math.max(8,Math.sqrt(total)*1.35);
 let x=0,y=0,rowDepth=0;
 const out:PlanRoom[]=metric.map((r,i)=>{if(x>0&&x+r.length>rowMax){x=0;y=r2(y+rowDepth);rowDepth=0}const furniture=guessFurniture(r.name);const f=r.features||{};const room:PlanRoom={id:`piece-${i+1}`,name:r.name.slice(0,80),x:r2(x),y:r2(y),length:r.length,width:r.width,height:r.height,phase:'existing',floor:palette.floor,wall:palette.wall,furniture,door:f.doors===undefined?true:Number(f.doors)>0,window:f.windows===undefined?furniture!=='bath':Number(f.windows)>0,floorFinish:finishFor(furniture),wallFinish:'paint'};x=r2(x+r.length);rowDepth=Math.max(rowDepth,r.width);return room});
 return planSchema.parse({revision:1,validated:false,style,rooms:out,elements:[]});
}

export const PLAN_SYSTEM=`Tu es dessinateur en rénovation résidentielle au Québec. À partir d’un relevé de visite (pièces mesurées, notes, travaux souhaités), tu produis un plan d’étage 2D cohérent qui servira aussi à une maquette 3D.
Règles de géométrie (toutes les valeurs en mètres) :
- Repère : origine en haut à gauche, x vers la droite, y vers le bas. Chaque pièce est un rectangle (x, y, length = étendue en x, width = étendue en y).
- Garde les dimensions relevées de chaque pièce (tu peux seulement échanger length et width pour l’orienter).
- Les pièces ne se chevauchent jamais ; dispose-les de façon réaliste en les accolant (murs partagés) : cuisine près du salon / salle à manger, salle de bain près des chambres, entrée en bordure.
- Coordonnées entre 0 et 60.
Éléments (elements) : ajoute ce qui est utile au chantier et à la 3D :
- door / window : petit rectangle posé SUR un mur de la pièce (mur horizontal : length = largeur de l’ouverture, width = 0.15 ; mur vertical : length = 0.15, width = largeur de l’ouverture). Porte 0.81-0.91, fenêtre 0.9-1.5.
- counter (comptoir, profondeur 0.64, hauteur 0.91), island (îlot, hauteur 0.91), fixture (évier, toilette, douche, cuisinière, height ~0.9), stairs, wall (nouvelle cloison, width 0.14, height = hauteur sous plafond), note (annotation, height 0, ex. « Mur à démolir »).
- phase : "existing" (conservé), "new" (à construire), "remove" (à démolir), selon les travaux décrits.
Pour chaque pièce : furniture parmi none|living|bedroom|kitchen|bath, door et window (booléens), floorFinish parmi wood|tile|concrete, wallFinish parmi paint|brick, phase.
Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"rooms":[{"id":string,"name":string,"x":number,"y":number,"length":number,"width":number,"height":number,"phase":"existing"|"new"|"remove","furniture":string,"door":boolean,"window":boolean,"floorFinish":string,"wallFinish":string}],"elements":[{"id":string,"kind":string,"label":string,"x":number,"y":number,"length":number,"width":number,"height":number,"phase":string}],"style":"nature"|"contemporary"|"classic"|"industrial"}`;

export function planUserText(input:{rooms:InRoom[];scope?:string;constraints?:string;materials?:string;notes?:string;style?:Style}){
 const rooms=metricRooms(input.rooms).map((r,i)=>{const f=r.features||{};const extra=[f.doors!==undefined?`${f.doors} porte(s)`:'',f.windows!==undefined?`${f.windows} fenêtre(s)`:'',Array.isArray(f.list)&&f.list.length?f.list.join(', '):''].filter(Boolean).join(' ; ');return `${i+1}. ${r.name} : ${r.length} × ${r.width} m, hauteur ${r.height} m${extra?` — ${extra}`:''}${r.notes?` — notes : ${r.notes}`:''}`}).join('\n');
 return [`Pièces relevées :\n${rooms}`,input.scope?`Travaux souhaités : ${input.scope}`:'',input.constraints?`Contraintes : ${input.constraints}`:'',input.materials?`Matériaux et finitions : ${input.materials}`:'',input.notes?`Notes de visite :\n${input.notes.slice(0,12000)}`:'',input.style?`Ambiance choisie : ${input.style}`:'','Dessine le plan et donne le JSON demandé.'].filter(Boolean).join('\n\n');
}

const overlap=(a:PlanRoom,b:PlanRoom)=>Math.min(a.x+a.length,b.x+b.length)-Math.max(a.x,b.x)>.25&&Math.min(a.y+a.width,b.y+b.width)-Math.max(a.y,b.y)>.25;
const pick=<T extends string>(v:unknown,allowed:readonly T[],fallback:T):T=>allowed.includes(v as T)?v as T:fallback;
const clamp=(v:unknown,min:number,max:number,fallback:number)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};

/** Coerces a model answer into a valid Plan. Falls back to the automatic layout when the geometry is unusable. */
export function normalizePlan(raw:any,input:InRoom[],requestedStyle?:Style):Plan|null{
 if(!raw||!Array.isArray(raw.rooms)||!raw.rooms.length)return null;
 const style=pick(requestedStyle||raw.style,['nature','contemporary','classic','industrial'] as const,'nature'),palette=palettes[style];
 const ids=new Set<string>();const uid=(v:unknown,prefix:string,i:number)=>{let id=String(v||`${prefix}-${i+1}`).replace(/[^\w-]/g,'-').slice(0,60)||`${prefix}-${i+1}`;while(ids.has(id))id+='-b';ids.add(id);return id};
 const rooms:PlanRoom[]=raw.rooms.slice(0,40).map((r:any,i:number)=>{const name=String(r.name||`Pièce ${i+1}`).slice(0,80);const furniture=pick(r.furniture,['none','living','bedroom','kitchen','bath'] as const,guessFurniture(name));return {id:uid(r.id,'piece',i),name,x:r2(clamp(r.x,0,200,0)),y:r2(clamp(r.y,0,200,0)),length:r2(clamp(r.length,.3,100,3)),width:r2(clamp(r.width,.3,100,3)),height:r2(clamp(r.height,1.8,20,2.44)),phase:pick(r.phase,['existing','new','remove'] as const,'existing'),floor:palette.floor,wall:palette.wall,furniture,door:r.door!==false,window:r.window!==false&&!!r.window,floorFinish:pick(r.floorFinish,['wood','tile','concrete'] as const,finishFor(furniture)),wallFinish:pick(r.wallFinish,['paint','brick'] as const,'paint')}});
 const kept=rooms.filter(r=>r.phase!=='remove');
 for(let i=0;i<kept.length;i++)for(let j=i+1;j<kept.length;j++)if(overlap(kept[i],kept[j])){
  // Unusable geometry: keep the model's room attributes on the automatic layout.
  const auto=autoPlan(input.length?input:rooms.map(r=>({name:r.name,length:r.length,width:r.width,height:r.height,unit:'m'})),style);
  return planSchema.parse({...auto,rooms:auto.rooms.map((a,k)=>{const m=rooms.find(r=>r.name===a.name)||rooms[k];return m?{...a,furniture:m.furniture,door:m.door,window:m.window,floorFinish:m.floorFinish,wallFinish:m.wallFinish,phase:m.phase}:a})});
 }
 const kinds=['wall','door','window','counter','island','fixture','stairs','note'] as const;
 const elements:PlanElement[]=(Array.isArray(raw.elements)?raw.elements:[]).slice(0,160).filter((e:any)=>kinds.includes(e?.kind)).map((e:any,i:number)=>({id:uid(e.id,e.kind,i),kind:e.kind,label:String(e.label||e.kind).slice(0,100),x:r2(clamp(e.x,0,200,0)),y:r2(clamp(e.y,0,200,0)),length:r2(clamp(e.length,.05,100,.9)),width:r2(clamp(e.width,.05,100,.15)),height:r2(clamp(e.height,0,20,.9)),phase:pick(e.phase,['existing','new','remove'] as const,'existing')}));
 const parsed=planSchema.safeParse({revision:1,validated:false,style,rooms,elements});
 return parsed.success?parsed.data:null;
}
