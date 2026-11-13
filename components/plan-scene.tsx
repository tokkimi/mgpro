'use client';
import {useEffect,useRef,useState} from 'react';
import type {Plan,PlanRoom,PlanElement} from '@/lib/plan';
import {bounds} from '@/lib/plan';
import {finishTextures,clearTextureCache,type Finish} from '@/lib/scene-textures';

type Edge='north'|'south'|'west'|'east';
type Opening={from:number;to:number;kind:'door'|'window';bottom:number;top:number;shared:boolean};

/** Room description sent with the 3D view to the photorealistic renderer. */
export function describePlan(plan:Plan){
 const finish:Record<string,string>={wood:'parquet de bois franc',tile:'céramique grand format',concrete:'béton ciré'};
 const style:Record<string,string>={nature:'chaleureuse et naturelle (bois clair, lin, tons sable)',contemporary:'contemporaine épurée (blanc, gris clair, noir mat)',classic:'classique douce (moulures, tons crème, bois moyen)',industrial:'industrielle (béton, métal noir, brique)'};
 const rooms=plan.rooms.filter(r=>r.phase!=='remove').map(r=>`${r.name} (${r.length.toFixed(1)} × ${r.width.toFixed(1)} m) : sol ${finish[r.floorFinish]||'parquet'}, murs ${r.wallFinish==='brick'?'en brique apparente':`peints couleur ${r.wall}`}`).join(' ; ');
 const items=plan.elements.filter(e=>e.phase!=='remove'&&!['note','door','window','wall'].includes(e.kind)).map(e=>e.label).slice(0,25).join(', ');
 return `Ambiance ${style[plan.style]||style.nature}. Pièces : ${rooms}.${items?` Équipements : ${items}.`:''}`;
}

export default function PlanScene({plan,roof=false,top=false}:{plan:Plan;roof?:boolean;top?:boolean}){
 const host=useRef<HTMLDivElement>(null);const [error,setError]=useState('');
 const [render,setRender]=useState<{busy:boolean;image?:string;error?:string}>({busy:false});
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
  const textured=(finish:Finish,color:string,uw:number,uh:number,opts:any={})=>{const made=finishTextures(T,finish,color,opts.seed??7);const map=made.map.clone(),normalMap=made.normalMap.clone();for(const t of [map,normalMap]){t.repeat.set(uw/made.size[0],uh/made.size[1]);t.needsUpdate=true}const {seed,...rest}=opts;return keep(new T.MeshPhysicalMaterial({map,normalMap,normalScale:new T.Vector2(.6,.6),roughness:.6,...rest}))};
  const plain=(color:string,opts:any={})=>keep(new T.MeshPhysicalMaterial({color,roughness:.6,...opts}));
  const M={
   ceramic:plain('#fbfbf9',{roughness:.12,clearcoat:1,clearcoatRoughness:.05}),
   chrome:plain('#e9ecef',{metalness:1,roughness:.12}),
   steel:plain('#c9cdd0',{metalness:.9,roughness:.32}),
   black:plain('#141414',{roughness:.25,clearcoat:.8}),
   blackMetal:plain('#1c1c1c',{metalness:.7,roughness:.4}),
   white:plain('#f6f5f1',{roughness:.45}),
   satin:plain('#f2f0ea',{roughness:.35,clearcoat:.3}),
   glass:plain('#ffffff',{transmission:.96,roughness:.03,thickness:.01,ior:1.5,transparent:true,opacity:1,metalness:0}),
   mirror:plain('#ffffff',{metalness:1,roughness:.02}),
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
  const wallFades:{mesh:any;mat:any;normal:any;center:any}[]=[];
  let lights=0;

  /** Group in a local frame: x along the wall, +z towards the room, y up; placed on the element footprint. */
  function anchored(e:{x:number;y:number;length:number;width:number},edge:Edge){
   const g=new T.Group();const horizontal=edge==='north'||edge==='south';const W=horizontal?e.length:e.width,D=horizontal?e.width:e.length;
   g.position.set(e.x+e.length/2,0,e.y+e.width/2);g.rotation.y=edge==='north'?0:edge==='south'?Math.PI:edge==='west'?Math.PI/2:-Math.PI/2;scene.add(g);return {g,W,D};
  }
  const handle=(g:any,x:number,y:number,z:number,len=.14,vertical=false)=>{const m=add(cyl(.006,.006,len,10),M.chrome,x,y,z,g);if(!vertical)m.rotation.z=Math.PI/2};

  // ── fixtures ──
  function cabinets(g:any,W:number,D:number,H=.88,front='#e9e5dd',top=true){
   add(box(W,.1,D-.06),M.black,0,.05,-.03,g);
   add(box(W,H-.13,D-.02),plain(front,{roughness:.4,clearcoat:.2}),0,.1+(H-.13)/2,-.01,g);
   const n=Math.max(1,Math.round(W/.6));for(let i=0;i<n;i++){const x=-W/2+W/n*(i+.5);add(box(W/n-.006,H-.15,.006),plain(front,{roughness:.35,clearcoat:.25}),x,.1+(H-.13)/2,D/2-.008,g);handle(g,x,H-.12,D/2+.01)}
   if(top)add(box(W+.02,.03,D+.03),textured('quartz','#f1efea',W,D,{roughness:.15,clearcoat:.6}),0,H+.015,.005,g);
  }
  function upper(g:any,W:number,D:number,front='#e9e5dd'){add(box(W,.72,.34),plain(front,{roughness:.35,clearcoat:.25}),0,1.86,-D/2+.17,g);const n=Math.max(1,Math.round(W/.6));for(let i=0;i<n;i++)handle(g,-W/2+W/n*(i+.5),1.55,-D/2+.35,.12,true);add(box(W,.55,.01),textured('wallTile','#f4f2ee',W,.55),0,1.18,-D/2+.005,g)}
  function faucet(g:any,x:number,y:number,z:number,tall=.32){add(cyl(.018,.022,tall,16),M.chrome,x,y+tall/2,z,g);const arc=add(new T.TorusGeometry(.09,.013,10,24,Math.PI),M.chrome,x,y+tall,z+.09,g);arc.rotation.y=Math.PI/2;arc.rotation.x=0}
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
  function vanity(g:any,W:number,D:number){cabinets(g,W,D,.84,'#9b7653',false);add(box(W+.02,.03,D+.02),textured('quartz','#f3f1ec',W,D,{roughness:.12,clearcoat:.7}),0,.855,0,g);const basin=add(new T.SphereGeometry(.2,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2),M.ceramic,0,.98,.02,g);basin.rotation.x=Math.PI;basin.scale.set(1,.6,.8);faucet(g,0,.87,-D/2+.08,.25);add(box(Math.min(W*.9,1.1),.85,.01),M.mirror,0,1.6,-D/2+.012,g)}
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
   const floorFinish:Finish=r.floorFinish==='tile'?'tile':r.floorFinish==='concrete'?'concrete':'wood';
   const floorColor=r.floorFinish==='tile'?(r.furniture==='bath'?'#cfc9be':'#c4bdb1'):r.floor;
   add(box(l,.02,d),textured(floorFinish,floorColor,l,d,{roughness:floorFinish==='wood'?.42:floorFinish==='tile'?.22:.35,clearcoat:floorFinish==='concrete'?.3:.15,seed:Math.round(x*7+z*13)}),x+l/2,-.01,z+d/2,scene,false);
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
    const paint=r.wallFinish==='brick'?textured('brick','#9b5a42',len,H):textured('paint',r.wall,len,H,{roughness:.85,seed:3});paint.transparent=true;
    const tileMat=bath?textured('wallTile','#eeece7',len,1.2,{roughness:.2,clearcoat:.5}):null;if(tileMat)tileMat.transparent=true;
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

  const resize=()=>{const a=el.clientWidth,b=el.clientHeight;renderer.setSize(a,b);camera.aspect=a/Math.max(1,b);const distance=size*1.35/Math.min(1,camera.aspect);camera.position.set(w/2+(top?0:distance*.7),top?distance*1.7:distance*.95,h/2+(top?.01:distance));camera.updateProjectionMatrix()};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let raf=0;const v=new T.Vector3();
  const draw=()=>{controls.update();
   if(!top&&!roof)for(const f of wallFades){v.copy(camera.position).sub(f.center).setY(0);const facing=v.normalize().dot(f.normal);const o=facing>.25?.12:1;for(const m of f.mat)if(Math.abs(m.opacity-o)>.01){m.opacity+=(o-m.opacity)*.25;m.depthWrite=m.opacity>.9}}
   renderer.render(scene,camera);raf=requestAnimationFrame(draw)};draw();
  dispose=()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();scene.traverse((o:any)=>{if(o.isMesh)o.geometry.dispose()});mats.forEach(m=>{m.map?.dispose?.();m.normalMap?.dispose?.();m.dispose()});envTex.dispose();pmrem.dispose();clearTextureCache();renderer.dispose();renderer.domElement.remove()};
 }catch(e){console.error(e);setError('La 3D nécessite WebGL sur cet appareil. Le plan 2D reste disponible.')}})();return()=>{cancelled=true;dispose()}},[plan,roof,top]);

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

 return <div className="plan-scene" ref={host} aria-label="Maquette 3D interactive">{error&&<p role="alert">{error}</p>}
  <div className="plan-scene-actions">
   <button type="button" className="btn primary" disabled={render.busy} onClick={()=>void photoreal()}>{render.busy?'Rendu photoréaliste en cours… (20 à 60 s)':'✦ Rendu photoréaliste IA'}</button>
   <button type="button" className="btn secondary" onClick={()=>{const canvas=host.current?.querySelector('canvas');if(!canvas)return;const a=document.createElement('a');a.download='mgpro-maquette-3d.png';a.href=canvas.toDataURL('image/png');a.click()}}>Télécharger la vue</button>
  </div>
  {render.error&&<p className="plan-scene-error" role="alert">{render.error}</p>}
  {render.image&&<div className="plan-scene-render" role="dialog" aria-label="Rendu photoréaliste"><img src={render.image} alt="Rendu photoréaliste de la vue 3D"/><div className="button-row"><a className="btn primary" href={render.image} download="mgpro-rendu-photorealiste.png">Télécharger le rendu</a><button type="button" className="btn secondary" onClick={()=>setRender({busy:false})}>Revenir à la 3D</button></div></div>}
 </div>;
}
