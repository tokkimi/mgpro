"use client";

import {useEffect,useRef,useState} from 'react';
import {createRenderer} from './nextjs-flare-utils/renderer';
import styles from './nextjs-flare.module.css';

export function Example(){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let alive=true;
  const renderer=createRenderer({canvas,onRender:()=>{if(alive)setReady(true)}});
  void renderer.ready;
  return()=>{alive=false;renderer.dispose()};
 },[]);
 return <div className={`${styles.root} nextjs-flare relative h-full w-full overflow-hidden bg-black`} data-ready={ready?'true':'false'} aria-hidden="true"><canvas ref={canvasRef} className={`${styles.canvas} block h-full w-full touch-none`}/></div>;
}
export default Example;
