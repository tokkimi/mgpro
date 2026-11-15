"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {GlassIconReveal} from "./liquid-glass-logo-reveal";

// The original glass reveal works on an image. Draw the entire live offer into
// its texture, so the logo AND all the text move through the glass together.
export default function FinanceGlassEffect(){
 const layer=useRef<HTMLDivElement>(null);
 const [texture,setTexture]=useState<string|null>(null);
 const ready=useCallback(()=>layer.current?.parentElement?.classList.add("finance-glass-ready"),[]);
 useEffect(()=>{
  const card=layer.current?.parentElement;
  if(!card||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let cancelled=false;
  const draw=async()=>{
   try{
    await document.fonts.ready;
    const img=card.querySelector(".financeit-logo") as HTMLImageElement|null;
    if(!img)return;
    if(!img.complete)await img.decode();
    const canvas=document.createElement("canvas");canvas.width=720;canvas.height=540;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    ctx.fillStyle="#f7f9fa";ctx.beginPath();ctx.roundRect(6,6,708,528,38);ctx.fill();
    ctx.drawImage(img,25,-18,365,190);
    ctx.fillStyle="#20262b";ctx.font="500 100px Georgia, serif";ctx.fillText(card.querySelector("h3")?.textContent||"",54,265);
    ctx.font="28px Arial, sans-serif";ctx.fillText(card.querySelector("p")?.textContent||"",54,325);
    ctx.fillStyle="#596168";ctx.font="18px Arial, sans-serif";
    const words=(card.querySelector("small")?.textContent||"").split(/\s+/);let line="",y=389;
    for(const word of words){const next=line?line+" "+word:word;if(ctx.measureText(next).width>608&&line){ctx.fillText(line,54,y);y+=26;line=word}else line=next}if(line)ctx.fillText(line,54,y);
    if(!cancelled)setTexture(canvas.toDataURL("image/png"));
   }catch(error){console.error("Financeit animation:",error)}
  };void draw();
  return ()=>{cancelled=true;card.classList.remove("finance-glass-ready")};
 },[]);
 return <div ref={layer} className="finance-glass-layer" aria-hidden="true">{texture&&<GlassIconReveal logo={texture} originalColors background="#ffffff" tileSize={520} logoScale={1.2} finalScale={1} hold={1.5} speed={1.7} onRevealReady={ready} tuning={{startZoom:2.3}}/>}</div>;
}
