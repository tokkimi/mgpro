'use client';
import {useEffect,useRef,useState} from 'react';
import type {Plan,PlanRoom,PlanElement} from '@/lib/plan';
import {bounds} from '@/lib/plan';
import {finishTextures,clearTextureCache,type Finish} from '@/lib/scene-textures';
import {lookOf,describeFinishes,photoUrl,textureDetails,type Look,type FinishChoice,type Photo} from '@/lib/finishes';
import {catalogueModel} from '@/lib/material-library';
import FinishPanel from './finish-panel';
import './plan-studio.css';

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

export default function PlanScene({plan,roof=false,top=false,onChange,onViewOptions}:{plan:Plan;roof?:boolean;top?:boolean;onChange?:(plan:Plan)=>void;onViewOptions?:(options:{roof:boolean;top:boolean})=>void}){
 const studio=useRef<HTMLElement>(null);
 const host=useRef<HTMLDivElement>(null);const [error,setError]=useState('');
 const [assetStatus,setAssetStatus]=useState('');
 const [textureStatus,setTextureStatus]=useState(false);
 const [ready,setReady]=useState(false);
 const [imageUnavailable,setImageUnavailable]=useState(false);
 const fullButton=useRef<HTMLButtonElement>(null);
 const [render,setRender]=useState<{busy:boolean;image?:string;error?:string}>({busy:false});
 const [mode,setMode]=useState<'model'|'visit'>('model');const [full,setFull]=useState(false);const [roomId,setRoomId]=useState('');
 const view=useRef<any>(null);const [panel,setPanel]=useState(false);
 const realRef=useRef(false);const [real,setReal]=useState(false);const [quality,setQuality]=useState(-1);
 const api=useRef<{real:(on:boolean)=>void;samples:()=>number;visit:(id?:string)=>void;model:()=>void;hold:(dir:string,on:boolean)=>void;zoom:(f:number)=>void}|null>(null);
 useEffect(()=>{let dispose=()=>{};let cancelled=false;(async()=>{try{
  const T=await import('three');
  const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
  const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const {RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js');
  const {RectAreaLightUniformsLib}=await import('three/addons/lights/RectAreaLightUniformsLib.js');
  if(cancelled||!host.current)return;const el=host.current;
  setError('');setTextureStatus(false);
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
  const loader=new T.TextureLoader();
  const photoTex=new Map<string,{base:import('three').Texture; ready:Promise<void>}>();
  const failedTextures=new Set<string>();
  const sceneTextures=new Set<import('three').Texture>();
  const anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());

  function photoMaps(photo:Photo,finish:Finish,uw:number,uh:number,mat:import('three').MeshPhysicalMaterial){
   const tile=finish==='wood'?2:finish==='brick'?1.6:finish==='paint'?2.4:finish==='concrete'?2:1.2;
   const {width,height}=textureDetails(photo);
   const size=matchMedia('(pointer:coarse)').matches?768:1024;
   const maps={Color:'map',NormalGL:'normalMap',Roughness:'roughnessMap'} as const;
   const colorUrl=photoUrl(photo,size,'Color');
   function loadMap(map:keyof typeof maps){
    const url=photoUrl(photo,size,map);
    const cached=photoTex.get(url);
    if(cached)return cached;
    let base:import('three').Texture;
    const ready=new Promise<void>((resolve,reject)=>{
     base=loader.load(url,()=>resolve(),undefined,reject);
    });
    const entry={base:base!,ready};
    entry.base.wrapS=entry.base.wrapT=T.RepeatWrapping;
    entry.base.anisotropy=anisotropy;
    if(url===colorUrl)entry.base.colorSpace=T.SRGBColorSpace;
    photoTex.set(url,entry);
    sceneTextures.add(entry.base);
    return entry;
   }
   const color=loadMap('Color');
   for(const map of Object.keys(maps) as (keyof typeof maps)[]){
    const {base,ready}=loadMap(map);
    void Promise.all([color.ready,ready]).then(()=>{
     if(cancelled)return;
     const texture=base.clone();
     texture.repeat.set(uw/(width||tile),uh/(height||tile));
     texture.needsUpdate=true;
     sceneTextures.add(texture);
     mat[maps[map]]=texture;
     if(map==='Color'){
      mat.color.set('#ffffff');
      // A procedural relief does not correspond to the scanned colour image.
      // Keep the surface smooth until its matching normal map is available.
      mat.normalMap=null;
     }
     // The scan already describes the surface roughness; a multiplier of one
     // preserves its measured range instead of changing it for each material.
     if(map==='Roughness')mat.roughness=1;
     if(map==='NormalGL')mat.normalScale.setScalar(finish==='paint'?.24:.65);
     mat.needsUpdate=true;
     texturesChanged();
    }).catch(()=>{
     if(cancelled)return;
     failedTextures.add(urlFor(map));
     setTextureStatus(failedTextures.size>0);
    });
   }
   function urlFor(map:keyof typeof maps){return photoUrl(photo,size,map)}
  }
  const textured=(finish:Finish,color:string,uw:number,uh:number,opts:any={})=>{
   const {seed,photo,...rest}=opts;
   const made=finishTextures(T,finish,color,seed??7);
   const map=made.map.clone(),normalMap=made.normalMap.clone();
   for(const texture of [map,normalMap]){
    texture.repeat.set(uw/made.size[0],uh/made.size[1]);
    texture.anisotropy=anisotropy;
    texture.needsUpdate=true;
    sceneTextures.add(texture);
   }
   const material=keep(new T.MeshPhysicalMaterial({map,normalMap,normalScale:new T.Vector2(.6,.6),roughness:.6,...rest}));
   if(photo)photoMaps(photo,finish,uw,uh,material);
   return material;
  };
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
  RectAreaLightUniformsLib.init();
  let lights=0;

  /** Group in a local frame: x along the wall, +z towards the room, y up; placed on the element footprint. */
  function anchored(e:{x:number;y:number;length:number;width:number},edge:Edge){
   const g=new T.Group();const horizontal=edge==='north'||edge==='south';const W=horizontal?e.length:e.width,D=horizontal?e.width:e.length;
   g.position.set(e.x+e.length/2,0,e.y+e.width/2);g.rotation.y=edge==='north'?0:edge==='south'?Math.PI:edge==='west'?Math.PI/2:-Math.PI/2;scene.add(g);return {g,W,D};
  }
  const handle=(g:any,x:number,y:number,z:number,len=.14,vertical=false)=>{const m=add(cyl(.006,.006,len,10),M.chrome,x,y,z,g);if(!vertical)m.rotation.z=Math.PI/2};

  // ── fixtures ──
  let cur:{fronts?:Look;worktop?:Look;splash?:Look;taps?:any;vanity?:Look}={};
  const topMat=(W:number,D:number)=>cur.worktop?textured(cur.worktop.finish as Finish,cur.worktop.color,W,D,{photo:cur.worktop.photo,roughness:cur.worktop.roughness,metalness:cur.worktop.metal?.94:0,clearcoat:cur.worktop.roughness<.4?.4:.06}):textured('quartz','#f1efea',W,D,{photo:{a:'Marble012'},roughness:.15,clearcoat:.6});
  const frontMat=(front:string,w:number,h:number)=>{const look=[cur.fronts,cur.vanity].find(f=>f&&f.photo&&f.color===front);return look?textured(look.finish as Finish,front,w,h,{photo:look.photo,roughness:.35,clearcoat:.25}):plain(front,{roughness:.35,clearcoat:.25})};
  function cabinets(g:any,W:number,D:number,H=.88,front=cur.fronts?.color||'#e9e5dd',top=true,sink=false,sinkX=0){
   add(box(W,.1,D-.06),M.black,0,.05,-.03,g);
   const bodyHeight=H-(sink?.31:.13);
   add(box(W,bodyHeight,D-.02),plain(front,{roughness:.4,clearcoat:.2}),0,.1+bodyHeight/2,-.01,g);
   const n=Math.max(1,Math.round(W/.6));for(let i=0;i<n;i++){const x=-W/2+W/n*(i+.5);add(box(W/n-.006,H-.15,.006),frontMat(front,W/n,H-.15),x,.1+(H-.13)/2,D/2-.008,g);handle(g,x,H-.12,D/2+.01)}
   if(top&&!sink)add(rbox(W+.02,.03,D+.03,.006),topMat(W,D),0,H+.015,.005,g);
   if(top&&sink)sinkWorktop(g,W,D,H,sinkX);
  }
  function upper(g:any,W:number,D:number,front=cur.fronts?.color||'#e9e5dd'){
   const count=Math.max(1,Math.round(W/.6)),width=W/count;
   for(let i=0;i<count;i++){
    const x=(i+.5)*width-W/2;
    add(rbox(width-.005,.72,.34,.004),frontMat(front,width,.72),x,1.86,-D/2+.17,g);
    handle(g,x+width*.38,1.55,-D/2+.35,.12,true);
   }
   const splash=cur.splash;
   const material=splash?textured(splash.finish as Finish,splash.color,W,.55,{photo:splash.photo,roughness:splash.roughness,metalness:splash.metal?.94:0}):textured('wallTile','#f4f2ee',W,.55,{photo:{a:'Tiles133A'}});
   add(box(W,.55,.01),material,0,1.18,-D/2+.005,g);
  }
  function faucet(g:any,x:number,y:number,z:number,tall=.32){add(cyl(.018,.022,tall,16),(cur.taps||M.chrome),x,y+tall/2,z,g);const arc=add(new T.TorusGeometry(.09,.013,10,24,Math.PI),(cur.taps||M.chrome),x,y+tall,z+.09,g);arc.rotation.y=Math.PI/2;arc.rotation.x=0}
  function sinkWorktop(g:import('three').Group,W:number,D:number,H:number,sinkX:number){
   const bowlWidth=Math.min(.64,W*.76),bowlDepth=Math.min(.43,D*.72),z=D*.025;
   const x=Math.min(W/2-bowlWidth*.57,Math.max(-W/2+bowlWidth*.57,sinkX));
   const top=new T.Shape();
   top.moveTo(-W/2-.01,-D/2-.015);top.lineTo(W/2+.01,-D/2-.015);
   top.lineTo(W/2+.01,D/2+.015);top.lineTo(-W/2-.01,D/2+.015);top.closePath();

   // Rounded rectangular profile shared by the countertop cutout and the pressed steel bowl.
   function profile(width:number,depth:number,angle:number){
    const x=Math.cos(angle),y=Math.sin(angle);
    return new T.Vector2(Math.sign(x)*Math.sqrt(Math.abs(x))*width/2,Math.sign(y)*Math.sqrt(Math.abs(y))*depth/2);
   }
   const steps=64,hole=new T.Path();
   for(let i=0;i<steps;i++){
    const point=profile(bowlWidth,bowlDepth,-i*2*Math.PI/steps);
    if(i===0)hole.moveTo(point.x+x,point.y-z);else hole.lineTo(point.x+x,point.y-z);
   }
   hole.closePath();top.holes.push(hole);
   const stone=new T.ExtrudeGeometry(top,{depth:.03,bevelEnabled:false});
   const {position,uv}=stone.attributes;
   for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/W+.5,position.getY(i)/D+.5);
   const slab=add(stone,topMat(W,D),0,H,0,g);
   slab.rotation.x=-Math.PI/2;

   const levels=[[1.045,.002],[1,.002],[.96,-.016],[.89,-.125],[.79,-.15],[.08,-.152],[0,-.152]];
   const vertices:number[]=[],indices:number[]=[];
   for(const [scale,y] of levels)for(let i=0;i<steps;i++){
    const point=profile(bowlWidth*scale,bowlDepth*scale,i*2*Math.PI/steps);
    vertices.push(point.x,y,point.y);
   }
   for(let ring=0;ring<levels.length-1;ring++)for(let i=0;i<steps;i++){
    const a=ring*steps+i,b=ring*steps+(i+1)%steps,c=b+steps,d=a+steps;
    indices.push(a,b,c,a,c,d);
   }
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
   geometry.setIndex(indices);geometry.computeVertexNormals();
   add(geometry,plain('#c5c9cc',{metalness:.93,roughness:.28,side:T.DoubleSide}),x,H+.03,z,g);
   add(cyl(.022,.022,.004,24),M.blackMetal,x,H-.12,z,g);
   faucet(g,x,H+.03,-D/2+.07,.23);
  }
  // Versioned, CC0 equipment models. Scale their bounds to the plan footprint in metres.
  const modelLoader=new GLTFLoader();
  const modelCache=new Map<string,Promise<import('three').Group>>();
  const modelJobs:Promise<void>[]=[];
  const modelGeometry=new Set<import('three').BufferGeometry>();
  const unavailable=new Set<string>();
  function model(name:string,parent:import('three').Object3D,x:number,y:number,z:number,
   dimensions:Partial<{width:number;height:number;depth:number}>={},lod=0){
   let pending=modelCache.get(name);
   if(!pending){
    pending=modelLoader.loadAsync(`/api/plan-model/${name}?lod=${lod}`).catch(()=>modelLoader.loadAsync(`https://tevy.dev/models/${name}/v1/lod${lod}.glb`)).then(({scene:source})=>{
     source.traverse(object=>{
      if(!(object instanceof T.Mesh))return;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      if(cancelled){
       object.geometry.dispose();
       for(const material of materials){
        for(const value of Object.values(material))if(value instanceof T.Texture)value.dispose();
        material.dispose();
       }
       return;
      }
      modelGeometry.add(object.geometry);
      for(const material of materials){
       if(!mats.includes(material))keep(material);
       for(const value of Object.values(material))if(value instanceof T.Texture){
        value.anisotropy=anisotropy;
        sceneTextures.add(value);
       }
      }
     });
     return source;
    });
    modelCache.set(name,pending);
   }
   const placed=pending.then(source=>{
    if(cancelled)return;
    const object=source.clone(true);
    const bounds=new T.Box3().setFromObject(object);
    const size=bounds.getSize(new T.Vector3());
    const center=bounds.getCenter(new T.Vector3());
    const root=new T.Group();
    root.position.set(x,y,z);
    root.scale.set(dimensions.width?dimensions.width/size.x:1,dimensions.height?dimensions.height/size.y:1,dimensions.depth?dimensions.depth/size.z:1);
    object.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));
    object.traverse(child=>{
     if(!(child instanceof T.Mesh))return;
     child.castShadow=true;
     child.receiveShadow=true;
    });
    root.add(object);
    parent.add(root);
   }).catch(()=>{unavailable.add(name)});
   modelJobs.push(placed);
   return placed;
  }
  function toilet(g:import('three').Group,D:number){
   const depth=Math.min(D,.68);
   model('toilet',g,0,0,-(D-depth)/2,{depth});
  }
  function shower(g:import('three').Group,W:number,D:number){model('shower-enclosure',g,0,0,0,{width:W,depth:D},1)}
  function bathtub(g:import('three').Group,W:number,D:number){model('bathtub',g,0,0,0,{width:W,depth:D})}
  function vanity(g:import('three').Group,W:number,D:number){
   const selected=cur.vanity;
   const taps=cur.taps;
   const finish=selected?frontMat(selected.color,W,.42):undefined;
   const ready=model('bathroom-vanity',g,0,.43,0,{width:W,depth:D});
   modelJobs.push(ready.then(()=>{
    if(cancelled||(!finish&&!taps))return;
    g.traverse(object=>{
     if(!(object instanceof T.Mesh))return;
     if(finish&&/^drawer_mesh$/i.test(object.name))object.material=finish;
     if(taps&&/tap|faucet/i.test(object.name))object.material=taps;
    });
   }));
  }
  function stove(g:import('three').Group,W:number,D:number){model('cooker',g,0,0,0,{width:W,depth:D})}
  function fridge(g:import('three').Group,W:number,D:number){model('refrigerator',g,0,0,0,{width:W,depth:D})}
  function washer(g:import('three').Group,W:number,D:number){model('washing-machine',g,0,0,0,{width:W,depth:D})}
  function stool(x:number,z:number,parent:import('three').Group){model('bar-stool',parent,x,0,z)}
  function sofa(r:PlanRoom){
   const W=Math.min(2.3,r.length*.6),D=.95;
   const {g}=anchored({x:r.x+r.length/2-W/2,y:r.y+r.width-D-.15,length:W,width:D},'south');
   model('sofa',g,0,0,0,{width:W,depth:D});
   model('round-jute-rug',g,0,.004,1.05,{width:Math.min(r.length*.75,2.8),depth:Math.min(r.width*.6,2)},1);
   model('coffee-table',g,0,.014,1.05,{width:Math.min(1.1,W),depth:.6});
   if(r.length>3)model('floor-lamp',g,W/2+.32,0,-.32,{width:.65,depth:.55});
  }
  function plant(x:number,z:number,height=1.1){model('potted-houseplant',scene,x,0,z,{height})}
  function art(g:import('three').Group,x:number,y:number,z:number,width=.9,height=.65){
   model('framed-abstract-print',g,x,y-height/2,z,{width,height,depth:.035});
  }
  function bed(r:PlanRoom){
   const width=Math.min(1.6,r.length*.6),depth=Math.min(2.1,r.width*.7);
   const {g}=anchored({x:r.x+r.length/2-width/2,y:r.y+.08,length:width,width:depth},'north');
   model('double-bed',g,0,0,0,{width,depth});
   if(r.length>width+1.2)for(const side of [-1,1]){
    const x=side*(width/2+.34),z=-depth/2+.2;
    model('nightstand',g,x,0,z,{width:.44,height:.51,depth:.4});
    model('table-lamp',g,x,.51,z,{height:.38});
   }
  }

  const sinkLabel=(label:string)=>/évier|evier/i.test(label);
  const pairedSink=(counter:PlanElement)=>elements.find(item=>item.kind==='fixture'&&sinkLabel(item.label)&&
   item.x+item.length/2>=counter.x&&item.x+item.length/2<=counter.x+counter.length&&
   item.y+item.width/2>=counter.y&&item.y+item.width/2<=counter.y+counter.width);
  function fixture(e:PlanElement,r:PlanRoom){
   const label=(e.label||'').toLowerCase();const edge=nearestEdge(e,r);const {g,W,D}=anchored(e,edge);
   const picked=e.modelId?catalogueModel(e.modelId):undefined;
   if(e.kind==='fixture'&&picked){
    if(picked.slug==='kitchen-base-unit-sink'){if(!elements.some(counter=>counter.kind==='counter'&&pairedSink(counter)?.id===e.id))cabinets(g,W,D,.88,undefined,true,true);return}
    const elevation=({
     'bathroom-vanity':.43,'white-kitchen-wall-cabinet':1.5,'range-hood':1.5,'round-brass-mirror':1.2,
     'white-roller-blind':1.1,'brass-wall-sconce':1.7,'white-panel-radiator':.12,'dome-pendant-lamp':Math.max(1.85,r.height-.55),
    } as Record<string,number>)[picked.slug]||0;
    return model(picked.slug,g,0,elevation,0,{width:W,depth:D,height:e.height||undefined},picked.slug==='shower-enclosure'?1:0);
   }
   if(e.kind==='counter'){
    const sink=pairedSink(e);
    g.updateMatrixWorld(true);
    const offset=sink?g.worldToLocal(new T.Vector3(sink.x+sink.length/2,0,sink.y+sink.width/2)).x:0;
    cabinets(g,W,D,.88,undefined,true,!!sink||sinkLabel(label),offset);const clash=elements.some(o=>o.kind==='window'&&inRoom(o,r)&&nearestEdge(o,r)===edge&&(edge==='north'||edge==='south'?o.x<e.x+e.length&&o.x+o.length>e.x:o.y<e.y+e.width&&o.y+o.width>e.y));if(!/îlot|ilot/.test(label)&&!clash)upper(g,W,D);return}
   if(e.kind==='island'){cabinets(g,W,Math.max(.6,D-.25),.88,undefined,false);add(rbox(W+.04,.03,D+.04,.006),topMat(W,D),0,.895,.1,g);const n=Math.max(1,Math.floor(W/.62));for(let i=0;i<n;i++)stool(-W/2+W/n*(i+.5),D/2+.35,g);return}
   if(e.kind==='stairs')return model('oak-interior-staircase',g,0,0,0,{width:W,depth:D,height:e.height||undefined});
   if(e.kind==='wall'){g.rotation.y=0;g.position.set(e.x+e.length/2,0,e.y+e.width/2);add(box(e.length,Math.max(2.1,e.height),e.width),textured('paint',r.wall,Math.max(e.length,e.width),e.height,{photo:{a:'PaintedPlaster017',t:r.wall}}),0,Math.max(2.1,e.height)/2,0,g);return}
   if(/toilette|wc|cuvette/.test(label))return toilet(g,D);
   if(/douche/.test(label))return shower(g,W,D);
   if(/baignoire|bain\b/.test(label))return bathtub(g,W,D);
   if(/lavabo.*colonne/.test(label))return model('pedestal-washbasin',g,0,0,0,{width:W,depth:D});
   if(/lavabo|vanit|meuble.*(sdb|salle de bain)|meuble.vasque/.test(label))return vanity(g,W,D);
   if(sinkLabel(label)){if(!elements.some(counter=>counter.kind==='counter'&&pairedSink(counter)?.id===e.id))cabinets(g,W,D,.88,undefined,true,true);return}
   if(/cuisini|four|plaque|range/.test(label))return stove(g,W,D);
   if(/frigo|réfrig|refrig/.test(label))return fridge(g,W,D);
   if(/laveuse|lave-linge|machine à laver/.test(label))return washer(g,W,D);
   if(/canap|sofa/.test(label))return model(/angle/.test(label)?'corner-sofa':'sofa',g,0,0,0,{width:W,depth:D});
   if(/lit\b/.test(label))return model('double-bed',g,0,0,0,{width:W,depth:D});
   if(/table.*chevet/.test(label))return model('nightstand',g,0,0,0,{width:W,depth:D});
   if(/table.*basse/.test(label))return model('coffee-table',g,0,0,0,{width:W,depth:D});
   if(/table/.test(label))return model('dining-table',g,0,0,0,{width:W,depth:D});
   if(/chaise/.test(label))return model('dining-chair',g,0,0,0,{width:W,depth:D});
   if(/fauteuil/.test(label))return model('armchair',g,0,0,0,{width:W,depth:D});
   if(/tabouret/.test(label))return model('bar-stool',g,0,0,0,{width:W,depth:D});
   if(/penderie/.test(label))return model('wardrobe',g,0,0,0,{width:W,depth:D});
   if(/commode/.test(label))return model('chest-of-drawers',g,0,0,0,{width:W,depth:D});
   if(/armoire.*haute/.test(label))return model('white-kitchen-wall-cabinet',g,0,1.5,0,{width:W,depth:D});
   if(/armoire/.test(label))return model('wardrobe',g,0,0,0,{width:W,depth:D});
   if(/hotte/.test(label))return model('range-hood',g,0,1.5,0,{width:W,depth:D});
   if(/radiateur/.test(label))return model('white-panel-radiator',g,0,.12,0,{width:W,depth:D});
   if(/lampadaire/.test(label))return model('floor-lamp',g,0,0,0);
   if(/miroir/.test(label))return model('round-brass-mirror',g,0,1.2,0,{width:W});
   if(/suspension/.test(label))return model('dome-pendant-lamp',g,0,Math.max(1.85,r.height-.55),0,{width:W,depth:D});
   if(/applique/.test(label))return model('brass-wall-sconce',g,0,1.7,0);
   unavailable.add(e.label||'équipement');
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
    // Keep a common UV origin for each wall, including the strips above and below openings.
    const wallPiece=(a:number,b:number,bottom:number,top:number,material:import('three').Material,uvHeight:number)=>{
     const width=b-a,height=top-bottom;
     if(width<.01||height<.01)return;
     const geometry=box(width,height,t);
     const {position,uv,normal}=geometry.attributes;
     const centerX=(a+b)/2,centerY=(bottom+top)/2;
     for(let i=0;i<uv.count;i++){
      if(normal.getZ(i)===0)continue;
      const u=(position.getX(i)+centerX)/len;
      uv.setXY(i,normal.getZ(i)>0?u:1-u,(position.getY(i)+centerY)/uvHeight);
     }
     add(geometry,material,centerX,centerY,0,wall);
    };
    const piece=(a:number,b:number,y0:number,y1:number)=>{
     if(tileMat&&y0<1.2){
      wallPiece(a,b,y0,Math.min(1.2,y1),tileMat,1.2);
      wallPiece(a,b,1.2,y1,paint,H);
     }else wallPiece(a,b,y0,y1,paint,H);
    };
    let cursor=0;
    for(const o of ops){if(o.to<=cursor)continue;piece(cursor,o.from,0,H);piece(o.from,o.to,0,o.bottom);piece(o.from,o.to,o.top,H);
     const mid=(o.from+o.to)/2,wd=o.to-o.from;
     if(o.kind==='window'){add(box(wd,.05,.06),M.white,mid,o.top+.025,0,wall);add(box(wd+.08,.03,.18),M.white,mid,o.bottom-.015,.05,wall);for(const s of [-1,1])add(box(.05,o.top-o.bottom,.06),M.white,mid+s*(wd/2-.025),(o.top+o.bottom)/2,0,wall);add(box(.04,o.top-o.bottom,.05),M.white,mid,(o.top+o.bottom)/2,0,wall);const gl=add(box(wd-.06,o.top-o.bottom-.05,.01),M.glass,mid,(o.top+o.bottom)/2,0,wall,false);gl.renderOrder=2}
     if(o.kind==='window'&&!o.shared&&wd>.12&&o.top-o.bottom>.12){
      const daylight=new T.RectAreaLight('#f4f7ff',4.5,wd-.1,o.top-o.bottom-.1);
      daylight.position.set(mid,(o.top+o.bottom)/2,.055);
      daylight.rotation.y=Math.PI;
      wall.add(daylight);
     }
     else if(o.kind==='door'){for(const s of [-1,1])add(box(.06,o.top+.06,t+.03),M.white,mid+s*(wd/2+.03),(o.top+.06)/2,0,wall);add(box(wd+.18,.07,t+.03),M.white,mid,o.top+.035,0,wall);
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
   if(r.furniture==='living'&&!has(/canap|sofa/)){sofa(r);plant(x+.45,z+.45,1.3);const wa=anchored({x:x+l/2-.5,y:z+d-.06,length:1,width:.05},'south');art(wa.g,0,1.55,0,1.1,.75)}
   if(r.furniture==='bedroom'&&!has(/lit\b/)){bed(r);plant(x+l-.4,z+d-.4,1);const wa=anchored({x:x+l/2-.45,y:z+t,length:.9,width:.05},'north');art(wa.g,0,1.55,0,.9,.6)}
   if(r.furniture==='kitchen'&&!has(/./,['counter','island'])){const run={x:x+.15,y:z+t,length:Math.max(1.2,l-.3),width:.64};const {g,W,D}=anchored(run,'north');cabinets(g,W,D,.88,undefined,true,true);upper(g,W,D);const f=anchored({x:x+l-.15-.8,y:z+t,length:.8,width:.7},'north');fridge(f.g,.8,.7);if(l>3.4&&d>3.2){const isl=anchored({x:x+l/2-.9,y:z+d/2-.2,length:1.8,width:.95},'north');cabinets(isl.g,1.8,.7,.88,undefined,false);add(rbox(1.84,.03,.99,.006),topMat(1.8,.95),0,.895,.12,isl.g);for(const s of [-.5,0,.5])stool(s,.85,isl.g)}}
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
  let grad:any=null;let denoise:any=null;let ptBg:any=null;const rasterEnv=scene.environment;
  const ptStart=async()=>{if(pt||!realRef.current)return;try{const {WebGLPathTracer,GradientEquirectTexture,DenoiseMaterial}=await import('three-gpu-pathtracer');const {FullScreenQuad}=await import('three/addons/postprocessing/Pass.js');if(cancelled||pt||!walking||!realRef.current||!modelsReady)return;
    pt=new WebGLPathTracer(renderer);pt.tiles.set(1,1);pt.bounces=6;pt.filterGlossyFactor=.5;pt.minSamples=18;pt.renderDelay=240;pt.fadeDuration=350;pt.dynamicLowRes=false;pt.renderScale=matchMedia('(pointer:coarse)').matches?.5:Math.min(1,1.25/Math.max(1,devicePixelRatio));
    grad??=new GradientEquirectTexture();grad.topColor.set('#fbf6ee');grad.bottomColor.set('#8c8577');grad.update();scene.environment=grad;(scene as any).environmentIntensity=1.25;
    renderer.toneMappingExposure=.92;ptBg=scene.background;scene.background=new T.Color('#f3efe8');
    // Edge-preserving denoise while samples accumulate, fading out as the image converges.
    denoise=new FullScreenQuad(new DenoiseMaterial({transparent:true,premultipliedAlpha:renderer.getContextAttributes().premultipliedAlpha}));
    pt.renderToCanvasCallback=(target:any,r:any,quad:any)=>{const m=denoise.material;m.map=target.texture;m.opacity=quad.material.opacity;m.sigma=Math.max(.8,3-pt.samples*.065);m.threshold=Math.max(.035,.18-pt.samples*.004);m.kSigma=1;const ac=r.autoClear;r.autoClear=false;denoise.render(r);r.autoClear=ac};
    pt.setScene(scene,camera);scene.environment=rasterEnv;scene.background=ptBg;scene.environmentIntensity=.38;ptReady=true}catch(e){console.error(e);ptStop();realRef.current=false;setReal(false)}};
  const ptStop=()=>{ptReady=false;if(ptBg){scene.background=ptBg;ptBg=null}try{pt?.dispose();denoise?.dispose()}catch{}pt=null;denoise=null;scene.environment=rasterEnv;(scene as any).environmentIntensity=.38;renderer.toneMappingExposure=.92;ceilings.forEach(c=>c.visible=walking);scene.traverse((o:any)=>{if(o.isPointLight&&o.userData.base!=null)o.intensity=o.userData.base})};
  let modelsReady=modelJobs.length===0;
  setAssetStatus(modelsReady?'':'Chargement des modèles 3D…');
  void Promise.all(modelJobs).then(()=>{
   if(cancelled)return;
   modelsReady=true;
   setAssetStatus(unavailable.size?`Modèle 3D indisponible : ${[...unavailable].join(', ')}.`:'');
   if(walking&&realRef.current)void ptStart();
  });
  let ptReady=false;const lastCam=new T.Matrix4();let lastFov=0;
  const setWalking=(on:boolean,id?:string)=>{walking=on;controls.enabled=!on;ceilings.forEach(c=>c.visible=on);for(const f of wallFades)for(const m of f.mat){m.opacity=1;m.depthWrite=true}
   if(on){camera.fov=62;camera.near=.05;camera.updateProjectionMatrix();enterRoom(id);ptStop();void ptStart()}else{ptStop();modelView()}};
  const saved=view.current;if(saved?.walking){setWalking(true);camera.position.copy(saved.pos);yaw=saved.yaw;pitch=saved.pitch;camera.fov=saved.fov;camera.updateProjectionMatrix();look()}else if(saved){camera.position.copy(saved.pos);controls.target.copy(saved.target);controls.update()}
  api.current={real:(on:boolean)=>{realRef.current=on;if(on&&walking)void ptStart();else ptStop()},samples:()=>ptReady&&pt?Math.floor(pt.samples):-1,visit:id=>setWalking(true,id),model:()=>setWalking(false),hold:(dir,on)=>{if(on)held.add(dir);else held.delete(dir)},zoom:f=>{camera.fov=Math.min(80,Math.max(28,camera.fov*f));camera.updateProjectionMatrix()}};
  // Touch, mouse and keyboard in walk mode.
  const pointers=new Map<number,{x:number;y:number}>();let startDist=0,startFov=62,downAt=0,moved=0;const ray=new T.Raycaster();
  const onDown=(e:PointerEvent)=>{if(!walking)return;el.focus({preventScroll:true});renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});downAt=performance.now();moved=0;if(pointers.size===2){const [p,q]=[...pointers.values()];startDist=Math.hypot(p.x-q.x,p.y-q.y);startFov=camera.fov}};
  const onMove=(e:PointerEvent)=>{if(!walking||!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId)!;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved+=Math.abs(dx)+Math.abs(dy);
   if(pointers.size===1){yaw-=dx*.005;pitch=Math.max(-1.2,Math.min(1.2,pitch-dy*.004));look()}
   else if(pointers.size===2){const [p,q]=[...pointers.values()];const dist=Math.hypot(p.x-q.x,p.y-q.y);if(startDist>0){camera.fov=Math.min(80,Math.max(28,startFov*startDist/dist));camera.updateProjectionMatrix()}}};
  const onUp=(e:PointerEvent)=>{if(!walking)return;const wasTap=pointers.size===1&&moved<8&&performance.now()-downAt<350;pointers.delete(e.pointerId);if(pointers.size<2)startDist=0;
   if(wasTap){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObjects(floors,false)[0];if(hit)goal=new T.Vector3(hit.point.x,eye,hit.point.z)}};
  const onWheel=(e:WheelEvent)=>{if(!walking)return;e.preventDefault();camera.fov=Math.min(80,Math.max(28,camera.fov*(e.deltaY>0?1.06:.94)));camera.updateProjectionMatrix()};
  const keys:Record<string,string>={ArrowUp:'f',KeyW:'f',ArrowDown:'b',KeyS:'b',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'};
  const onKey=(e:KeyboardEvent)=>{if(!walking||!keys[e.code])return;e.preventDefault();if(e.type==='keydown')held.add(keys[e.code]);else held.delete(keys[e.code])};
  const clearHeld=()=>held.clear();
  const cv=renderer.domElement;cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',onUp);cv.addEventListener('wheel',onWheel,{passive:false});el.addEventListener('keydown',onKey);el.addEventListener('keyup',onKey);el.addEventListener('blur',clearHeld);window.addEventListener('blur',clearHeld);
  let first=!saved;const resize=()=>{const a=el.clientWidth,b=el.clientHeight;renderer.setSize(a,b);camera.aspect=a/Math.max(1,b);camera.updateProjectionMatrix();if(pt)pt.updateCamera();if(!walking&&first)modelView();first=true};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let raf=0;const v=new T.Vector3();let last=performance.now(),lastMotion=last;
  const draw=()=>{const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
   if(walking){
    if(held.has('in'))api.current?.zoom(.985);if(held.has('out'))api.current?.zoom(1.015);
    const f=(held.has('f')?1:0)-(held.has('b')?1:0),s=(held.has('r')?1:0)-(held.has('l')?1:0);
    if(f||s){goal=null;const step=1.5*dt;const nx=camera.position.x+(Math.sin(yaw)*f-Math.cos(yaw)*s)*step,nz=camera.position.z+(Math.cos(yaw)*f+Math.sin(yaw)*s)*step;if(allowed(nx,nz))camera.position.set(nx,eye,nz);else if(allowed(nx,camera.position.z))camera.position.x=nx;else if(allowed(camera.position.x,nz))camera.position.z=nz;look()}
    if(goal){camera.position.lerp(goal,Math.min(1,dt*3));if(camera.position.distanceTo(goal)<.03)goal=null;look()}
   }else{controls.update();
    if(!top&&!roof)for(const f of wallFades){v.copy(camera.position).sub(f.center).setY(0);const facing=v.normalize().dot(f.normal);const o=facing>.25?.12:1;for(const m of f.mat)if(Math.abs(m.opacity-o)>.01){m.opacity+=(o-m.opacity)*.25;m.depthWrite=m.opacity>.9}}}
   if(walking&&ptReady&&pt){
    camera.updateMatrixWorld();
    if(!lastCam.equals(camera.matrixWorld)||lastFov!==camera.fov){
     lastCam.copy(camera.matrixWorld);lastFov=camera.fov;lastMotion=now;pt.updateCamera();
    }
    if(pointers.size||now-lastMotion<350)renderer.render(scene,camera);
    else if(pt.samples<60)pt.renderSample();
   }
   else renderer.render(scene,camera);raf=requestAnimationFrame(draw)};draw();setReady(true);
  dispose=()=>{ptStop();clearTimeout(ptMaterialsTimer);grad?.dispose?.();view.current={walking,pos:camera.position.clone(),target:controls.target.clone(),yaw,pitch,fov:camera.fov};cancelAnimationFrame(raf);cv.removeEventListener('pointerdown',onDown);cv.removeEventListener('pointermove',onMove);cv.removeEventListener('pointerup',onUp);cv.removeEventListener('pointercancel',onUp);cv.removeEventListener('wheel',onWheel);el.removeEventListener('keydown',onKey);el.removeEventListener('keyup',onKey);el.removeEventListener('blur',clearHeld);window.removeEventListener('blur',clearHeld);api.current=null;observer.disconnect();controls.dispose();scene.traverse((o:any)=>{if(o.isMesh&&!modelGeometry.has(o.geometry))o.geometry.dispose()});modelGeometry.forEach(geometry=>geometry.dispose());mats.forEach(m=>m.dispose());sceneTextures.forEach(texture=>texture.dispose());envTex.dispose();pmrem.dispose();clearTextureCache();renderer.dispose();renderer.domElement.remove()};
 }catch(e){console.error(e);setReady(false);setError('La 3D nécessite WebGL sur cet appareil. Le plan 2D reste disponible.')}})();return()=>{cancelled=true;dispose()}},[plan,roof,top]);

 useEffect(()=>{if(mode!=='visit'){setQuality(-1);return}const t=setInterval(()=>setQuality(api.current?.samples()??-1),400);return()=>clearInterval(t)},[mode]);
 async function photoreal(){
  const canvas=host.current?.querySelector('canvas');if(!canvas)return;
  setRender({busy:true});
  try{
   const scale=Math.min(1,1536/Math.max(canvas.width,canvas.height));const c=document.createElement('canvas');c.width=Math.round(canvas.width*scale);c.height=Math.round(canvas.height*scale);c.getContext('2d')!.drawImage(canvas,0,0,c.width,c.height);
   const res=await fetch('/api/visit-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'render',image:c.toDataURL('image/jpeg',.9),description:describePlan(plan)})});
   const out=await res.json().catch(()=>({error:'Réponse invalide du serveur.'}));if(!res.ok){
    if(res.status===402||/crédits|credits|free tier/i.test(out.error||'')){
     setImageUnavailable(true);
     throw new Error('La photo IA est indisponible sur ce compte. Vous pouvez télécharger la vue 3D.');
    }
    throw new Error(res.status===401||res.status===403?'Connectez-vous à un compte autorisé pour créer une photo IA.':'La photo IA n’a pas pu être créée. Réessayez ou téléchargez la vue 3D.');
   }
   setRender({busy:false,image:out.image});
  }catch(e){setRender({busy:false,error:(e as Error).message})}
 }

 const rooms=plan.rooms.filter(room=>room.phase!=='remove');
 const selectedRoom=rooms.find(room=>room.id===roomId)||rooms.find(room=>room.furniture!=='none')||rooms[0];
 useEffect(()=>{
  const onFullscreenChange=()=>{if(!document.fullscreenElement)setFull(false)};
  document.addEventListener('fullscreenchange',onFullscreenChange);
  return()=>document.removeEventListener('fullscreenchange',onFullscreenChange);
 },[]);
 useEffect(()=>{
  if(!full)return;
  const onEscape=(event:KeyboardEvent)=>{
   if(event.key!=='Escape'||document.fullscreenElement)return;
   event.preventDefault();event.stopPropagation();setFull(false);fullButton.current?.focus();
  };
  document.addEventListener('keydown',onEscape,true);
  return()=>document.removeEventListener('keydown',onEscape,true);
 },[full]);
 async function toggleFull(){
  const el=studio.current;
  if(!el)return;
  if(full){
   if(document.fullscreenElement===el)await document.exitFullscreen().catch(()=>{});
   setFull(false);return;
  }
  setFull(true);
  try{await el.requestFullscreen?.()}catch{ /* The expanded layout also works without native fullscreen. */ }
 }
 function chooseRoom(id:string){
  setRoomId(id);
  if(mode==='visit')api.current?.visit(id);
 }
 function chooseMode(next:'model'|'visit'){
  if(mode===next||!ready)return;
  setMode(next);
  if(next==='visit'){
   api.current?.visit(selectedRoom?.id);
   host.current?.focus({preventScroll:true});
  }else api.current?.model();
 }
 function downloadView(){
  const canvas=host.current?.querySelector('canvas');
  if(!canvas)return;
  const link=document.createElement('a');
  link.download='mgpro-maquette-3d.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
 }
 const hold=(dir:string)=>({
  onPointerDown:(event:React.PointerEvent<HTMLButtonElement>)=>{
   event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);api.current?.hold(dir,true);
  },
  onPointerUp:()=>api.current?.hold(dir,false),
  onPointerCancel:()=>api.current?.hold(dir,false),
  onLostPointerCapture:()=>api.current?.hold(dir,false),
  onKeyDown:(event:React.KeyboardEvent)=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();api.current?.hold(dir,true)}},
  onKeyUp:(event:React.KeyboardEvent)=>{if(event.key===' '||event.key==='Enter')api.current?.hold(dir,false)},
  onBlur:()=>api.current?.hold(dir,false),
 });

 return <section ref={studio} className={`plan-studio${full?' plan-studio-expanded':''}`} aria-label="Maquette 3D interactive">
  <div className="plan-studio-toolbar">
   <div className="plan-studio-modes" role="group" aria-label="Point de vue">
    <button type="button" className={`btn ${mode==='model'?'primary':'secondary'}`} aria-pressed={mode==='model'} disabled={!ready} onClick={()=>chooseMode('model')}>Vue d’ensemble</button>
    <button type="button" className={`btn ${mode==='visit'?'primary':'secondary'}`} aria-pressed={mode==='visit'} disabled={!ready||!rooms.length} onClick={()=>chooseMode('visit')}>Entrer dans une pièce</button>
   </div>
   <div className="plan-studio-tools">
    {mode==='visit'&&selectedRoom&&<label className="plan-studio-room">Pièce<select aria-label="Pièce visitée" value={selectedRoom.id} onChange={event=>chooseRoom(event.target.value)}>{rooms.map(room=><option key={room.id} value={room.id}>{room.name}</option>)}</select></label>}
    {onChange&&<button type="button" className="btn secondary" aria-expanded={panel} onClick={()=>setPanel(open=>!open)}>Finitions</button>}
    <button type="button" ref={fullButton} className="btn secondary" onClick={()=>void toggleFull()}>{full?'Quitter le plein écran':'Plein écran'}</button>
   </div>
  </div>

  <div className={`plan-studio-content${panel&&onChange?' with-finishes':''}`}>
   <div className="plan-studio-main">
    <div ref={host} tabIndex={0} aria-label="Scène 3D" className={`plan-studio-canvas${mode==='visit'?' walking':''}`}>
     {!ready&&<p role={error?'alert':'status'}>{error||'Préparation de la vue 3D…'}</p>}
    </div>
    <div className="plan-studio-navigation">
     <p >{mode==='visit'?'Glissez pour regarder, puis cliquez ou touchez le sol pour avancer. Sur ordinateur, utilisez aussi les flèches après avoir cliqué dans la vue.':'Glissez pour tourner. Utilisez la molette ou pincez pour zoomer.'}</p>
     {mode==='visit'&&ready&&<div className="plan-studio-arrows" role="group" aria-label="Se déplacer dans la pièce">
      <button type="button" aria-label="À gauche" {...hold('l')}>←</button>
      <button type="button" aria-label="Avancer" {...hold('f')}>↑</button>
      <button type="button" aria-label="Reculer" {...hold('b')}>↓</button>
      <button type="button" aria-label="À droite" {...hold('r')}>→</button>
      <button type="button" aria-label="Zoomer" {...hold('in')}>+</button>
      <button type="button" aria-label="Dézoomer" {...hold('out')}>−</button>
     </div>}
    </div>
   </div>
   {panel&&onChange&&<div className="plan-studio-finish-slot"><FinishPanel plan={plan} roomId={selectedRoom?.id||''} onRoom={chooseRoom} onChange={onChange} onClose={()=>setPanel(false)}/></div>}
  </div>

  <div className="plan-studio-footer">
   <button type="button" className="btn secondary" disabled={!ready} onClick={downloadView}>Télécharger la vue 3D</button>
   <details className="plan-studio-options">
    <summary>Options de rendu</summary>
    <div className="plan-studio-option-body">
     {mode==='model'&&onViewOptions&&<>
      <label><input type="checkbox" checked={roof} onChange={event=>onViewOptions({roof:event.target.checked,top})}/> Afficher le toit</label>
      <label><input type="checkbox" checked={top} onChange={event=>onViewOptions({roof,top:event.target.checked})}/> Vue du dessus</label>
     </>}
     {mode==='visit'&&<label><input type="checkbox" checked={real} disabled={!ready} onChange={event=>{setReal(event.target.checked);api.current?.real(event.target.checked)}}/> Éclairage détaillé</label>}
     {mode==='visit'&&real&&<p>{quality>=18?'Éclairage détaillé affiché.':'L’éclairage détaillé s’affiche après une courte pause.'}</p>}
     <button type="button" className="btn secondary" disabled={!ready||render.busy||imageUnavailable} onClick={()=>void photoreal()}>{render.busy?'Création de la photo…':'Créer une photo IA'}</button>
     {imageUnavailable&&<p>Photo IA indisponible sur ce compte. Le téléchargement de la vue 3D reste disponible.</p>}
    </div>
   </details>
  </div>
  {assetStatus&&(assetStatus.startsWith('Chargement')
   ?<p className="plan-studio-status" role="status">{assetStatus}</p>
   :<details className="plan-studio-status"><summary>Certains équipements sont indisponibles</summary><p>{assetStatus}</p></details>)}
  {textureStatus&&<p className="plan-studio-status" role="status">Certaines textures ou cartes de relief sont indisponibles : l’aperçu utilise une finition de remplacement.</p>}
  {render.error&&<div className="plan-studio-message" role="alert"><p>{render.error}</p><button type="button" className="btn secondary" onClick={()=>setRender({busy:false})}>Fermer le message</button></div>}
  {render.image&&<section className="plan-studio-result" aria-label="Photo IA"><img src={render.image} alt="Photo IA produite à partir de la vue 3D"/><div className="button-row"><a className="btn primary" href={render.image} download="mgpro-rendu-photorealiste.jpg">Télécharger la photo</a><button type="button" className="btn secondary" onClick={()=>setRender({busy:false})}>Fermer la photo</button></div></section>}
 </section>;
}
