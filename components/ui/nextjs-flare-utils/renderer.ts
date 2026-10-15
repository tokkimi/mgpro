import {createCanvasRenderer} from './canvas-renderer';

type Options={canvas:HTMLCanvasElement;onRender?:()=>void};
type Engine={ready:Promise<void>;dispose:()=>void};

/** Load the original WebGPU shader only when supported; retain the same public API. */
export function createRenderer({canvas,onRender}:Options):Engine{
 let disposed=false,engine:Engine|undefined,fallbackEngine:Engine|undefined,fallback:HTMLCanvasElement|undefined;
 const rendered=()=>{if(!disposed){canvas.dataset.ready='true';onRender?.()}};
 function useFallback(){
  if(disposed||fallback)return;
  fallback=document.createElement('canvas');fallback.className=canvas.className;
  Object.assign(fallback.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});
  canvas.parentElement?.append(fallback);
  fallbackEngine=createCanvasRenderer({canvas:fallback,onRender:rendered});
  canvas.dataset.engine='canvas2d';
 }
 const ready=(async()=>{
  // Show rays immediately while the device and original shaders initialize.
  useFallback();
  if(!navigator.gpu)return;
  try{
   const module=await import('./webgpu-renderer');if(disposed)return;
   engine=module.createRenderer({canvas,onRender:()=>{fallbackEngine?.dispose();fallbackEngine=undefined;fallback?.remove();fallback=undefined;canvas.dataset.engine='webgpu';rendered()},onError:error=>{canvas.dataset.gpuError=error instanceof Error?error.message.slice(0,400):'GPU unavailable';useFallback()}});
   await engine.ready;
  }catch{useFallback()}
 })();
 return {ready,dispose(){if(disposed)return;disposed=true;fallbackEngine?.dispose();try{engine?.dispose()}catch{/* Cleanup after device loss is best effort. */}fallback?.remove()}};
}
