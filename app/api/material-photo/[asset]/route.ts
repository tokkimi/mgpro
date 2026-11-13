// Real photo-scanned textures (ambientCG, CC0) for the materials library and the 3D model.
// GET /api/material-photo/WoodFloor043?map=Color&s=320&t=efe7da
// Downloads the asset's 1K JPG pack once, extracts the requested map, resizes it, optionally tints it
// (paint colours), and lets the CDN keep the result for a year.
import sharp from 'sharp';
import {unzipSync} from 'fflate';

export const maxDuration=60;
const MAPS=['Color','NormalGL','Roughness'] as const;
type Map=typeof MAPS[number];

async function pack(asset:string){
 const res=await fetch(`https://ambientcg.com/get?file=${asset}_1K-JPG.zip`,{cache:'no-store'});
 if(!res.ok)throw new Error(`ambientCG ${res.status}`);
 return new Uint8Array(await res.arrayBuffer());
}

export async function GET(req:Request,{params}:{params:Promise<{asset:string}>}){
 const {asset}=await params;
 if(!/^[A-Za-z]{2,30}\d{3}[A-Z]?$/.test(asset))return new Response('Référence invalide',{status:400});
 const url=new URL(req.url);
 const map=(MAPS as readonly string[]).includes(url.searchParams.get('map')||'')?url.searchParams.get('map') as Map:'Color';
 const size=Math.min(1024,Math.max(96,Number(url.searchParams.get('s'))||320));
 const tint=/^[0-9a-f]{6}$/i.test(url.searchParams.get('t')||'')?'#'+url.searchParams.get('t'):null;
 try{
  const files=unzipSync(await pack(asset),{filter:f=>f.name.endsWith(`_${map}.jpg`)});
  const file=Object.values(files)[0];
  if(!file)return new Response('Carte absente',{status:404});
  // Catalogue swatches show a close-up (centre of the sample, like a showroom chip); 3D maps keep the full tile.
  const src=sharp(Buffer.from(file));const meta=await src.metadata();const W=meta.width||1024,H=meta.height||1024;
  const zoom=size<=720&&url.searchParams.get('full')!=='1'?.5:1;const cw=Math.round(W*zoom),ch=Math.round(H*zoom);
  let img=(zoom<1?src.extract({left:Math.round((W-cw)/2),top:Math.round((H-ch)/2),width:cw,height:ch}):src).resize(size,size,{fit:'cover'});
  if(tint&&map==='Color'){
   // Keep the real plaster/paint relief, recoloured: greyscale normalised around the target colour.
   const grey=await img.greyscale().normalise({lower:2,upper:98}).linear(.35,166).toBuffer();
   img=sharp(grey).composite([{input:{create:{width:size,height:size,channels:3,background:tint}},blend:'multiply'}]);
  }
  const out=await img.webp({quality:map==='Color'?82:75}).toBuffer();
  return new Response(new Uint8Array(out),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, s-maxage=31536000, immutable','X-Texture-Source':`ambientCG ${asset} (CC0)`}});
 }catch(e){
  return new Response('Texture indisponible',{status:502,headers:{'Cache-Control':'no-store'}});
 }
}
