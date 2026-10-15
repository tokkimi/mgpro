/** Gold volumetric-ray fallback for browsers without an available WebGPU adapter. */
export function createCanvasRenderer({canvas,onRender}:{canvas:HTMLCanvasElement;onRender:()=>void}){
 const context=canvas.getContext('2d',{alpha:false});
 const image=new Image();
 let disposed=false,frame=0,last=0,painted=false,width=1,height=1;
 const logo=document.createElement('canvas'),tint=logo.getContext('2d');
 function measure(){const bounds=canvas.getBoundingClientRect(),density=Math.min(devicePixelRatio||1,1.25,1000/Math.max(1,bounds.width));width=canvas.width=Math.max(1,Math.round(bounds.width*density));height=canvas.height=Math.max(1,Math.round(bounds.height*density))}
 function draw(now:number){
  if(disposed||!context||!tint)return;
  frame=requestAnimationFrame(draw);if(now-last<33||document.hidden)return;last=now;
  const size=Math.min(width,height),h=size*.55,w=h*1000/780,left=(width-w)/2,top=(height-h)/2;
  const phase=now/1000*1.7,lightX=width/2+Math.cos(phase)*size*.23,lightY=height/2-Math.sin(phase)*size*.2;
  context.globalCompositeOperation='source-over';context.globalAlpha=1;context.fillStyle='#000';context.fillRect(0,0,width,height);
  context.globalCompositeOperation='lighter';
  // The logo texture is accumulated away from the moving light, as in a radial scatter pass.
  for(let step=28;step>=1;step--){const scale=1+step/28*.7;context.globalAlpha=.014*(1-step/36);context.drawImage(logo,lightX+(left-lightX)*scale,lightY+(top-lightY)*scale,w*scale,h*scale)}
  const halo=context.createRadialGradient(lightX,lightY,0,lightX,lightY,size*.28);halo.addColorStop(0,'#f8d27324');halo.addColorStop(1,'#e9a82d00');context.globalAlpha=1;context.fillStyle=halo;context.fillRect(0,0,width,height);
  context.globalAlpha=.92;context.shadowColor='#ecc96c';context.shadowBlur=8;context.drawImage(logo,left,top,w,h);context.shadowBlur=0;context.globalAlpha=1;
  canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);canvas.dataset.engine='canvas2d';
  if(!painted){painted=true;onRender()}
 }
 const observer=new ResizeObserver(measure);observer.observe(canvas);measure();
 const ready=new Promise<void>(resolve=>{
  image.onload=()=>{if(!disposed&&tint&&context){logo.width=image.naturalWidth;logo.height=image.naturalHeight;tint.drawImage(image,0,0);tint.globalCompositeOperation='source-in';tint.fillStyle='#f2cf79';tint.fillRect(0,0,logo.width,logo.height);frame=requestAnimationFrame(draw)}resolve()};
  image.onerror=()=>resolve();image.src='/images/logo-mgpro-flare.svg';
 });
 return {ready,dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();image.onload=null;image.onerror=null}};
}
