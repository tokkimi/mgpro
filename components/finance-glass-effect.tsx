"use client";
import {GlassIconReveal} from "./liquid-glass-logo-reveal";
const pane = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect x="8" y="8" width="284" height="284" rx="38" fill="white"/></svg>`;
export default function FinanceGlassEffect(){return <div className="finance-glass-layer" aria-hidden="true"><GlassIconReveal logo={pane} background="#ffffff" logoColor="#e6ebed" tileSize={420} logoScale={0.9} finalScale={1} hold={2} speed={0.9} tuning={{startZoom:2.3}} /></div>}
