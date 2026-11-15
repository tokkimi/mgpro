"use client";
import {useEffect, useState} from "react";
import {GlassIconReveal} from "./liquid-glass-logo-reveal";

export default function FinanceitReveal(){
  const [animate,setAnimate]=useState(false);
  useEffect(()=>{
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setAnimate(!motion.matches);
    update(); motion.addEventListener("change",update);
    return ()=>motion.removeEventListener("change",update);
  },[]);
  return <div className="financeit-reveal">{animate ? <GlassIconReveal logo="/images/financeit-official.png" label="Financeit" originalColors background="#fafafa" tileSize={190} logoScale={0.9} finalScale={1} hold={3} speed={0.85} /> : <img src="/images/financeit-official.png" alt="Financeit" />}</div>;
}
