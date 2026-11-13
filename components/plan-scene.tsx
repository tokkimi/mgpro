'use client';
import {useEffect,useRef,useState} from 'react';
import type {Plan,PlanRoom,PlanElement} from '@/lib/plan';
import {bounds} from '@/lib/plan';
import {finishTextures,clearTextureCache,type Finish} from '@/lib/scene-textures';
import {lookOf,describeFinishes,photoUrl,type Look,type FinishChoice,type Photo} from '@/lib/finishes';
import FinishPanel from './finish-panel';

type Edge='north'|'south'|'west'|'east';
type Opening={from:number;to:number;kind:'door'|'window';bottom:number;top:number;shared:boolean};

/** Room description sent with the 3D view to the photorealistic renderer. */
export function describePlan(plan:Plan){
 const finish:Record<string,string>={wood:'parquet de bois franc',tile:'céramique grand format',concrete:'béton ciré'};
 const style:Record<string,string>={nature:'chaleureuse et naturelle (bois clair, lin, tons sable)',contemporary:'contemporaine épurée (blanc, gris clair, noir mat)',classic:'classique douce (moulures, tons crème, bois moyen)',industrial:'industrielle (béton, métal noir, brique)'};
 const rooms=plan.rooms.filter(r=>r.phase!=='remove').map(r=>`${r.name} (${r.length.toFixed(1)} × ${r.width.toFixed(1)} m) : sol ${finish[r.floorFinish]||'parquet'}, murs ${r.wallFinish==='brick'?'en brique apparente':`peints couleur ${r.wall}`}`).join(' ; ');
 const items=plan.elements.filter(e=>e.phase!=='remove'&&!['note','door','window','wall'].includes(e.kind)).map(e=>e.label).slice(0,25).join(', ');
 const fin=describeFinishes(plan.finishes,plan.rooms);
 return `Ambiance ${style[plan.style]||style.nature}. Pièces : ${rooms}.${items?` Équipements : ${items}.`:''}${fin?` Finitions choisies (à respecter) : ${fin}.`:''}`;
}

export default function PlanScene({plan,roof=false,top=false,onChange}:{plan:Plan;roof?:boolean;top?:boolean;onChange?:(plan:Plan)=>void}){
 const host=useRef<HTMLDivElement>(null);const [error,setError]=useState('');
 const [render,setRender]=useState<{busy:boolean;image?:string;error?:string}>({busy:false});
 const [mode,setMode]=useState<'model'|'visit'>('model');const [full,setFull]=useState(false);const [roomId,setRoomId]=useState('');
 const view=useRef<any>(null);const [panel,setPanel]=useState(false);
 const realRef=useRef(true);const [real,setReal]=useState(true);const [quality,setQuality]=useState(-1);
 const api=useRef<{real:(on:boolean)=>void;samples:()=>number;visit:(id?:string)=>void;model:()=>void;hold:(dir:string,on:boolean)=>void;zoom:(f:number)=>void}|null>(null);
 useEffect(()=>{let dispose=()=>{};let cancelled=false;(async()=>{try{
  const T=await import('three');
  const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
  const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');
  const {RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js');
  if(cancelled||!host.current)return;const el=host.current;
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;el.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#e9e7e2');
  const pmrem=new T.PMREMGenerator(renderer);const envTex=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environment=envTex;(scene as any).environmentIntensity=.38;
  const {w,h}=bounds(plan);const size=Math.max(w,h,3);
  const camera=new T.PerspectiveCamera(35,1,.05,1000);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(w/2,.6,h/2);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.47;controls.minDistance=1.5;controls.maxDistance=size*5;
  scene.add(new T.HemisphereLight('#fffaf0','#b9b3a5',.35));
  const sun=new T.DirectionalLight('#fff0d8',2.2);sun.position.set(w/2+size*.8,size*2.2,h/2-size*.6);sun.target.position.set(w/2,0,h/2);scene.add(sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=size*1.2;Object.assign(sun.shadow.camera,{left:-sc,right:sc,top:sc,bottom:-sc,near:.5,far:size*6});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;(sun.shadow as any).radius=4;scene.add(sun);

  // ── materials ──
  const mats:any[]=[];const keep=<M,>(m:M)=>{mats.push(m);return m};
  let ptMaterialsTimer:any=0;let pt:any=null;const texturesChanged=()=>{if(!pt)return;clearTimeout(ptMaterialsTimer);ptMaterialsTimer=setTimeout(()=>{try{pt?.updateMaterials()}catch{}},250)};
  const loader=new T.TextureLoader();const photoTex=new Map<string,any>();
  // Real scanned texture (ambientCG, CC0) for a catalogue finish; it replaces the procedural one once loaded.
  const photoMaps=(photo:Photo,finish:Finish,uw:number,uh:number,mat:any)=>{const tile=finish==='wood'?2:finish==='brick'?1.6:finish==='paint'?2.4:finish==='concrete'?2:1.2;
   const get=(map:'Color'|'NormalGL'|'Roughness')=>{const url=photoUrl(photo,1024,map);let base=photoTex.get(url);if(!base){base=loader.load(url,()=>{for(const u of base.userData.users||[])u();base.userData.users=[];});base.wrapS=base.wrapT=T.RepeatWrapping;base.anisotropy=8;if(map==='Color')base.colorSpace=T.SRGBColorSpace;base.userData.users=[];photoTex.set(url,base)}const t=base.clone();t.repeat.set(uw/tile,uh/tile);return {t,base}};
   const c=get('Color'),n=get('NormalGL'),r=get('Roughness');
   const apply=()=>{if(!c.base.image)return;c.t.needsUpdate=true;mat.map=c.t;mat.color=new T.Color('#ffffff');if(n.base.image){n.t.needsUpdate=true;mat.normalMap=n.t}if(r.base.image){r.t.needsUpdate=true;mat.roughnessMap=r.t;mat.roughness=1}mat.needsUpdate=true;texturesChanged()};
   for(const x of [c,n,r]){if(x.base.image)apply();else x.base.userData.users.push(apply)}};
  const textured=(finish:Finish,color:string,uw:number,uh:number,opts:any={})=>{const made=finishTextures(T,finish,color,opts.seed??7);const map=made.map.clone(),normalMap=made.normalMap.clone();for(const t of [map,normalMap]){t.repeat.set(uw/made.size[0],uh/made.size[1]);t.needsUpdate=true}const {seed,photo,...rest}=opts;if(photo){const m=keep(new T.MeshPhysicalMaterial({map,normalMap,normalScale:new T.Vector2(.6,.6),roughness:.6,...rest}));photoMaps(photo,finish,uw,uh,m);return m}return keep(new T.MeshPhysicalMaterial({map,normalMap,normalScale:new T.Vector2(.6,.6),roughness:.6,...rest}))};
  const plain=(color:string,opts:any={})=>keep(new T.MeshPhysicalMaterial({color,roughness:.6,...opts}));
  const M={
   ceramic:plain('#fbfbf9',{roughness:.12,clearcoat:1,clearcoatRoughness:.05}),
   chrome:plain('#e9ecef',{metalness:1,roughness:.1,envMapIntensity:2.2}),
   steel:plain('#c9cdd0',{metalness:.9,roughness:.32}),
   black:plain('#141414',{roughness:.25,clearcoat:.8}),
   blackMetal:plain('#1c1c1c',{metalness:.7,roughness:.4}),
   white:plain('#f6f5f1',{roughness:.45}),
   satin:plain('#f2f0ea',{roughness:.35,clearcoat:.3}),
   glass:plain('#ffffff',{transmission:.96,roughness:.03,thickness:.01,ior:1.5,transparent:true,opacity:1,metalness:0}),
   mirror:plain('#dfe6ea',{metalness:.95,roughness:.04,envMapIntensity:2.5}),
   water:plain('#dfe9ee',{roughness:.05,transmission:.5,transparent:true}),
   lampShade:plain('#fff3dc',{roughness:.8,emissive:new T.Color('#ffdca8'),emissiveIntensity:.6}),
  };
  const meshes:any[]=[];
  function add(geo:any,mat:any,x:number,y:number,z:number,parent:any=scene,shadow=true){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);meshes.push(m);return m}
  const box=(a:number,b:number,c:number)=>new T.BoxGeometry(Math.max(.001,a),Math.max(.001,b),Math.max(.001,c));
  const rbox=(a:number,b:number,c:number,r=.03)=>new RoundedBoxGeometry(Math.max(.01,a),Math.max(.01,b),Math.max(.01,c),3,Math.min(r,a/2-.001,b/2-.001,c/2-.001));
  const cyl=(r1:number,r2:number,hgt:number,seg=24)=>new T.CylinderGeometry(r1,r2,hgt,seg);

  // Ground.
  const ground=add(new T.PlaneGeometry(w+size*6,h+size*6),plain('#dcd9d1',{roughness:.95}),w/2,-.012,h/2,scene,false);ground.rotation.x=-Math.PI/2;

  const live=plan.rooms.filter(r=>r.phase!=='remove');const elements=(plan.elements||[]).filter(e=>e.phase!=='remove');
  const inRoom=(e:PlanElement,r:PlanRoom)=>{const cx=e.x+e.length/2,cy=e.y+e.width/2;return cx>=r.x-.15&&cx<=r.x+r.length+.15&&cy>=r.y-.15&&cy<=r.y+r.width+.15};
  const roomOf=(e:PlanElement)=>live.find(r=>inRoom(e,r));
  const shared=(r:PlanRoom,edge:Edge)=>live.some(o=>o!==r&&(edge==='north'?Math.abs(o.y+o.width-r.y)<.08&&o.x<r.x+r.length&&o.x+o.length>r.x:edge==='south'?Math.abs(o.y-(r.y+r.width))<.08&&o.x<r.x+r.length&&o.x+o.length>r.x:edge==='west'?Math.abs(o.x+o.length-r.x)<.08&&o.y<r.y+r.width&&o.y+o.width>r.y:Math.abs(o.x-(r.x+r.length))<.08&&o.y<r.y+r.width&&o.y+o.width>r.y));
  const nearestEdge=(e:PlanElement,r:PlanRoom):Edge=>{const cx=e.x+e.length/2,cy=e.y+e.width/2;const d={north:cy-r.y,south:r.y+r.width-cy,west:cx-r.x,east:r.x+r.length-cx};return (Object.keys(d) as Edge[]).sort((a,b)=>d[a]-d[b])[0]};
  const wallFades:{mesh:any;mat:any;normal:any;center:any}[]=[];const floors:any[]=[];const ceilings:any[]=[];const ceilingMat=plain('#fbfaf7',{roughness:.9});
  let lights=0;

  /** Group in a local frame: x along the wall, +z towards the room, y up; placed on the element footprint. */
  function anchored(e:{x:number;y:number;length:number;width:number},edge:Edge){
   const g=new T.Group();const horizontal=edge==='north'||edge==='south';const W=horizontal?e.length:e.width,D=horizontal?e.width:e.length;
   g.position.set(e.x+e.length/2,0,e.y+e.width/2);g.rotation.y=edge==='north'?0:edge==='south'?Math.PI:edge==='west'?Math.PI/2:-Math.PI/2;scene.add(g);return {g,W,D};
  }
  const handle=(g:any,x:number,y:number,z:number,len=.14,vertical=false)=>{const m=add(cyl(.006,.006,len,10),M.chrome,x,y,z,g);if(!vertical)m.rotation.z=Math.PI/2};

  // ── fixtures ──
  let cur:{fronts?:Look;worktop?:Look;splash?:Look;taps?:any;vanity?:Look}={};
  const topMat=(W:number,D:number)=>cur.worktop?textured(cur.worktop.finish as Finish,cur.worktop.color,W,D,{photo:cur.worktop.photo,roughness:cur.worktop.roughness,clearcoat:.5}):textured('quartz','#f1efea',W,D,{photo:{a:'Marble012'},roughness:.15,clearcoat:.6});
  const frontMat=(front:string,w:number,h:number)=>{const look=[cur.fronts,cur.vanity].find(f=>f&&f.photo&&f.color===front);return look?textured(look.finish as Finish,front,w,h,{photo:look.photo,roughness:.35,clearcoat:.25}):plain(front,{roughness:.35,clearcoat:.25})};
  function cabinets(g:any,W:number,D:number,H=.88,front=cur.fronts?.color||'#e9e5dd',top=true){
   add(box(W,.1,D-.06),M.black,0,.05,-.03,g);
   add(box(W,H-.13,D-.02),plain(front,{roughness:.4,clearcoat:.2}),0,.1+(H-.13)/2,-.01,g);
   const n=Math.max(1,Math.round(W/.6));for(let i=0;i<n;i++){const x=-W/2+W/n*(i+.5);add(box(W/n-.006,H-.15,.006),frontMat(front,W/n,H-.15),x,.1+(H-.13)/2,D/2-.008,g);handle(g,x,H-.12,D/2+.01)}
   if(top)add(box(W+.02,.03,D+.03),topMat(W,D),0,H+.015,.005,g);
  }
  function upper(g:any,W:number,D:number,front=cur.fronts?.color||'#e9e5dd'){add(box(W,.72,.34),plain(front,{roughness:.35,clearcoat:.25}),0,1.86,-D/2+.17,g);const n=Math.max(1,Math.round(W/.6));for(let i=0;i<n;i++)handle(g,-W/2+W/n*(i+.5),1.55,-D/2+.35,.12,true);add(box(W,.55,.01),cur.splash?textured(cur.splash.finish as Finish,cur.splash.color,W,.55,{photo:cur.splash.photo,roughness:cur.splash.roughness}):textured('wallTile','#f4f2ee',W,.55,{photo:{a:'Tiles133A'}}),0,1.18,-D/2+.005,g)}
  function faucet(g:any,x:number,y:number,z:number,tall=.32){add(cyl(.018,.022,tall,16),(cur.taps||M.chrome),x,y+tall/2,z,g);const arc=add(new T.TorusGeometry(.09,.013,10,24,Math.PI),(cur.taps||M.chrome),x,y+tall,z+.09,g);arc.rotation.y=Math.PI/2;arc.rotation.x=0}
  function sinkBasin(g:any,x:number,y:number,z:number,W=.6,D=.42){add(box(W,.012,D),M.steel,x,y,z,g);add(box(W-.04,.006,D-.04),plain('#9fa5a9',{metalness:.9,roughness:.25}),x,y-.002,z,g)}
  function toilet(g:any,D:number){
   const pts=[0,.02,.12,.18,.2,.19,.17].map((r,i)=>new T.Vector2(r,i*.065));const bowl=add(new T.LatheGeometry(pts,32),M.ceramic,0,0,-D/2+.42,g);bowl.scale.set(1,1,1.3);
   add(rbox(.4,.06,.48,.025),M.ceramic,0,.41,-D/2+.42,g);add(rbox(.42,.4,.18,.03),M.ceramic,0,.62,-D/2+.1,g);add(cyl(.02,.02,.012),M.chrome,.12,.83,-D/2+.1,g);
  }
  function shower(g:any,W:number,D:number){
   add(box(W,.04,D),M.ceramic,0,.02,0,g);add(box(.12,.004,.12),M.steel,0,.042,0,g);
   add(box(W,2.05,.012),textured('wallTile','#eceae6',W,2.05,{seed:3}),0,1.065,-D/2+.006,g);
   const glass=add(box(.008,1.95,D-.05),M.glass,W/2-.01,1.0,0,g,false);glass.renderOrder=2;const front=add(box(W*.55,1.95,.008),M.glass,W/2-W*.275,1.0,D/2-.01,g,false);front.renderOrder=2;
   add(box(.02,1.95,.02),M.chrome,W/2-.01,1.0,D/2-.01,g);add(cyl(.012,.012,1.1),M.chrome,0,1.55,-D/2+.04,g);add(cyl(.12,.12,.012,32),M.chrome,0,2.07,-D/2+.18,g);add(box(.015,.015,.15),M.chrome,0,2.09,-D/2+.11,g);
  }
  function bathtub(g:any,W:number,D:number){add(rbox(W,.56,D,.06),M.ceramic,0,.28,0,g);add(rbox(W-.14,.04,D-.14,.05),plain('#edf1f2',{roughness:.08}),0,.545,0,g);add(rbox(W-.18,.02,D-.18,.04),M.water,0,.48,0,g);faucet(g,0,.56,-D/2+.06,.16)}
  function vanity(g:any,W:number,D:number){cabinets(g,W,D,.84,cur.vanity?.color||'#9b7653',false);add(box(W+.02,.03,D+.02),topMat(W,D),0,.855,0,g);const basin=add(new T.SphereGeometry(.2,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2),M.ceramic,0,.98,.02,g);basin.rotation.x=Math.PI;basin.scale.set(1,.6,.8);faucet(g,0,.87,-D/2+.08,.25);add(box(Math.min(W*.9,1.1),.85,.01),M.mirror,0,1.6,-D/2+.012,g)}
  function stove(g:any,W:number,D:number){add(box(W,.9,D-.02),M.steel,0,.45,-.01,g);add(box(W-.02,.01,D-.06),M.black,0,.905,-.02,g);for(const [a,b] of [[-.15,-.12],[.15,-.12],[-.15,.12],[.15,.12]]){const ring=add(new T.TorusGeometry(.07,.006,8,32),plain('#3a3a3a',{roughness:.3}),a*W/.6,.912,b,g);ring.rotation.x=Math.PI/2}add(box(W-.1,.4,.01),M.black,0,.42,D/2-.015,g);handle(g,0,.68,D/2+.01,W-.15)}
  function fridge(g:any,W:number,D:number){add(rbox(W,1.82,D-.02,.02),M.steel,0,.91,-.01,g);add(box(W+.002,.006,D),plain('#6f7376',{metalness:.8}),0,1.2,-.01,g);handle(g,W/2-.07,1.5,D/2+.02,.5,true);handle(g,W/2-.07,.7,D/2+.02,.5,true)}
  function washer(g:any,W:number,D:number){add(rbox(W,.85,D-.02,.02),M.white,0,.425,-.01,g);const ring=add(new T.TorusGeometry(.17,.025,12,40),M.chrome,0,.45,D/2,g);add(new T.CircleGeometry(.16,32),plain('#3b4246',{roughness:.05,metalness:.3}),0,.45,D/2-.005,g)}
  function stool(x:number,z:number,parent:any){add(cyl(.17,.17,.05,24),plain('#3b3a37',{roughness:.6}),x,.66,z,parent);add(cyl(.02,.02,.62,10),M.blackMetal,x,.33,z,parent);add(cyl(.18,.18,.015,24),M.blackMetal,x,.008,z,parent)}
  function sofa(r:PlanRoom){const W=Math.min(2.3,r.length*.6),D=.95;const {g}=anchored({x:r.x+r.length/2-W/2,y:r.y+r.width-D-.15,length:W,width:D},'south');const fab='#cfc7b8';
   add(rbox(W,.42,D,.05),textured('fabric',fab,W,D),0,.21,0,g);add(rbox(W,.45,.22,.06),textured('fabric',fab,W,.45),0,.62,-D/2+.11,g);for(const s of [-1,1])add(rbox(.2,.62,D,.06),textured('fabric',fab,.2,.62),s*(W/2-.1),.31,0,g);
   const n=Math.max(2,Math.round((W-.4)/.7));for(let i=0;i<n;i++)add(rbox((W-.4)/n-.02,.14,D-.3,.06),textured('fabric','#ddd6c8',.6,.6),-W/2+.2+(W-.4)/n*(i+.5),.49,.06,g);
   add(rbox(1.1,.38,.6,.03),textured('oakVeneer','#a07a52',1.1,.6),0,.19,1.05,g);const rug=add(box(Math.min(r.length*.75,2.8),.008,Math.min(r.width*.6,2)),textured('rug','#c2b8a6',2,2),0,.004,.8,g,false);rug.receiveShadow=true;
   add(cyl(.015,.015,1.5),M.blackMetal,W/2+.35,.75,-D/2+.1,g);add(cyl(.16,.2,.25,24),M.lampShade,W/2+.35,1.55,-D/2+.1,g)}
  function bed(r:PlanRoom){const W=Math.min(1.6,r.length*.6),L=Math.min(2.1,r.width*.7);const {g}=anchored({x:r.x+r.length/2-W/2,y:r.y+.08,length:W,width:L},'north');
   add(rbox(W+.08,.3,L+.05,.03),textured('oakVeneer','#8a6a4a',W,L),0,.15,0,g);add(rbox(W+.1,1.0,.08,.03),textured('fabric','#b9ad98',W,1),0,.6,-L/2-.02,g);add(rbox(W,.22,L-.05,.05),M.white,0,.4,0,g);
   add(rbox(W+.02,.08,L*.68,.04),textured('fabric','#e8e2d6',W,L),0,.53,L*.16,g);for(const s of [-1,1])add(rbox(W/2-.08,.14,.4,.07),M.satin,s*W/4,.58,-L/2+.3,g);
   for(const s of [-1,1]){add(rbox(.48,.5,.4,.02),textured('oakVeneer','#8a6a4a',.48,.5),s*(W/2+.34),.25,-L/2+.2,g);add(cyl(.09,.12,.2,20),M.lampShade,s*(W/2+.34),.72,-L/2+.2,g)}}

  function fixture(e:PlanElement,r:PlanRoom){
   const label=(e.label||'').toLowerCase();const edge=nearestEdge(e,r);const {g,W,D}=anchored(e,edge);
   if(e.kind==='counter'){cabinets(g,W,D);const clash=elements.some(o=>o.kind==='window'&&inRoom(o,r)&&nearestEdge(o,r)===edge&&(edge==='north'||edge==='south'?o.x<e.x+e.length&&o.x+o.length>e.x:o.y<e.y+e.width&&o.y+o.width>e.y));if(!/îlot|ilot/.test(label)&&!clash)upper(g,W,D);if(/évier|evier/.test(label)){sinkBasin(g,0,.915,.02);faucet(g,0,.91,-D/2+.08)}return}
   if(e.kind==='island'){cabinets(g,W,Math.max(.6,D-.25));add(box(W+.04,.03,D+.04),textured('quartz','#f1efea',W,D,{roughness:.12,clearcoat:.7}),0,.9,.1,g);const n=Math.max(1,Math.floor(W/.62));for(let i=0;i<n;i++)stool(-W/2+W/n*(i+.5),D/2+.35,g);return}
   if(e.kind==='stairs'){const steps=Math.max(4,Math.round(D/.26));for(let i=0;i<steps;i++)add(box(W,.18*(i+1),.26),textured('oakVeneer','#9a7650',W,.26),0,.09*(i+1),-D/2+.13+i*.26,g);return}
   if(e.kind==='wall'){g.rotation.y=0;g.position.set(e.x+e.length/2,0,e.y+e.width/2);add(box(e.length,Math.max(2.1,e.height),e.width),textured('paint',r.wall,Math.max(e.length,e.width),e.height),0,Math.max(2.1,e.height)/2,0,g);return}
   if(/toilette|wc|cuvette/.test(label))return toilet(g,D);
   if(/douche/.test(label))return shower(g,W,D);
   if(/baignoire|bain\b/.test(label))return bathtub(g,W,D);
   if(/lavabo|vanit|meuble.*(sdb|salle de bain)/.test(label))return vanity(g,W,D);
   if(/évier|evier/.test(label)){cabinets(g,W,D);sinkBasin(g,0,.915,.02,Math.min(W-.1,.75));faucet(g,0,.91,-D/2+.08);return}
   if(/cuisini|four|plaque|range/.test(label))return stove(g,W,D);
   if(/frigo|réfrig|refrig/.test(label))return fridge(g,W,D);
   if(/laveuse|sécheuse|secheuse|lave-vaisselle|lave vaisselle/.test(label))return washer(g,W,D);
   add(rbox(W,Math.max(.35,e.height),D,.03),M.satin,0,Math.max(.35,e.height)/2,0,g);
  }

  // ── rooms ──
  for(const r of live){
   const x=r.x,z=r.y,l=r.length,d=r.width,H=r.height,t=.08;
   const fin:Record<string,FinishChoice>=(plan.finishes||{})[r.id]||{};
   const baseFinish:Finish=r.floorFinish==='tile'?'tile':r.floorFinish==='concrete'?'concrete':'wood';
   const floorLook=lookOf(fin.floor,'floor',{finish:baseFinish as any,color:r.floorFinish==='tile'?(r.furniture==='bath'?'#cfc9be':'#c4bdb1'):r.floor,roughness:baseFinish==='wood'?.42:baseFinish==='tile'?.22:.35,photo:baseFinish==='wood'?{a:'WoodFloor069'}:baseFinish==='tile'?{a:'Tiles027'}:{a:'Concrete048'}});
   const wallLook=lookOf(fin.walls,'walls',{finish:r.wallFinish==='brick'?'brick':'paint',color:r.wall,roughness:.85,photo:r.wallFinish==='brick'?{a:'Bricks025'}:{a:'Plaster001',t:r.wall.toLowerCase()}});
   const ceilLook=lookOf(fin.ceiling,'ceiling',{finish:'paint',color:'#fbfaf7',roughness:.9,photo:{a:'Plaster001',t:'#f7f6f2'}});
   const bathLook=lookOf(fin.bathWalls,'bathWalls',{finish:'wallTile',color:'#eeece7',roughness:.2,photo:{a:'Tiles133A'}});
   const tapLook=fin.taps?lookOf(fin.taps,'taps',{finish:'paint',color:'#e9ecef',roughness:.1}):null;
   cur={fronts:fin.fronts?lookOf(fin.fronts,'fronts',{finish:'paint',color:'#e9e5dd',roughness:.4}):undefined,worktop:fin.worktop?lookOf(fin.worktop,'worktop',{finish:'quartz',color:'#f1efea',roughness:.15}):undefined,splash:fin.splash?lookOf(fin.splash,'splash',{finish:'wallTile',color:'#f4f2ee',roughness:.2}):undefined,vanity:fin.vanity?lookOf(fin.vanity,'vanity',{finish:'paint',color:'#9b7653',roughness:.4}):undefined,taps:tapLook?plain(tapLook.color,{metalness:1,roughness:tapLook.roughness,envMapIntensity:2}):undefined};
   floors.push(add(box(l,.02,d),textured(floorLook.finish as Finish,floorLook.color,l,d,{photo:floorLook.photo,roughness:floorLook.roughness,clearcoat:floorLook.finish==='concrete'?.3:.15,seed:Math.round(x*7+z*13)}),x+l/2,-.01,z+d/2,scene,false));{const c=add(box(l,.04,d),ceilLook.finish==='paint'&&!ceilLook.photo?plain(ceilLook.color,{roughness:.9}):textured(ceilLook.finish as Finish,ceilLook.color,l,d,{photo:ceilLook.photo}),x+l/2,H+.02,z+d/2,scene,false);c.visible=false;ceilings.push(c)}
   if(roof)add(box(l+.2,.15,d+.2),plain('#444a45'),x+l/2,H,z+d/2);
   // Openings on each edge.
   const roomEls=elements.filter(e=>(e.kind==='door'||e.kind==='window')&&inRoom(e,r));
   const edges:{edge:Edge;len:number;ops:Opening[]}[]=(['north','south','west','east'] as Edge[]).map(edge=>({edge,len:edge==='north'||edge==='south'?l:d,ops:[]}));
   for(const e of roomEls){const cx=e.x+e.length/2,cy=e.y+e.width/2;const dist={north:Math.abs(cy-z),south:Math.abs(cy-(z+d)),west:Math.abs(cx-x),east:Math.abs(cx-(x+l))};const edge=(Object.keys(dist) as Edge[]).sort((a,b)=>dist[a]-dist[b])[0];if(dist[edge]>.35)continue;
    const horizontal=edge==='north'||edge==='south';const from=horizontal?e.x-x:e.y-z,to=from+(horizontal?e.length:e.width);const sh=shared(r,edge);
    edges.find(q=>q.edge===edge)!.ops.push(e.kind==='door'?{from:Math.max(.05,from),to:Math.min((horizontal?l:d)-.05,to),kind:'door',bottom:0,top:Math.min(H-.1,2.05),shared:sh}:{from:Math.max(.1,from),to:Math.min((horizontal?l:d)-.1,to),kind:'window',bottom:.9,top:Math.min(H-.25,2.1),shared:sh})}
   if(r.door&&!roomEls.some(e=>e.kind==='door')){const e=edges.find(q=>q.edge==='east')!;const a=Math.min(.86,d*.4);e.ops.push({from:(d-a)/2,to:(d+a)/2,kind:'door',bottom:0,top:2.05,shared:shared(r,'east')})}
   if(r.window&&!roomEls.some(e=>e.kind==='window')){const free=(['north','west','south','east'] as Edge[]).find(q=>!shared(r,q))||'north';const e=edges.find(q=>q.edge===free)!;const len=e.len,a=Math.min(1.4,len*.45);e.ops.push({from:(len-a)/2,to:(len+a)/2,kind:'window',bottom:.9,top:Math.min(H-.25,2.1),shared:false})}
   const bath=r.furniture==='bath';
   for(const {edge,len,ops} of edges){
    ops.sort((a,b)=>a.from-b.from);
    const wall=new T.Group();scene.add(wall);
    // Local frame: x along the edge (0..len), wall inside the room, inner face towards +z.
    if(edge==='north'){wall.position.set(x,0,z+t/2)}else if(edge==='south'){wall.position.set(x+l,0,z+d-t/2);wall.rotation.y=Math.PI}else if(edge==='west'){wall.position.set(x+t/2,0,z+d);wall.rotation.y=Math.PI/2}else{wall.position.set(x+l-t/2,0,z);wall.rotation.y=-Math.PI/2}
    const paint=textured(wallLook.finish as Finish,wallLook.color,len,H,{photo:wallLook.photo,roughness:wallLook.roughness,seed:3});paint.transparent=true;
    const tileMat=bath?textured(bathLook.finish as Finish,bathLook.color,len,1.2,{photo:bathLook.photo,roughness:bathLook.roughness,clearcoat:.5}):null;if(tileMat)tileMat.transparent=true;
    const piece=(a:number,b:number,y0:number,y1:number)=>{if(b-a<.01||y1-y0<.01)return;if(tileMat&&y0<1.2){const top=Math.min(1.2,y1);add(box(b-a,top-y0,t),tileMat,(a+b)/2,(y0+top)/2,0,wall);if(y1>1.2)add(box(b-a,y1-1.2,t),paint,(a+b)/2,(1.2+y1)/2,0,wall)}else add(box(b-a,y1-y0,t),paint,(a+b)/2,(y0+y1)/2,0,wall)};
    let cursor=0;
    for(const o of ops){if(o.to<=cursor)continue;piece(cursor,o.from,0,H);piece(o.from,o.to,0,o.bottom);piece(o.from,o.to,o.top,H);
     const mid=(o.from+o.to)/2,wd=o.to-o.from;
     if(o.kind==='window'){add(box(wd,.05,.06),M.white,mid,o.top+.025,0,wall);add(box(wd+.08,.03,.18),M.white,mid,o.bottom-.015,.05,wall);for(const s of [-1,1])add(box(.05,o.top-o.bottom,.06),M.white,mid+s*(wd/2-.025),(o.top+o.bottom)/2,0,wall);add(box(.04,o.top-o.bottom,.05),M.white,mid,(o.top+o.bottom)/2,0,wall);const gl=add(box(wd-.06,o.top-o.bottom-.05,.01),M.glass,mid,(o.top+o.bottom)/2,0,wall,false);gl.renderOrder=2}
     else{for(const s of [-1,1])add(box(.06,o.top+.06,t+.03),M.white,mid+s*(wd/2+.03),(o.top+.06)/2,0,wall);add(box(wd+.18,.07,t+.03),M.white,mid,o.top+.035,0,wall);
      if(!o.shared){const leaf=new T.Group();leaf.position.set(o.from,0,t/2);leaf.rotation.y=-.5;wall.add(leaf);add(box(wd-.02,o.top-.02,.04),plain('#f3f1ec',{roughness:.4,clearcoat:.2}),(wd-.02)/2,(o.top-.02)/2,0,leaf);handle(leaf,wd-.1,1.0,.04,.12)}}
     cursor=o.to}
    piece(cursor,len,0,H);
    // Baseboard.
    let c=0;for(const o of [...ops.filter(o=>o.kind==='door'),{from:len,to:len} as any]){if(o.from-c>.02)add(box(o.from-c,.09,.012),M.white,(c+o.from)/2,.045,t/2+.006,wall,false);c=o.to}
    const normal=new T.Vector3(0,0,-1).applyAxisAngle(new T.Vector3(0,1,0),wall.rotation.y);const center=new T.Vector3(edge==='north'||edge==='south'?x+l/2:edge==='west'?x:x+l,H/2,edge==='west'||edge==='east'?z+d/2:edge==='north'?z:z+d);
    const wallMats=[paint,tileMat].filter(Boolean);wallFades.push({mesh:wall,mat:wallMats,normal,center});
   }
   // Furniture and fixtures.
   const own=elements.filter(e=>!['door','window','note'].includes(e.kind)&&roomOf(e)===r);
   for(const e of own)fixture(e,r);
   const has=(re:RegExp,kinds:string[]=[])=>own.some(e=>kinds.includes(e.kind)||re.test((e.label||'').toLowerCase()));
   if(r.furniture==='living'&&!has(/canap|sofa/))sofa(r);
   if(r.furniture==='bedroom'&&!has(/lit\b/))bed(r);
   if(r.furniture==='kitchen'&&!has(/./,['counter','island'])){const run={x:x+.15,y:z+t,length:Math.max(1.2,l-.3),width:.64};const {g,W,D}=anchored(run,'north');cabinets(g,W,D);upper(g,W,D);sinkBasin(g,0,.915,.02);faucet(g,0,.91,-D/2+.08);const f=anchored({x:x+l-.15-.8,y:z+t,length:.8,width:.7},'north');fridge(f.g,.8,.7);if(l>3.4&&d>3.2){const isl=anchored({x:x+l/2-.9,y:z+d/2-.2,length:1.8,width:.95},'north');cabinets(isl.g,1.8,.7);add(box(1.84,.03,.99),textured('quartz','#f1efea',1.8,.95,{roughness:.12}),0,.9,.12,isl.g);for(const s of [-.5,0,.5])stool(s,.85,isl.g)}}
   if(r.furniture==='bath'&&!has(/toilette|wc|douche|baignoire|lavabo|vanit/)){toilet(anchored({x:x+.2,y:z+t,length:.42,width:.72},'north').g,.72);const v=anchored({x:x+.75,y:z+t,length:Math.min(.9,l-1.2),width:.5},'north');vanity(v.g,v.W,v.D);if(d>1.6){const s=anchored({x:x+l-1.0-.02,y:z+d-1.0-.02,length:1.0,width:1.0},'south');shower(s.g,1,1)}}
   // Ceiling light per room (warm, soft).
   if(lights<10&&!top){const p=new T.PointLight('#ffd9a8',Math.min(16,l*d*.9),0,2);p.position.set(x+l/2,H-.15,z+d/2);scene.add(p);lights++}
  }

  // ── modes: model (orbit) and realistic walk-through at eye height ──
  let walking=false;let yaw=0,pitch=0;const eye=1.6;const target=new T.Vector3();let goal:any=null;const held=new Set<string>();
  const doors=elements.filter(e=>e.kind==='door').map(e=>new T.Vector2(e.x+e.length/2,e.y+e.width/2));
  const allowed=(px:number,pz:number)=>live.some(r=>px>r.x+.25&&px<r.x+r.length-.25&&pz>r.y+.25&&pz<r.y+r.width-.25)||(live.some(r=>px>r.x-.05&&px<r.x+r.length+.05&&pz>r.y-.05&&pz<r.y+r.width+.05)&&doors.some(d=>Math.hypot(d.x-px,d.y-pz)<.7));
  const modelView=()=>{const a=el.clientWidth,b=el.clientHeight;camera.aspect=a/Math.max(1,b);camera.fov=35;const distance=size*1.35/Math.min(1,camera.aspect);camera.position.set(w/2+(top?0:distance*.7),top?distance*1.7:distance*.95,h/2+(top?.01:distance));controls.target.set(w/2,.6,h/2);camera.updateProjectionMatrix();controls.update()};
  const look=()=>{target.set(camera.position.x+Math.sin(yaw)*Math.cos(pitch),camera.position.y+Math.sin(pitch),camera.position.z+Math.cos(yaw)*Math.cos(pitch));camera.lookAt(target)};
  const enterRoom=(id?:string)=>{const r=live.find(q=>q.id===id)||live.find(q=>q.furniture!=='none')||live[0];if(!r)return;
   // Stand in the corner farthest from fixtures and look across the room.
   const inset=Math.min(.5,r.length*.2,r.width*.2);const corners=[[r.x+inset,r.y+inset],[r.x+r.length-inset,r.y+inset],[r.x+inset,r.y+r.width-inset],[r.x+r.length-inset,r.y+r.width-inset]];
   const stuff=elements.filter(e=>!['door','window','note'].includes(e.kind)&&inRoom(e,r)).map(e=>[e.x+e.length/2,e.y+e.width/2]);
   const score=(c:number[])=>stuff.length?Math.min(...stuff.map(p=>Math.hypot(p[0]-c[0],p[1]-c[1]))):-Math.abs(c[1]-(r.y+r.width));
   const best=corners.sort((a,b)=>score(b)-score(a))[0];
   camera.position.set(best[0],eye,best[1]);yaw=Math.atan2(r.x+r.length/2-best[0],r.y+r.width/2-best[1]);pitch=-.12;goal=null;look()};
  // Photoreal mode: progressive path tracing (real light bounces, soft shadows, reflections) whenever the view is still.
  let grad:any=null;let denoise:any=null;const rasterEnv=scene.environment;
  const ptStart=async()=>{if(pt||!realRef.current)return;try{const {WebGLPathTracer,GradientEquirectTexture,DenoiseMaterial}=await import('three-gpu-pathtracer');const {FullScreenQuad}=await import('three/addons/postprocessing/Pass.js');if(cancelled)return;
    pt=new WebGLPathTracer(renderer);pt.tiles.set(2,2);pt.bounces=5;pt.filterGlossyFactor=.5;pt.minSamples=2;pt.renderDelay=180;pt.fadeDuration=350;pt.dynamicLowRes=false;pt.renderScale=matchMedia('(pointer:coarse)').matches?.5:Math.min(1,1.25/Math.max(1,devicePixelRatio));
    grad=new GradientEquirectTexture();grad.topColor.set('#fbf6ee');grad.bottomColor.set('#8c8577');grad.update();scene.environment=grad;(scene as any).environmentIntensity=.55;
    renderer.toneMappingExposure=.62;scene.traverse((o:any)=>{if(o.isPointLight){o.userData.base??=o.intensity;o.intensity=o.userData.base*.35}});
    // Edge-preserving denoise while samples accumulate, fading out as the image converges.
    denoise=new FullScreenQuad(new DenoiseMaterial({transparent:true,premultipliedAlpha:renderer.getContextAttributes().premultipliedAlpha}));
    pt.renderToCanvasCallback=(target:any,r:any,quad:any)=>{const m=denoise.material;m.map=target.texture;m.opacity=quad.material.opacity;m.sigma=Math.max(1.2,5-pt.samples*.06);m.threshold=.035;m.kSigma=1;const ac=r.autoClear;r.autoClear=false;denoise.render(r);r.autoClear=ac};
    pt.setScene(scene,camera);ptReady=true}catch(e){console.error(e);pt=null}};
  const ptStop=()=>{ptReady=false;try{pt?.dispose();denoise?.dispose()}catch{}pt=null;denoise=null;scene.environment=rasterEnv;(scene as any).environmentIntensity=.38;renderer.toneMappingExposure=.92;scene.traverse((o:any)=>{if(o.isPointLight&&o.userData.base!=null)o.intensity=o.userData.base})};
  let ptReady=false;const lastCam=new T.Matrix4();let lastFov=0;
  const setWalking=(on:boolean,id?:string)=>{walking=on;controls.enabled=!on;ceilings.forEach(c=>c.visible=on);for(const f of wallFades)for(const m of f.mat){m.opacity=1;m.depthWrite=true}
   if(on){camera.fov=62;camera.near=.05;camera.updateProjectionMatrix();enterRoom(id);ptStop();void ptStart()}else{ptStop();modelView()}};
  const saved=view.current;if(saved?.walking){setWalking(true);camera.position.copy(saved.pos);yaw=saved.yaw;pitch=saved.pitch;camera.fov=saved.fov;camera.updateProjectionMatrix();look()}else if(saved){camera.position.copy(saved.pos);controls.target.copy(saved.target);controls.update()}
  api.current={real:(on:boolean)=>{realRef.current=on;if(on&&walking)void ptStart();else ptStop()},samples:()=>ptReady&&pt?Math.floor(pt.samples):-1,visit:id=>setWalking(true,id),model:()=>setWalking(false),hold:(dir,on)=>{if(on)held.add(dir);else held.delete(dir)},zoom:f=>{camera.fov=Math.min(80,Math.max(28,camera.fov*f));camera.updateProjectionMatrix()}};
  // Touch, mouse and keyboard in walk mode.
  const pointers=new Map<number,{x:number;y:number}>();let startDist=0,startFov=62,downAt=0,moved=0;const ray=new T.Raycaster();
  const onDown=(e:PointerEvent)=>{if(!walking)return;renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});downAt=performance.now();moved=0;if(pointers.size===2){const [p,q]=[...pointers.values()];startDist=Math.hypot(p.x-q.x,p.y-q.y);startFov=camera.fov}};
  const onMove=(e:PointerEvent)=>{if(!walking||!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId)!;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved+=Math.abs(dx)+Math.abs(dy);
   if(pointers.size===1){yaw-=dx*.005;pitch=Math.max(-1.2,Math.min(1.2,pitch-dy*.004));look()}
   else if(pointers.size===2){const [p,q]=[...pointers.values()];const dist=Math.hypot(p.x-q.x,p.y-q.y);if(startDist>0){camera.fov=Math.min(80,Math.max(28,startFov*startDist/dist));camera.updateProjectionMatrix()}}};
  const onUp=(e:PointerEvent)=>{if(!walking)return;const wasTap=pointers.size===1&&moved<8&&performance.now()-downAt<350;pointers.delete(e.pointerId);if(pointers.size<2)startDist=0;
   if(wasTap){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObjects(floors,false)[0];if(hit)goal=new T.Vector3(hit.point.x,eye,hit.point.z)}};
  const onWheel=(e:WheelEvent)=>{if(!walking)return;e.preventDefault();camera.fov=Math.min(80,Math.max(28,camera.fov*(e.deltaY>0?1.06:.94)));camera.updateProjectionMatrix()};
  const keys:Record<string,string>={ArrowUp:'f',KeyW:'f',ArrowDown:'b',KeyS:'b',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'};
  const onKey=(e:KeyboardEvent)=>{if(!walking||!keys[e.code])return;e.preventDefault();if(e.type==='keydown')held.add(keys[e.code]);else held.delete(keys[e.code])};
  const cv=renderer.domElement;cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',onUp);cv.addEventListener('wheel',onWheel,{passive:false});window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);
  let first=!saved;const resize=()=>{const a=el.clientWidth,b=el.clientHeight;renderer.setSize(a,b);camera.aspect=a/Math.max(1,b);camera.updateProjectionMatrix();if(pt)pt.updateCamera();if(!walking&&first)modelView();first=true};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let raf=0;const v=new T.Vector3();let last=performance.now();
  const draw=()=>{const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
   if(walking){
    if(held.has('in'))api.current?.zoom(.985);if(held.has('out'))api.current?.zoom(1.015);
    const f=(held.has('f')?1:0)-(held.has('b')?1:0),s=(held.has('r')?1:0)-(held.has('l')?1:0);
    if(f||s){goal=null;const step=1.5*dt;const nx=camera.position.x+(Math.sin(yaw)*f-Math.cos(yaw)*s)*step,nz=camera.position.z+(Math.cos(yaw)*f+Math.sin(yaw)*s)*step;if(allowed(nx,nz))camera.position.set(nx,eye,nz);else if(allowed(nx,camera.position.z))camera.position.x=nx;else if(allowed(camera.position.x,nz))camera.position.z=nz;look()}
    if(goal){camera.position.lerp(goal,Math.min(1,dt*3));if(camera.position.distanceTo(goal)<.03)goal=null;look()}
   }else{controls.update();
    if(!top&&!roof)for(const f of wallFades){v.copy(camera.position).sub(f.center).setY(0);const facing=v.normalize().dot(f.normal);const o=facing>.25?.12:1;for(const m of f.mat)if(Math.abs(m.opacity-o)>.01){m.opacity+=(o-m.opacity)*.25;m.depthWrite=m.opacity>.9}}}
   if(walking&&ptReady&&pt){camera.updateMatrixWorld();if(!lastCam.equals(camera.matrixWorld)||lastFov!==camera.fov){lastCam.copy(camera.matrixWorld);lastFov=camera.fov;pt.updateCamera()}pt.renderSample()}
   else renderer.render(scene,camera);raf=requestAnimationFrame(draw)};draw();
  dispose=()=>{ptStop();clearTimeout(ptMaterialsTimer);grad?.dispose?.();view.current={walking,pos:camera.position.clone(),target:controls.target.clone(),yaw,pitch,fov:camera.fov};cancelAnimationFrame(raf);cv.removeEventListener('pointerdown',onDown);cv.removeEventListener('pointermove',onMove);cv.removeEventListener('pointerup',onUp);cv.removeEventListener('pointercancel',onUp);cv.removeEventListener('wheel',onWheel);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);api.current=null;observer.disconnect();controls.dispose();scene.traverse((o:any)=>{if(o.isMesh)o.geometry.dispose()});mats.forEach(m=>{m.map?.dispose?.();m.normalMap?.dispose?.();m.dispose()});envTex.dispose();pmrem.dispose();clearTextureCache();renderer.dispose();renderer.domElement.remove()};
 }catch(e){console.error(e);setError('La 3D nécessite WebGL sur cet appareil. Le plan 2D reste disponible.')}})();return()=>{cancelled=true;dispose()}},[plan,roof,top]);

 useEffect(()=>{if(mode!=='visit'){setQuality(-1);return}const t=setInterval(()=>setQuality(api.current?.samples()??-1),400);return()=>clearInterval(t)},[mode]);
 async function photoreal(){
  const canvas=host.current?.querySelector('canvas');if(!canvas)return;
  setRender({busy:true});
  try{
   const scale=Math.min(1,1536/Math.max(canvas.width,canvas.height));const c=document.createElement('canvas');c.width=Math.round(canvas.width*scale);c.height=Math.round(canvas.height*scale);c.getContext('2d')!.drawImage(canvas,0,0,c.width,c.height);
   const res=await fetch('/api/visit-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'render',image:c.toDataURL('image/jpeg',.9),description:describePlan(plan)})});
   const out=await res.json().catch(()=>({error:'Réponse invalide du serveur.'}));if(!res.ok)throw new Error(out.error||`Erreur ${res.status}`);
   setRender({busy:false,image:out.image});
  }catch(e){setRender({busy:false,error:(e as Error).message})}
 }

  const rooms=plan.rooms.filter(r=>r.phase!=='remove');
 const toggleFull=async()=>{const el=host.current;if(!el)return;if(!full){setFull(true);try{await el.requestFullscreen?.()}catch{}}else{setFull(false);try{if(document.fullscreenElement)await document.exitFullscreen()}catch{}}};
 const hold=(dir:string)=>({onPointerDown:(e:any)=>{e.preventDefault();api.current?.hold(dir,true)},onPointerUp:()=>api.current?.hold(dir,false),onPointerLeave:()=>api.current?.hold(dir,false),onPointerCancel:()=>api.current?.hold(dir,false),onContextMenu:(e:any)=>e.preventDefault()});
 return <div className={`plan-scene ${mode==='visit'?'is-visit':''} ${full?'is-full':''}`} ref={host} aria-label="Maquette 3D interactive">{error&&<p role="alert">{error}</p>}
  <div className="plan-scene-top">
   {mode==='model'?<button type="button" className="btn primary" onClick={()=>{setMode('visit');api.current?.visit(roomId||undefined)}}>👁 Visite réaliste</button>:<>
    <button type="button" className="btn secondary" onClick={()=>{setMode('model');api.current?.model()}}>← Maquette</button>
    <div className="plan-scene-rooms">{rooms.map(r=><button type="button" key={r.id} className={roomId===r.id?'active':''} onClick={()=>{setRoomId(r.id);api.current?.visit(r.id)}}>{r.name}</button>)}</div>
   </>}
   {onChange&&<button type="button" className="btn secondary" onClick={()=>setPanel(p=>!p)}>🎨 Finitions</button>}
   <button type="button" className="btn secondary plan-scene-full" aria-label={full?'Quitter le plein écran':'Plein écran'} onClick={()=>void toggleFull()}>{full?'✕':'⤢'}</button>
  </div>
  {mode==='visit'&&<>
   <p className="plan-scene-hint">Glissez pour regarder · pincez ou molette pour zoomer · touchez le sol pour avancer{typeof window!=='undefined'&&matchMedia('(pointer:fine)').matches?' · flèches du clavier pour marcher':''}</p>
   <div className="plan-scene-pad" aria-label="Déplacement">
    <button type="button" aria-label="Avancer" className="up" {...hold('f')}>▲</button><button type="button" aria-label="Gauche" className="left" {...hold('l')}>◀</button><button type="button" aria-label="Reculer" className="down" {...hold('b')}>▼</button><button type="button" aria-label="Droite" className="right" {...hold('r')}>▶</button>
   </div>
   <div className="plan-scene-real"><button type="button" aria-pressed={real} onClick={()=>{const on=!real;setReal(on);api.current?.real(on)}}>{real?'✨ Rendu réaliste : activé':'✨ Rendu réaliste : désactivé'}</button>{real&&quality>=0&&<span>{quality<60?`Arrêtez-vous : la lumière réelle se calcule… ${Math.min(99,Math.round(quality/60*100))} %`:'Rendu réaliste ✓'}</span>}</div>
   <div className="plan-scene-zoom"><button type="button" aria-label="Zoomer" {...hold('in')}>＋</button><button type="button" aria-label="Dézoomer" {...hold('out')}>－</button></div>
  </>}

  <div className="plan-scene-actions">
   <button type="button" className="btn primary" disabled={render.busy} onClick={()=>void photoreal()}>{render.busy?'Photo réaliste en cours… (20 à 60 s)':mode==='visit'?'✦ Photo réaliste IA de cette vue':'✦ Rendu photoréaliste IA'}</button>
   <button type="button" className="btn secondary" onClick={()=>{const canvas=host.current?.querySelector('canvas');if(!canvas)return;const a=document.createElement('a');a.download='mgpro-maquette-3d.png';a.href=canvas.toDataURL('image/png');a.click()}}>Télécharger la vue</button>
  </div>
  {panel&&onChange&&<FinishPanel plan={plan} roomId={roomId} onRoom={setRoomId} onChange={onChange} onClose={()=>setPanel(false)}/>}
  {render.error&&<p className="plan-scene-error" role="alert">{render.error}</p>}
  {render.image&&<div className="plan-scene-render" role="dialog" aria-label="Rendu photoréaliste"><img src={render.image} alt="Rendu photoréaliste de la vue 3D"/><div className="button-row"><a className="btn primary" href={render.image} download="mgpro-rendu-photorealiste.png">Télécharger le rendu</a><button type="button" className="btn secondary" onClick={()=>setRender({busy:false})}>Revenir à la 3D</button></div></div>}
 </div>;
}
