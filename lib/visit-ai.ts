import {planSchema,palettes,type Plan,type PlanRoom,type PlanElement} from './plan';

const num=(v:unknown,min:number,max:number)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null};
const r2=(n:number)=>Math.round(n*100)/100;
const pick=<T extends string>(v:unknown,allowed:readonly T[],fallback:T):T=>allowed.includes(v as T)?v as T:fallback;
const clamp=(v:unknown,min:number,max:number,fallback:number)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
const list=(v:unknown,max=10,len=160)=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.slice(0,len)).slice(0,max):[];
export const FT=.3048;

// ───────────────────────── Measurement from photos / video frames ─────────────────────────

export type WallMeasure={name:string;length:number};
export type MeasureResult={
 length:number;width:number;height:number;unit:'m';
 confidence:'faible'|'moyenne'|'bonne';margin:number;
 doors:number;windows:number;shape:'rectangle'|'L'|'irrégulière';
 walls:WallMeasure[];discrepancy:number;
 name?:string;features:string[];references:string[];observations:string;advice:string;
};

export const MEASURE_SYSTEM=`Tu es métreur en rénovation résidentielle au Québec. Tu fais un relevé de dimensions à partir de photos d’UNE pièce.
Méthode obligatoire, étape par étape (écris-la dans "reasoning", de façon concise) :
1. Repère les coins visibles de la pièce sur chaque image (image étiquetée « Coin 1 », « Coin 2 »… = la photo est prise depuis ce coin ou vise ce coin ; les coins sont numérotés dans le sens horaire). Nomme les murs : mur A = coin 1→2, mur B = coin 2→3, mur C = coin 3→4, mur D = coin 4→1.
2. Pour chaque mur, mesure sa longueur en comptant des objets étalons posés contre lui ou dans son plan : porte intérieure 0,81 × 2,03 m (32 × 80 po), porte d’entrée 0,91 m, prise électrique à 0,30 m du sol, interrupteur à 1,20 m, plinthe 7-10 cm, comptoir 0,91 m de haut et 0,64 m de profondeur, armoire haute 0,76 m, toilette 0,70 m de profondeur, baignoire 1,52 m, carreaux 30 × 60 cm, lames de plancher 12-19 cm, cadrage de fenêtre courant 0,9-1,2 m, plafond 2,44 m (8 pi) ou 2,74 m (9 pi), lit double 1,37 × 1,91 m, lit queen 1,52 × 2,03 m.
3. Corrige la perspective : un objet loin paraît plus petit ; compare des objets à la même distance que le mur mesuré.
4. Contrôle croisé : les murs opposés d’une pièce rectangulaire doivent être égaux. Calcule l’écart (discrepancy, en %) entre murs opposés ; s’il dépasse 8 %, réexamine et explique.
5. Si une dimension de référence mesurée au ruban est donnée, elle prime : recalcule toutes les autres à partir d’elle.
6. length = plus grande dimension au sol, width = plus petite (moyenne des murs opposés), height = hauteur sous plafond.
Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"reasoning":string,"walls":[{"name":"Mur A","length":number}],"length":number,"width":number,"height":number,"unit":"m","shape":"rectangle"|"L"|"irrégulière","discrepancy":number,"confidence":"faible"|"moyenne"|"bonne","margin":number,"doors":number,"windows":number,"name":string,"features":[string],"references":[string],"observations":string,"advice":string}
- margin : marge d’erreur honnête en % (3-5 avec une référence au ruban et 4 coins, 8-15 sans référence, plus si peu d’images).
- name : type de pièce (« Cuisine », « Salle de bain »…). features : éléments utiles au plan (« îlot central », « comptoir en L », « escalier »…).
- observations : état des lieux utile au devis (revêtements, dégâts, matériaux), 2 phrases max. advice : la mesure au ruban qui confirmerait le relevé, 1 phrase.`;

export function measureUserText({room,reference,source,count,labels=[]}:{room?:string;reference?:string;source:'photo'|'video';count:number;labels?:string[]}){
 const labelled=labels.some(Boolean);
 return [
  `${count} ${source==='video'?'images extraites, dans l’ordre, d’une vidéo du tour de la pièce':'photo(s)'} de la pièce${room?` « ${room} »`:''}.`,
  labelled?'Chaque image est précédée de son étiquette (coin photographié).':source==='video'?'Les images suivent le tour de la pièce : déduis les coins successifs.':'Les photos ne sont pas étiquetées : identifie toi-même les coins.',
  reference?`Dimension de référence mesurée au ruban : ${reference}`:'Aucune dimension de référence au ruban : base-toi sur les objets étalons.',
  'Fais le relevé et donne le JSON demandé.'
 ].join('\n');
}

export function normalizeMeasure(raw:any):MeasureResult|null{
 if(!raw||typeof raw!=='object')return null;
 const walls:WallMeasure[]=Array.isArray(raw.walls)?raw.walls.map((w:any,i:number)=>({name:String(w?.name||`Mur ${'ABCDEFGH'[i]||i+1}`).slice(0,40),length:num(w?.length,.3,60)})).filter((w:any)=>w.length!==null).map((w:any)=>({...w,length:r2(w.length)})).slice(0,8):[];
 let length=num(raw.length,.5,60),width=num(raw.width,.5,60);const height=num(raw.height,1.5,12)??2.44;
 // Rebuild from walls when the totals are missing but four walls are known.
 if((length===null||width===null)&&walls.length>=4){const a=(walls[0].length+walls[2].length)/2,b=(walls[1].length+walls[3].length)/2;length=Math.max(a,b);width=Math.min(a,b)}
 if(length===null||width===null)return null;
 if(width>length)[length,width]=[width,length];
 let discrepancy=num(raw.discrepancy,0,100)??0;
 if(walls.length>=4){const d=(x:number,y:number)=>Math.abs(x-y)/Math.max(x,y)*100;discrepancy=Math.round(Math.max(d(walls[0].length,walls[2].length),d(walls[1].length,walls[3].length)))}
 const confidence=pick(raw.confidence,['faible','moyenne','bonne'] as const,'moyenne');
 return {length:r2(length),width:r2(width),height:r2(height),unit:'m',confidence:discrepancy>12&&confidence==='bonne'?'moyenne':confidence,margin:Math.round(num(raw.margin,1,60)??12),doors:Math.round(num(raw.doors,0,20)??0),windows:Math.round(num(raw.windows,0,30)??0),shape:pick(raw.shape,['rectangle','L','irrégulière'] as const,'rectangle'),walls,discrepancy,name:typeof raw.name==='string'?raw.name.slice(0,80):undefined,features:list(raw.features,10,120),references:list(raw.references,10,120),observations:String(raw.observations||'').slice(0,600),advice:String(raw.advice||'').slice(0,300)};
}

// ───────────────────────── Rooms, relative positions and layout ─────────────────────────

export type Side='right'|'left'|'above'|'below';
export type Align='start'|'center'|'end';
export type RoomPosition={ref:string;side:Side;align?:Align;offset?:number;door?:boolean};
export type InRoom={id?:string;name?:string;length?:number;width?:number;height?:number;unit?:string;notes?:string;features?:any;position?:RoomPosition|null};
export type MetricRoom={id:string;name:string;length:number;width:number;height:number;notes:string;features:any;position:RoomPosition|null;offset:number};
type Style=keyof typeof palettes;
type Rect={x:number;y:number;length:number;width:number};

export const SIDE_LABEL:Record<Side,string>={right:'à droite (côté est) de',left:'à gauche (côté ouest) de',above:'au-dessus (côté nord) de',below:'en dessous (côté sud) de'};
const toM=(v:unknown,unit?:string)=>{const n=Number(v)||0;return unit==='m'?n:n*FT};
export const roomId=(r:InRoom,i:number)=>String(r.id||`piece-${i+1}`);

/** Rooms in metres (length = east-west extent, width = north-south extent), with defaults when a dimension is missing. */
export function metricRooms(rooms:InRoom[]):MetricRoom[]{
 const source=rooms.length?rooms:[{name:'Pièce principale',length:5,width:4,height:2.5,unit:'m'}];
 const ids=source.map(roomId);
 return source.map((r,i)=>{let length=toM(r.length,r.unit),width=toM(r.width,r.unit);const height=toM(r.height,r.unit)||2.44;if(!length&&!width){length=4;width=3.5}else if(!length)length=width;else if(!width)width=length;
  const p=r.position&&ids.includes(String(r.position.ref))&&String(r.position.ref)!==ids[i]?{ref:String(r.position.ref),side:pick(r.position.side,['right','left','above','below'] as const,'right'),align:pick(r.position.align,['start','center','end'] as const,'start'),offset:Number(r.position.offset)||0,door:!!r.position.door}:null;
  return {id:ids[i],name:(r.name||'').trim()||`Pièce ${i+1}`,length:r2(Math.min(100,Math.max(.6,length))),width:r2(Math.min(100,Math.max(.6,width))),height:r2(Math.min(20,Math.max(1.8,height))),notes:r.notes||'',features:r.features,position:p,offset:r2(toM(p?.offset,r.unit))};
 });
}

function placeNextTo(ref:Rect,room:{length:number;width:number},p:RoomPosition,offset:number):Rect{
 const align=p.align||'start';
 if(p.side==='right'||p.side==='left'){
  const y=align==='center'?ref.y+(ref.width-room.width)/2:align==='end'?ref.y+ref.width-room.width:ref.y;
  return {x:p.side==='right'?ref.x+ref.length:ref.x-room.length,y:y+offset,length:room.length,width:room.width};
 }
 const x=align==='center'?ref.x+(ref.length-room.length)/2:align==='end'?ref.x+ref.length-room.length:ref.x;
 return {x:x+offset,y:p.side==='below'?ref.y+ref.width:ref.y-room.width,length:room.length,width:room.width};
}
const overlapArea=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.x+a.length,b.x+b.length)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.width,b.y+b.width)-Math.max(a.y,b.y));
const overlaps=(a:Rect,b:Rect)=>overlapArea(a,b)>.05;

/** Exact positions for every room linked to another one; unlinked rooms are returned separately. */
export function layoutFromPositions(rooms:MetricRoom[]){
 const placed=new Map<string,Rect>();const fixed=new Set<string>();
 if(rooms.length){placed.set(rooms[0].id,{x:0,y:0,length:rooms[0].length,width:rooms[0].width});fixed.add(rooms[0].id)}
 // Repeat until no more room can be placed (references may point forward).
 for(let pass=0;pass<rooms.length;pass++){let progress=false;for(const r of rooms){if(placed.has(r.id)||!r.position)continue;const ref=placed.get(r.position.ref);if(!ref)continue;placed.set(r.id,placeNextTo(ref,r,r.position,r.offset));fixed.add(r.id);progress=true}if(!progress)break}
 return {placed,fixed};
}

/** Places rooms without a known position around the existing block, never overlapping. */
function placeRemaining(rooms:MetricRoom[],placed:Map<string,Rect>){
 for(const r of rooms){
  if(placed.has(r.id))continue;
  const rects=[...placed.values()];
  if(!rects.length){placed.set(r.id,{x:0,y:0,length:r.length,width:r.width});continue}
  const maxX=Math.max(...rects.map(q=>q.x+q.length)),minY=Math.min(...rects.map(q=>q.y)),maxY=Math.max(...rects.map(q=>q.y+q.width)),minX=Math.min(...rects.map(q=>q.x));
  const width=maxX-minX;
  // Fill to the right while the block stays reasonably square, else start a new row below.
  const candidate:Rect=width<Math.max(8,(maxY-minY)*1.4)?{x:maxX,y:minY,length:r.length,width:r.width}:{x:minX,y:maxY,length:r.length,width:r.width};
  let c=candidate;let guard=0;while(rects.some(q=>overlaps(q,c))&&guard++<60)c={...c,y:Math.max(...rects.filter(q=>overlaps(q,c)).map(q=>q.y+q.width))};
  placed.set(r.id,c);
 }
}
function shiftPositive(placed:Map<string,Rect>){const rects=[...placed.values()];if(!rects.length)return;const dx=-Math.min(0,...rects.map(r=>r.x)),dy=-Math.min(0,...rects.map(r=>r.y));for(const [id,r] of placed)placed.set(id,{...r,x:r2(r.x+dx),y:r2(r.y+dy)})}

export function guessFurniture(name:string):PlanRoom['furniture']{
 const n=name.toLowerCase();
 if(/cuisine|kitchen|cuisinette/.test(n))return 'kitchen';
 if(/bain|douche|toilette|wc|bath|salle d.?eau|buanderie/.test(n))return 'bath';
 if(/chambre|bedroom|dortoir/.test(n))return 'bedroom';
 if(/salon|séjour|sejour|living|famille|salle à manger|salle a manger|boudoir/.test(n))return 'living';
 return 'none';
}
const finishFor=(f:PlanRoom['furniture']):PlanRoom['floorFinish']=>f==='kitchen'||f==='bath'?'tile':'wood';

/** Shared wall segment between two rooms (or null). */
export function sharedWall(a:Rect,b:Rect){
 const eps=.06;
 const oy=[Math.max(a.y,b.y),Math.min(a.y+a.width,b.y+b.width)],ox=[Math.max(a.x,b.x),Math.min(a.x+a.length,b.x+b.length)];
 if(Math.abs(a.x+a.length-b.x)<eps&&oy[1]-oy[0]>0)return {orientation:'v' as const,x:a.x+a.length,from:oy[0],to:oy[1]};
 if(Math.abs(b.x+b.length-a.x)<eps&&oy[1]-oy[0]>0)return {orientation:'v' as const,x:a.x,from:oy[0],to:oy[1]};
 if(Math.abs(a.y+a.width-b.y)<eps&&ox[1]-ox[0]>0)return {orientation:'h' as const,y:a.y+a.width,from:ox[0],to:ox[1]};
 if(Math.abs(b.y+b.width-a.y)<eps&&ox[1]-ox[0]>0)return {orientation:'h' as const,y:a.y,from:ox[0],to:ox[1]};
 return null;
}
function passageDoor(a:Rect,b:Rect,label:string,id:string):PlanElement|null{
 const w=sharedWall(a,b);if(!w||w.to-w.from<.85)return null;const mid=(w.from+w.to)/2;
 return w.orientation==='v'?{id,kind:'door',label,x:r2(w.x-.075),y:r2(mid-.41),length:.15,width:.81,height:2.03,phase:'existing'}:{id,kind:'door',label,x:r2(mid-.41),y:r2(w.y-.075),length:.81,width:.15,height:2.03,phase:'existing'};
}

/** Deterministic plan: linked rooms at their exact place, others packed around. Always valid. */
export function autoPlan(rooms:InRoom[],style:Style='nature'):Plan{
 const metric=metricRooms(rooms),palette=palettes[style]||palettes.nature;
 const {placed}=layoutFromPositions(metric);placeRemaining(metric,placed);shiftPositive(placed);
 const out:PlanRoom[]=metric.map(r=>{const q=placed.get(r.id)!;const furniture=guessFurniture(r.name);const f=r.features||{};return {id:r.id.replace(/[^\w-]/g,'-').slice(0,60),name:r.name.slice(0,80),x:q.x,y:q.y,length:r.length,width:r.width,height:r.height,phase:'existing',floor:palette.floor,wall:palette.wall,furniture,door:f.doors===undefined?true:Number(f.doors)>0,window:f.windows===undefined?furniture!=='bath':Number(f.windows)>0,floorFinish:finishFor(furniture),wallFinish:'paint'}});
 const elements:PlanElement[]=[];
 for(const r of metric)if(r.position?.door){const a=placed.get(r.id),b=placed.get(r.position.ref);const ref=metric.find(m=>m.id===r.position!.ref);if(a&&b){const d=passageDoor(a,b,`Passage ${ref?.name||''} / ${r.name}`.trim(),`passage-${r.id}`.replace(/[^\w-]/g,'-').slice(0,60));if(d)elements.push(d)}}
 return planSchema.parse({revision:1,validated:false,style,rooms:out,elements});
}

// ───────────────────────── AI plan drawing ─────────────────────────

export const PLAN_SYSTEM=`Tu es dessinateur en rénovation résidentielle au Québec. À partir d’un relevé de visite, tu produis un plan d’étage 2D exact qui sert aussi à la maquette 3D et au devis.
Géométrie (mètres) : origine en haut à gauche, x vers la droite (est), y vers le bas (sud). Chaque pièce est un rectangle (x, y, length = étendue est-ouest, width = étendue nord-sud).
Règles strictes :
- Les pièces marquées FIXE ont déjà leurs coordonnées exactes, calculées à partir des positions indiquées sur place : recopie-les à l’identique (x, y, length, width).
- Les autres pièces : place-les de façon réaliste en les accolant (murs partagés), sans aucun chevauchement, en gardant leurs dimensions (tu peux seulement échanger length et width).
- Ne crée pas de pièce qui n’est pas dans le relevé.
Éléments (elements) utiles au chantier et à la 3D :
- door / window : petit rectangle posé SUR un mur (mur horizontal : length = largeur de l’ouverture, width = 0.15 ; mur vertical : length = 0.15, width = largeur). Porte 0.81-0.91, fenêtre 0.9-1.5. Les fenêtres vont sur les murs extérieurs (non partagés). Chaque pièce a au moins une porte.
- counter (comptoir, profondeur 0.64, hauteur 0.91) contre un mur, island (îlot, hauteur 0.91) avec 0,9 m de dégagement autour, fixture (évier, toilette, douche, baignoire, cuisinière, réfrigérateur ; height ~0.9), stairs, wall (nouvelle cloison, width 0.14, height = hauteur sous plafond), note (annotation de travaux, height 0).
- Chaque élément est entièrement à l’intérieur ou sur le contour de sa pièce.
- phase : "existing" (conservé), "new" (à construire), "remove" (à démolir), selon les travaux décrits.
Pour chaque pièce : furniture parmi none|living|bedroom|kitchen|bath, door et window (booléens), floorFinish parmi wood|tile|concrete, wallFinish parmi paint|brick, phase.
Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"rooms":[{"id":string,"name":string,"x":number,"y":number,"length":number,"width":number,"height":number,"phase":"existing"|"new"|"remove","furniture":string,"door":boolean,"window":boolean,"floorFinish":string,"wallFinish":string}],"elements":[{"id":string,"kind":string,"label":string,"x":number,"y":number,"length":number,"width":number,"height":number,"phase":string}],"style":"nature"|"contemporary"|"classic"|"industrial"}`;

export function planUserText(input:{rooms:InRoom[];scope?:string;constraints?:string;materials?:string;notes?:string;style?:Style}){
 const metric=metricRooms(input.rooms);const {placed,fixed}=layoutFromPositions(metric);shiftPositive(placed);
 const rooms=metric.map((r,i)=>{const f=r.features||{};const q=placed.get(r.id);const ref=r.position?metric.find(m=>m.id===r.position!.ref):null;
  const extra=[f.doors!==undefined?`${f.doors} porte(s)`:'',f.windows!==undefined?`${f.windows} fenêtre(s)`:'',Array.isArray(f.list)&&f.list.length?f.list.join(', '):''].filter(Boolean).join(' ; ');
  return `${i+1}. id="${r.id}" ${r.name} : ${r.length} m (est-ouest) × ${r.width} m (nord-sud), hauteur ${r.height} m`+
   (fixed.has(r.id)&&q?` — FIXE : x=${q.x}, y=${q.y}`:' — à placer')+
   (ref&&r.position?` — située ${SIDE_LABEL[r.position.side]} « ${ref.name} »${r.position.door?', avec un passage/porte entre les deux':''}`:'')+
   (extra?` — ${extra}`:'')+(r.notes?` — notes : ${r.notes}`:'');}).join('\n');
 return [`Pièces relevées :\n${rooms}`,input.scope?`Travaux souhaités : ${input.scope}`:'',input.constraints?`Contraintes : ${input.constraints}`:'',input.materials?`Matériaux et finitions : ${input.materials}`:'',input.notes?`Notes de visite :\n${input.notes.slice(0,12000)}`:'',input.style?`Ambiance choisie : ${input.style}`:'','Dessine le plan et donne le JSON demandé.'].filter(Boolean).join('\n\n');
}

/** Coerces a model answer into a valid Plan: measured dimensions and fixed positions always win over the model. */
export function normalizePlan(raw:any,input:InRoom[],requestedStyle?:Style):Plan|null{
 if(!raw||!Array.isArray(raw.rooms)||!raw.rooms.length)return null;
 const style=pick(requestedStyle||raw.style,['nature','contemporary','classic','industrial'] as const,'nature'),palette=palettes[style];
 const metric=metricRooms(input.length?input:raw.rooms.map((r:any,i:number)=>({id:r.id,name:r.name,length:r.length,width:r.width,height:r.height,unit:'m'})));
 const {placed,fixed}=layoutFromPositions(metric);shiftPositive(placed);
 const answers=raw.rooms.slice(0,60);
 const used=new Set<number>();
 const match=(r:MetricRoom,i:number)=>{let k=answers.findIndex((a:any,j:number)=>!used.has(j)&&String(a?.id)===r.id);if(k<0)k=answers.findIndex((a:any,j:number)=>!used.has(j)&&String(a?.name||'').trim().toLowerCase()===r.name.toLowerCase());if(k<0&&!used.has(i)&&answers[i])k=i;if(k>=0)used.add(k);return k>=0?answers[k]:{}};
 const rects=new Map<string,Rect>();
 const rooms:PlanRoom[]=metric.map((r,i)=>{const a=match(r,i);const name=r.name.slice(0,80);const furniture=pick(a.furniture,['none','living','bedroom','kitchen','bath'] as const,guessFurniture(name));
  let rect:Rect;
  if(fixed.has(r.id))rect=placed.get(r.id)!;
  else{const swapped=Math.abs(Number(a.length)-r.width)<.05&&Math.abs(Number(a.width)-r.length)<.05;rect={x:r2(clamp(a.x,0,200,0)),y:r2(clamp(a.y,0,200,0)),length:swapped?r.width:r.length,width:swapped?r.length:r.width}}
  rects.set(r.id,rect);
  return {id:r.id.replace(/[^\w-]/g,'-').slice(0,60),name,x:rect.x,y:rect.y,length:rect.length,width:rect.width,height:r.height,phase:pick(a.phase,['existing','new','remove'] as const,'existing'),floor:palette.floor,wall:palette.wall,furniture,door:a.door!==false,window:!!a.window,floorFinish:pick(a.floorFinish,['wood','tile','concrete'] as const,finishFor(furniture)),wallFinish:pick(a.wallFinish,['paint','brick'] as const,'paint')}});
 // Free rooms that collide are moved next to the block; elements of moved rooms are dropped (they would be misplaced).
 const moved=new Set<string>();
 const live=rooms.filter(r=>r.phase!=='remove');
 for(const r of live){if(fixed.has(metric.find(m=>m.id.replace(/[^\w-]/g,'-').slice(0,60)===r.id)?.id||''))continue;const others=live.filter(o=>o!==r&&!moved.has(o.id));if(others.some(o=>overlaps(o,r))){const keep=new Map<string,Rect>(live.filter(o=>o!==r&&!moved.has(o.id)).map(o=>[o.id,o]));placeRemaining([{...metric[0],id:r.id,length:r.length,width:r.width} as MetricRoom],keep);const q=keep.get(r.id)!;r.x=r2(q.x);r.y=r2(q.y);moved.add(r.id)}}
 const kinds=['wall','door','window','counter','island','fixture','stairs','note'] as const;
 const inside=(e:Rect)=>rooms.some(r=>!moved.has(r.id)&&e.x>=r.x-.2&&e.y>=r.y-.2&&e.x+e.length<=r.x+r.length+.2&&e.y+e.width<=r.y+r.width+.2);
 const ids=new Set<string>();const uid=(v:unknown,prefix:string,i:number)=>{let id=String(v||`${prefix}-${i+1}`).replace(/[^\w-]/g,'-').slice(0,60)||`${prefix}-${i+1}`;while(ids.has(id))id+='-b';ids.add(id);return id};
 let elements:PlanElement[]=(Array.isArray(raw.elements)?raw.elements:[]).slice(0,160).filter((e:any)=>kinds.includes(e?.kind)).map((e:any,i:number)=>({id:uid(e.id,e.kind,i),kind:e.kind,label:String(e.label||e.kind).slice(0,100),x:r2(clamp(e.x,0,200,0)),y:r2(clamp(e.y,0,200,0)),length:r2(clamp(e.length,.05,100,.9)),width:r2(clamp(e.width,.05,100,.15)),height:r2(clamp(e.height,0,20,.9)),phase:pick(e.phase,['existing','new','remove'] as const,'existing')})).filter((e:PlanElement)=>inside(e));
 // Guarantee the passages asked for on site.
 for(const r of metric)if(r.position?.door){const a=rects.get(r.id),b=rects.get(r.position.ref);if(a&&b){const w=sharedWall(a,b);const already=w&&elements.some(e=>e.kind==='door'&&(w.orientation==='v'?Math.abs(e.x+e.length/2-w.x)<.3&&e.y>=w.from-.1&&e.y<=w.to:Math.abs(e.y+e.width/2-w.y)<.3&&e.x>=w.from-.1&&e.x<=w.to));if(!already){const ref=metric.find(m=>m.id===r.position!.ref);const d=passageDoor(a,b,`Passage ${ref?.name||''} / ${r.name}`.trim(),uid(`passage-${r.id}`,'door',0));if(d)elements=[...elements,d]}}}
 const parsed=planSchema.safeParse({revision:1,validated:false,style,rooms,elements});
 return parsed.success?parsed.data:null;
}

// ───────────────────────── Plan control ─────────────────────────

export type Check={level:'ok'|'warn'|'error';text:string};

/** Deterministic checks: measured sizes, positions asked on site, overlaps, doors, connectivity. */
export function checkPlan(plan:Plan,input:InRoom[]):Check[]{
 const out:Check[]=[];const metric=metricRooms(input);const live=plan.rooms.filter(r=>r.phase!=='remove');
 const find=(m:MetricRoom)=>plan.rooms.find(r=>r.id===m.id.replace(/[^\w-]/g,'-').slice(0,60))||plan.rooms.find(r=>r.name.trim().toLowerCase()===m.name.toLowerCase());
 let dimsOk=0;
 for(const m of input.length?metric:[]){const r=find(m);if(!r){out.push({level:'error',text:`« ${m.name} » relevée sur place est absente du plan.`});continue}
  const same=(Math.abs(r.length-m.length)<.05&&Math.abs(r.width-m.width)<.05)||(!m.position&&Math.abs(r.length-m.width)<.05&&Math.abs(r.width-m.length)<.05);
  if(same)dimsOk++;else out.push({level:'error',text:`« ${m.name} » : ${r.length} × ${r.width} m sur le plan au lieu de ${m.length} × ${m.width} m mesurés.`});}
 if(input.length&&dimsOk===metric.length)out.push({level:'ok',text:`Cotes conformes au relevé pour les ${dimsOk} pièce(s).`});
 let overlapsFound=0;for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)if(overlapArea(live[i],live[j])>.05){overlapsFound++;out.push({level:'error',text:`« ${live[i].name} » et « ${live[j].name} » se chevauchent.`})}
 if(live.length>1&&!overlapsFound)out.push({level:'ok',text:'Aucune pièce ne se chevauche.'});
 let rel=0,relOk=0;
 for(const m of metric){if(!m.position)continue;rel++;const a=find(m),refM=metric.find(x=>x.id===m.position!.ref),b=refM&&find(refM);if(!a||!b)continue;
  const w=sharedWall(a,b);const sideOk=m.position.side==='right'?a.x>=b.x+b.length-.06:m.position.side==='left'?a.x+a.length<=b.x+.06:m.position.side==='below'?a.y>=b.y+b.width-.06:a.y+a.width<=b.y+.06;
  if(w&&sideOk)relOk++;else out.push({level:'error',text:`« ${m.name} » devrait être ${SIDE_LABEL[m.position.side]} « ${refM!.name} », avec un mur commun.`});}
 if(rel&&rel===relOk)out.push({level:'ok',text:`Positions respectées (${relOk} pièce(s) placée(s) par rapport à une autre).`});
 const unplaced=metric.slice(1).filter(m=>!m.position);
 if(input.length>1&&unplaced.length)out.push({level:'warn',text:`Position non indiquée pour : ${unplaced.map(m=>`« ${m.name} »`).join(', ')}. Indiquez où elle se trouve pour un plan fidèle.`});
 for(const r of live){const hasDoor=plan.elements.some(e=>e.kind==='door'&&e.phase!=='remove'&&e.x>=r.x-.2&&e.y>=r.y-.2&&e.x+e.length<=r.x+r.length+.2&&e.y+e.width<=r.y+r.width+.2);if(!hasDoor&&!r.door)out.push({level:'warn',text:`« ${r.name} » n’a pas de porte.`})}
 if(live.length>1){const seen=new Set([live[0].id]);let grow=true;while(grow){grow=false;for(const r of live)if(!seen.has(r.id)&&live.some(o=>seen.has(o.id)&&sharedWall(o,r))){seen.add(r.id);grow=true}}const alone=live.filter(r=>!seen.has(r.id));if(alone.length)out.push({level:'warn',text:`Pièce(s) détachée(s) du reste du plan : ${alone.map(r=>`« ${r.name} »`).join(', ')}.`});else out.push({level:'ok',text:'Toutes les pièces sont reliées entre elles.'})}
 const area=live.reduce((s,r)=>s+r.length*r.width,0);out.push({level:'ok',text:`Surface totale : ${r2(area)} m² (${Math.round(area/(FT*FT))} pi²).`});
 return out;
}

export const REVIEW_SYSTEM=`Tu es chargé de projet en rénovation au Québec. Tu vérifies un plan d’étage 2D (qui sert à la 3D et au devis) par rapport au relevé de visite.
Vérifie : cohérence des cotes avec le relevé, positions relatives indiquées sur place, chevauchements, circulation (portes, passages), fenêtres sur murs extérieurs, éléments (comptoirs, îlot, équipements) bien placés et dimensionnés, cohérence avec les travaux décrits, oublis évidents pour le devis.
Ne signale pas ce qui est conforme. Sois précis : nomme la pièce et l’élément.
Réponds UNIQUEMENT avec un objet JSON : {"verdict":"conforme"|"à corriger","issues":[{"severity":"bloquant"|"à vérifier"|"suggestion","text":string}],"summary":string}`;

export function reviewUserText(plan:Plan,input:{rooms:InRoom[];scope?:string;notes?:string},checks:Check[]){
 const rooms=metricRooms(input.rooms).map(r=>`- ${r.name} : ${r.length} × ${r.width} m, h ${r.height} m${r.position?` ; ${SIDE_LABEL[r.position.side]} ${metricRooms(input.rooms).find(m=>m.id===r.position!.ref)?.name||'?'}`:''}${r.notes?` ; ${r.notes}`:''}`).join('\n');
 const planText=JSON.stringify({rooms:plan.rooms.map(({id,name,x,y,length,width,height,phase,furniture,door,window})=>({id,name,x,y,length,width,height,phase,furniture,door,window})),elements:plan.elements.map(({kind,label,x,y,length,width,height,phase})=>({kind,label,x,y,length,width,height,phase}))});
 return [`Relevé de visite :\n${rooms}`,input.scope?`Travaux : ${input.scope}`:'',input.notes?`Notes : ${input.notes.slice(0,6000)}`:'',`Contrôles automatiques :\n${checks.map(c=>`[${c.level}] ${c.text}`).join('\n')}`,`Plan (mètres, x vers l’est, y vers le sud) :\n${planText}`,'Donne ton verdict en JSON.'].filter(Boolean).join('\n\n');
}

export type Review={verdict:'conforme'|'à corriger';issues:{severity:'bloquant'|'à vérifier'|'suggestion';text:string}[];summary:string};
export function normalizeReview(raw:any):Review|null{
 if(!raw||typeof raw!=='object')return null;
 return {verdict:pick(raw.verdict,['conforme','à corriger'] as const,'à corriger'),issues:(Array.isArray(raw.issues)?raw.issues:[]).filter((i:any)=>i&&i.text).slice(0,15).map((i:any)=>({severity:pick(i.severity,['bloquant','à vérifier','suggestion'] as const,'à vérifier'),text:String(i.text).slice(0,300)})),summary:String(raw.summary||'').slice(0,500)};
}

// ───────────────────────── Priced quote ─────────────────────────

export type QuoteLine={category:string;description:string;quantity:number;unit:string;price:number;basis:'catalogue'|'estimation'};
export type QuoteDraft={lines:QuoteLine[];assumptions:string[];exclusions:string[];summary:string};
export type CatalogueItem={name:string;category?:string;unit?:string;price?:number;material?:number;labour?:number;description?:string};

export const QUOTE_SYSTEM=`Tu es estimateur senior pour Rénovations MG Pro (Laval, Montréal, Rive-Nord), en 2026. Tu chiffres une soumission complète et réaliste à partir de la visite.
Règles :
- Couvre toutes les étapes du chantier décrit : protection et préparation, démolition et évacuation des rebuts (conteneur), structure/charpente si nécessaire, plomberie, électricité, ventilation, isolation, gypse/tirage de joints, revêtements de sol, céramique, armoires/comptoirs, peinture, finition, nettoyage final, gestion de projet. N’ajoute pas de poste sans lien avec les travaux.
- Quantités calculées à partir des cotes fournies (surfaces de plancher, surfaces de murs nettes, périmètres, nombre d’ouvertures), dans le système d’unités demandé par l’utilisateur. Ajoute 10 % de perte pour céramique et plancher.
- Les références du catalogue marquées [CHOISI pièce — surface] sont les finitions retenues sur le plan : chiffre ces surfaces avec ces références et leurs prix (basis "catalogue"), et applique aux quantités le pourcentage de pertes indiqué. Si l’unité du prix (m², ml) diffère du système d’unités du devis, convertis le prix (1 m² = 10,764 pi² ; 1 m = 3,281 pi).
- Prix unitaires de vente avant taxes (TPS/TVQ non incluses), main-d’œuvre et matériaux compris, en dollars canadiens. Utilise EN PRIORITÉ les prix du catalogue de l’entreprise fourni (basis "catalogue"). Sinon, prix réalistes du marché du Grand Montréal en 2026, gamme intermédiaire (basis "estimation"). Aucune ligne à 0 $.
- Descriptions claires pour le client (ce qui est fait, matériau, finition).
- category : la pièce ou le corps de métier (ex. « Cuisine — Démolition »).
- assumptions : hypothèses retenues (gamme de matériaux, état des supports…). exclusions : ce qui n’est pas inclus (électroménagers, permis, imprévus derrière les murs…).
Réponds UNIQUEMENT avec un objet JSON : {"lines":[{"category":string,"description":string,"quantity":number,"unit":string,"price":number,"basis":"catalogue"|"estimation"}],"assumptions":[string],"exclusions":[string],"summary":string}`;

const up=(n:number)=>Math.round(n);
export function geometry(rooms:InRoom[],plan?:Plan|null){
 return metricRooms(rooms).map(r=>{const p=plan?.rooms.find(x=>x.name.trim().toLowerCase()===r.name.toLowerCase());const els=plan&&p?plan.elements.filter(e=>e.x>=p.x-.2&&e.y>=p.y-.2&&e.x+e.length<=p.x+p.length+.2&&e.y+e.width<=p.y+p.width+.2):[];
  const doors=els.filter(e=>e.kind==='door').length||Number(r.features?.doors)||1,windows=els.filter(e=>e.kind==='window').length||Number(r.features?.windows)||0;
  const floor=r.length*r.width,perimeter=2*(r.length+r.width),walls=Math.max(0,perimeter*r.height-doors*.81*2.03-windows*1.2*1.2);
  return {name:r.name,length_m:r.length,width_m:r.width,height_m:r.height,length_ft:r2(r.length/FT),width_ft:r2(r.width/FT),height_ft:r2(r.height/FT),floor_sqft:up(floor/(FT*FT)),perimeter_ft:up(perimeter/FT),wall_sqft_net:up(walls/(FT*FT)),ceiling_sqft:up(floor/(FT*FT)),doors,windows,elements:els.map(e=>`${e.label} (${e.kind}, ${e.phase}, ${r2(e.length)}×${r2(e.width)} m)`),notes:r.notes};});
}

export function quoteUserText(input:{rooms:InRoom[];plan?:Plan|null;scope?:string;constraints?:string;materials?:string;notes?:string;catalogue?:CatalogueItem[]}){
 const metric=input.rooms.length>0&&input.rooms.filter(r=>r.unit==='m').length>=input.rooms.length/2;
 const geo=geometry(input.rooms,input.plan).map(g=>metric?{name:g.name,length_m:g.length_m,width_m:g.width_m,height_m:g.height_m,floor_m2:r2(g.length_m*g.width_m),perimeter_m:r2(2*(g.length_m+g.width_m)),wall_m2_net:r2(g.wall_sqft_net*FT*FT),ceiling_m2:r2(g.length_m*g.width_m),doors:g.doors,windows:g.windows,elements:g.elements,notes:g.notes}:g);
 const catalogue=(input.catalogue||[]).filter(c=>c.name&&(Number(c.price)||Number(c.material)||Number(c.labour))).slice(0,300).map(c=>`- ${c.category?c.category+' / ':''}${c.name} : ${Number(c.price)||r2((Number(c.material)||0)+(Number(c.labour)||0))} $ / ${c.unit||'unité'}${c.description?` (${c.description.slice(0,80)})`:''}`).join('\n');
 return [metric?'Système d’unités : MÉTRIQUE. Quantités en m², ml (mètre linéaire), unité, heure, forfait ; prix unitaires par m² ou ml.':'Système d’unités : IMPÉRIAL. Quantités en pi², pi lin., unité, heure, forfait ; prix unitaires par pi² ou pi lin.',`Pièces et métrés :\n${JSON.stringify(geo,null,1)}`,input.scope?`Travaux demandés : ${input.scope}`:'',input.constraints?`Contraintes : ${input.constraints}`:'',input.materials?`Matériaux et finitions souhaités : ${input.materials}`:'',input.notes?`Notes de visite :\n${input.notes.slice(0,12000)}`:'',catalogue?`Catalogue de prix de l’entreprise (prioritaire) :\n${catalogue}`:'Pas de catalogue de prix : utilise les prix du marché.','Chiffre la soumission et donne le JSON demandé.'].filter(Boolean).join('\n\n');
}

export function normalizeQuote(raw:any):QuoteDraft|null{
 if(!raw||!Array.isArray(raw.lines))return null;
 const lines:QuoteLine[]=raw.lines.filter((l:any)=>l&&l.description).slice(0,120).map((l:any)=>({category:String(l.category||'').slice(0,80),description:String(l.description).slice(0,300),quantity:r2(clamp(l.quantity,.01,100000,1)),unit:String(l.unit||'forfait').slice(0,20),price:r2(clamp(l.price,0,1000000,0)),basis:pick(l.basis,['catalogue','estimation'] as const,'estimation')})).filter((l:QuoteLine)=>l.price>0);
 if(!lines.length)return null;
 return {lines,assumptions:list(raw.assumptions,12,240),exclusions:list(raw.exclusions,12,240),summary:String(raw.summary||'').slice(0,600)};
}
