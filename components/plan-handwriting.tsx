import {useId} from 'react';

// Original single-line pen strokes, rather than font outlines or raster lettering.
const glyphs:Record<string,{width:number;strokes:string[]}>=Object.fromEntries(Object.entries({
 a:[8,'M6 4C2 2 0 6 1 8C2 11 6 8 6 4Q5 10 8 9'],
 b:[8,'M1 8Q5-5 2 0L1 9M2 6C8 0 10 9 3 9'],
 c:[7,'M6 4C0 1-1 11 6 9'],
 d:[8,'M6 4C1 1-1 10 3 9Q6 9 7 1Q8-3 6 5L6 9L8 9'],
 e:[7,'M1 7Q8 6 5 4C1 1-2 11 7 9'],
 f:[6,'M0 13Q3-5 6 1M0 5L6 4'],
 g:[8,'M6 4C2 1-1 10 3 9Q6 8 6 4L5 12Q3 17 0 13'],
 h:[8,'M1 9L3 0Q4-2 4 0L2 7Q7 1 7 6L6 9L8 9'],
 i:[4,'M2 4L1 8Q1 10 4 8','M2.7 1L2.9.6'],
 j:[5,'M3 4L2 12Q1 16-2 13','M3.8 1L4 .6'],
 k:[8,'M1 9L3 0M2 7L7 3M3 6Q5 10 8 9'],
 l:[5,'M1 9Q5 0 3-1Q0 1 1 7Q1 10 5 8'],
 m:[12,'M1 9L2 4L1 7Q6 0 5 7L5 9Q9 1 10 5L10 8Q10 10 12 8'],
 n:[8,'M1 9L2 4L1 7Q7 0 7 6L6 9L8 9'],
 o:[8,'M6 4C1 1-1 9 3 9C7 10 9 3 5 4'],
 p:[8,'M1 13L3 4M2 6C8 0 10 9 3 9'],
 q:[8,'M6 4C2 1-1 10 3 9L6 5L5 13L8 11'],
 r:[6,'M1 9L2 4L1 7Q4 2 6 4'],
 s:[7,'M6 4C1 1 0 5 4 6C9 9 2 11 0 8'],
 t:[6,'M3 1L1 8Q1 11 6 8','M0 4L6 3'],
 u:[8,'M2 4Q-1 13 6 6L7 4L6 8Q6 10 8 9'],
 v:[8,'M1 4L2 9Q5 8 7 3'],
 w:[11,'M1 4L2 9Q5 7 5 4L6 9Q10 7 10 3'],
 x:[8,'M1 4L7 9','M7 3L1 10'],
 y:[8,'M1 4Q-1 13 6 5L5 12Q3 17 0 13'],
 z:[8,'M1 4L7 3L1 9L7 9'],
 é:[7,'M1 7Q8 6 5 4C1 1-2 11 7 9','M3 1L5-1'],
 è:[7,'M1 7Q8 6 5 4C1 1-2 11 7 9','M3 1L1-1'],
 à:[8,'M6 4C2 2 0 6 1 8C2 11 6 8 6 4Q5 10 8 9','M4 1L2-1'],
 ' ':[4],
} as Record<string,[number,...string[]]>).map(([letter,[width,...strokes]])=>[letter,{width,strokes}]));

export const planTextMasks=[
 [252,45,270,40],[478,104,57,21],[911,0,64,24],[675,69,30,58],
 [194,298,58,26],[414,262,96,43],[612,302,81,42],[862,251,83,30],
 [182,540,58,27],[722,510,73,29],[1056,518,93,31],
 [464,648,149,28],[642,654,32,26],[107,763,101,29],[444,719,120,29],
 [928,693,91,29],[925,924,119,28],[469,946,152,28],
 [0,650,22,72],[1177,514,23,97],[471,1034,81,28],
 [249,934,29,57],[750,886,29,69],[807,892,30,61],[647,831,27,38],
] as const;

const labels=[
 {fr:['votre espace'],en:['your space'],x:384,y:58,size:41,angle:-1},
 {fr:['chambre','principale'],en:['primary','bedroom'],x:445,y:303,size:35,angle:-1},
 {fr:['bain'],en:['bath'],x:655,y:316,size:29,angle:1},
 {fr:['garage'],en:['garage'],x:908,y:268,size:45,angle:-1},
 {fr:['terrasse'],en:['deck'],x:221,y:323,size:31,angle:-90},
 {fr:['salle','de bain'],en:['bathroom'],x:211,y:552,size:27,angle:-1},
 {fr:['chambre'],en:['bedroom'],x:154,y:778,size:31,angle:-1},
 {fr:['salon'],en:['living room'],x:465,y:728,size:46,angle:1},
 {fr:['cuisine'],en:['kitchen'],x:969,y:704,size:44,angle:-1},
 {fr:['réserve'],en:['storage'],x:1099,y:536,size:24,angle:0},
 {fr:['salle à','manger'],en:['dining','room'],x:976,y:838,size:38,angle:-1},
 {fr:['terrasse couverte'],en:['covered porch'],x:531,y:963,size:36,angle:0},
] as const;

export function PlanHandwriting({locale='fr',animated=false}:{locale?:'fr'|'en';animated?:boolean}){
 return <svg className={animated?'plan-handwriting':'plan-handwriting-static'} viewBox="0 0 1200 1130" aria-hidden="true" data-writing={animated?'true':undefined}>
  {labels.map((label,index)=><g key={index} transform={`translate(${label.x} ${label.y}) rotate(${label.angle})`} fill="none" stroke="#fff" strokeWidth=".58" strokeLinecap="round" strokeLinejoin="round" opacity=".94">
   {label[locale].map((line,row)=>{
    const scale=label.size/10,letters=[...line],width=letters.reduce((sum,letter)=>sum+(glyphs[letter]?.width??4)+.4,0)*scale;
    let cursor=-width/2;
    return <g key={row} aria-label={line}>{letters.map((letter,i)=>{
     const glyph=glyphs[letter]??glyphs[' '],x=cursor;cursor+=(glyph.width+.4)*scale;
     return glyph.strokes.map((stroke,j)=><path key={`${i}-${j}`} d={stroke} transform={`translate(${x} ${(row-(label[locale].length-1)/2)*label.size*1.3-label.size/2}) scale(${scale}) skewX(-5)`} pathLength="1" strokeDasharray="1" strokeDashoffset={animated?1:0}/>);
    })}</g>;
   })}
  </g>)}
 </svg>;
}

export function PlanFallback({locale='fr'}:{locale?:'fr'|'en'}){
 const id=useId().replace(/:/g,'');
 return <div className="plan-scroll-fallback"><svg viewBox="0 0 1200 1130" aria-hidden="true">
  <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1130"><rect width="1200" height="1130" fill="white"/>{planTextMasks.map(([x,y,width,height],i)=><rect key={i} x={x} y={y} width={width} height={height} fill="black"/>)}</mask></defs>
  <g mask={`url(#${id})`}><image href="/images/plan-trace/frame_050-desktop.webp" width="1200" height="1130" className="plan-original-ink"/></g>
 </svg><PlanHandwriting locale={locale}/></div>;
}
