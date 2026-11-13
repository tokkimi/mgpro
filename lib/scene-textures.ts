// Procedural PBR textures for the 3D model: no image assets to download, sharp at any size.
// Each texture comes with a matching normal map so light catches grain, grout and joints.
import type * as THREE from 'three';

type T3=typeof THREE;
export type Finish='wood'|'tile'|'concrete'|'paint'|'brick'|'quartz'|'marble'|'wallTile'|'oakVeneer'|'fabric'|'rug';
type Made={map:THREE.Texture;normalMap:THREE.Texture;roughnessMap?:THREE.Texture;size:[number,number]};

/** Deterministic pseudo-random generator so a plan always renders the same way. */
function rng(seed:number){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000}}
const hex=(c:string)=>{const n=parseInt(c.replace('#',''),16);return [n>>16&255,n>>8&255,n&255]};
const shade=(c:string,f:number,r:()=>number,spread=.06)=>{const k=f+(r()-.5)*spread;const [R,G,B]=hex(c);return `rgb(${Math.min(255,R*k)|0},${Math.min(255,G*k)|0},${Math.min(255,B*k)|0})`};

function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')!] as const}

/** Normal map from the luminance of a height canvas (Sobel). */
function normalFrom(T:T3,height:HTMLCanvasElement,strength=2.2){
 const w=height.width,h=height.height,src=height.getContext('2d')!.getImageData(0,0,w,h).data;
 const [out,ctx]=canvas(w,h);const img=ctx.createImageData(w,h);const L=(x:number,y:number)=>src[(((y+h)%h)*w+((x+w)%w))*4]/255;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(L(x+1,y)-L(x-1,y))*strength,dy=(L(x,y+1)-L(x,y-1))*strength;const len=Math.hypot(dx,dy,1);const i=(y*w+x)*4;img.data[i]=(-dx/len*.5+.5)*255;img.data[i+1]=(-dy/len*.5+.5)*255;img.data[i+2]=(1/len*.5+.5)*255;img.data[i+3]=255}
 ctx.putImageData(img,0,0);return tex(T,out,false);
}
function tex(T:T3,c:HTMLCanvasElement,color=true){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t}
function noise(ctx:CanvasRenderingContext2D,w:number,h:number,r:()=>number,amount:number,alpha=.05){for(let i=0;i<amount;i++){const v=r()>.5?255:0;ctx.fillStyle=`rgba(${v},${v},${v},${alpha*r()})`;ctx.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}}

function wood(T:T3,base:string,seed:number,plankW=.19,plankL=1.22):Made{
 const W=1024,H=1024,r=rng(seed);const [c,ctx]=canvas(W,H);const [hc,hx]=canvas(W,H);hx.fillStyle='#808080';hx.fillRect(0,0,W,H);
 // Texture = 2 plank lengths wide × 4 plank widths tall; each row has staggered joints, so the floor reads as real boards.
 const rows=4,rowH=H/rows;
 for(let row=0;row<rows;row++){
  const joints=[0];let x=(.15+r()*.5)*W/2;while(x<W-60){joints.push(x);x+=(.35+r()*.5)*W/2}joints.push(W);
  for(let j=0;j<joints.length-1;j++){const x0=joints[j],x1=joints[j+1];ctx.fillStyle=shade(base,1,r,.09);ctx.fillRect(x0,row*rowH,x1-x0,rowH);
   ctx.save();ctx.beginPath();ctx.rect(x0,row*rowH,x1-x0,rowH);ctx.clip();
   for(let g=0;g<26;g++){const y=row*rowH+r()*rowH;ctx.strokeStyle=`rgba(${r()>.5?55:255},${r()>.5?35:235},15,${.04+r()*.08})`;ctx.lineWidth=.6+r()*2;ctx.beginPath();ctx.moveTo(x0,y);for(let k=0;k<=x1-x0;k+=24)ctx.lineTo(x0+k,y+Math.sin(k/(60+r()*80)+g)*(1.5+r()*3.5));ctx.stroke()}
   if(r()>.7){const kx=x0+r()*(x1-x0),ky=row*rowH+rowH*(.25+r()*.5);const gr=ctx.createRadialGradient(kx,ky,1,kx,ky,14);gr.addColorStop(0,'rgba(70,40,15,.45)');gr.addColorStop(1,'rgba(70,40,15,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(kx,ky,22,8,0,0,Math.PI*2);ctx.fill()}
   ctx.restore();
   ctx.fillStyle='rgba(35,22,10,.5)';ctx.fillRect(x0,row*rowH,2,rowH);hx.fillStyle='#3a3a3a';hx.fillRect(x0-1,row*rowH,3,rowH)}
  ctx.fillStyle='rgba(30,18,8,.55)';ctx.fillRect(0,row*rowH,W,2);hx.fillStyle='#303030';hx.fillRect(0,row*rowH-1,W,3)}
 noise(ctx,W,H,r,9000,.035);
 return {map:tex(T,c),normalMap:normalFrom(T,hc,2.4),size:[plankL*2,plankW*rows]};
}
function tiles(T:T3,base:string,seed:number,tw=.6,th=.6,grout='#d9d6cf',polish=false):Made{
 const W=1024,H=Math.round(1024*th/tw),r=rng(seed);const [c,ctx]=canvas(W,H);const [hc,hx]=canvas(W,H);hx.fillStyle='#909090';hx.fillRect(0,0,W,H);
 const cols=2,rows=2,cw=W/cols,ch=H/rows,g=Math.max(3,W*.006);
 ctx.fillStyle=grout;ctx.fillRect(0,0,W,H);
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){ctx.fillStyle=shade(base,1,r,.07);ctx.fillRect(i*cw+g/2,j*ch+g/2,cw-g,ch-g);
  for(let k=0;k<(polish?6:14);k++){{const v=r()>.5?255:70;ctx.fillStyle=`rgba(${v},${v},${v},${.02+r()*.035})`;}ctx.beginPath();ctx.ellipse(i*cw+r()*cw,j*ch+r()*ch,20+r()*90,10+r()*40,r()*3,0,Math.PI*2);ctx.fill()}}
 for(let i=0;i<=cols;i++){hx.fillStyle='#202020';hx.fillRect(i*cw-g/2,0,g,H)}for(let j=0;j<=rows;j++){hx.fillStyle='#202020';hx.fillRect(0,j*ch-g/2,W,g)}
 noise(ctx,W,H,r,5000,.03);
 return {map:tex(T,c),normalMap:normalFrom(T,hc,1.6),size:[tw*cols,th*rows]};
}
function stone(T:T3,base:string,seed:number,veins:number,veinColor:string):Made{
 const W=1024,H=1024,r=rng(seed);const [c,ctx]=canvas(W,H);ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 for(let k=0;k<40;k++){{const v=r()>.5?255:120;ctx.fillStyle=`rgba(${v},${v},${v},.035)`;}ctx.beginPath();ctx.ellipse(r()*W,r()*H,60+r()*260,30+r()*140,r()*3,0,Math.PI*2);ctx.fill()}
 for(let v=0;v<veins;v++){ctx.strokeStyle=veinColor;ctx.globalAlpha=.12+r()*.3;ctx.lineWidth=.7+r()*2.6;ctx.beginPath();let x=r()*W,y=0;ctx.moveTo(x,y);while(y<H){x+=(r()-.5)*70;y+=20+r()*40;ctx.lineTo(x,y)}ctx.stroke()}
 ctx.globalAlpha=1;noise(ctx,W,H,r,14000,.05);
 const [hc,hx]=canvas(64,64);hx.fillStyle='#808080';hx.fillRect(0,0,64,64);
 return {map:tex(T,c),normalMap:normalFrom(T,hc,.2),size:[1.6,1.6]};
}
function concrete(T:T3,base:string,seed:number):Made{
 const W=1024,H=1024,r=rng(seed);const [c,ctx]=canvas(W,H);ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 for(let k=0;k<160;k++){{const v=r()>.5?255:30;ctx.fillStyle=`rgba(${v},${v},${v},${.02+r()*.03})`;}ctx.beginPath();ctx.ellipse(r()*W,r()*H,20+r()*160,20+r()*120,r()*3,0,Math.PI*2);ctx.fill()}
 noise(ctx,W,H,r,30000,.06);
 const [hc,hx]=canvas(256,256);hx.fillStyle='#808080';hx.fillRect(0,0,256,256);noise(hx,256,256,r,4000,.25);
 return {map:tex(T,c),normalMap:normalFrom(T,hc,.8),size:[2.4,2.4]};
}
function plaster(T:T3,base:string,seed:number):Made{
 const W=512,H=512,r=rng(seed);const [c,ctx]=canvas(W,H);ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 for(let k=0;k<25;k++){{const v=r()>.5?255:0;ctx.fillStyle=`rgba(${v},${v},${v},.005)`;}ctx.beginPath();ctx.ellipse(r()*W,r()*H,30+r()*120,30+r()*120,0,0,Math.PI*2);ctx.fill()}
 const [hc,hx]=canvas(256,256);hx.fillStyle='#808080';hx.fillRect(0,0,256,256);noise(hx,256,256,r,9000,.18);
 return {map:tex(T,c),normalMap:normalFrom(T,hc,.35),size:[2,2]};
}
function brick(T:T3,base:string,seed:number):Made{
 const W=1024,H=1024,r=rng(seed);const [c,ctx]=canvas(W,H);const [hc,hx]=canvas(W,H);ctx.fillStyle='#cfc8bc';ctx.fillRect(0,0,W,H);hx.fillStyle='#202020';hx.fillRect(0,0,W,H);
 const rows=12,bh=H/rows,bw=W/4,m=6;
 for(let j=0;j<rows;j++)for(let i=-1;i<5;i++){const x=i*bw+(j%2)*bw/2;ctx.fillStyle=shade(base,1,r,.3);ctx.fillRect(x+m/2,j*bh+m/2,bw-m,bh-m);hx.fillStyle='#a0a0a0';hx.fillRect(x+m/2,j*bh+m/2,bw-m,bh-m);noise(ctx,W,H,r,60,.12)}
 noise(ctx,W,H,r,12000,.06);
 return {map:tex(T,c),normalMap:normalFrom(T,hc,2.5),size:[.86,.78]};
}
function fabric(T:T3,base:string,seed:number):Made{
 const W=256,H=256,r=rng(seed);const [c,ctx]=canvas(W,H);ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 for(let y=0;y<H;y+=2){ctx.fillStyle=`rgba(0,0,0,${.03+r()*.03})`;ctx.fillRect(0,y,W,1)}for(let x=0;x<W;x+=2){ctx.fillStyle=`rgba(255,255,255,${.02+r()*.03})`;ctx.fillRect(x,0,1,H)}
 const [hc,hx]=canvas(64,64);hx.fillStyle='#808080';hx.fillRect(0,0,64,64);for(let y=0;y<64;y+=2){hx.fillStyle='#606060';hx.fillRect(0,y,64,1)}
 return {map:tex(T,c),normalMap:normalFrom(T,hc,.6),size:[.3,.3]};
}

const cache=new Map<string,Made>();
/** Returns textures for a finish, tinted with the room colour; repeat is set in metres by the caller via uvScale. */
export function finishTextures(T:T3,finish:Finish,color:string,seed=7):Made{
 const key=`${finish}|${color}|${seed}`;const hit=cache.get(key);if(hit)return hit;
 const made=finish==='wood'?wood(T,color,seed):finish==='oakVeneer'?wood(T,color,seed,.5,2.4):finish==='tile'?tiles(T,color,seed,.6,.6):finish==='wallTile'?tiles(T,color,seed,.3,.6,'#e9e7e2',true):finish==='concrete'?concrete(T,color,seed):finish==='quartz'?stone(T,color,seed,6,'#9a9a9a'):finish==='marble'?stone(T,color,seed,22,'#7d7d84'):finish==='brick'?brick(T,color,seed):finish==='fabric'||finish==='rug'?fabric(T,color,seed):plaster(T,color,seed);
 cache.set(key,made);return made;
}
export function clearTextureCache(){for(const m of cache.values()){m.map.dispose();m.normalMap.dispose();m.roughnessMap?.dispose()}cache.clear()}
