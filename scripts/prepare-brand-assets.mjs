import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';

const source=process.argv[2];
if(!source)throw new Error('Provide the supplied MG Pro logo image path.');
await sharp(source).resize({width:1200,withoutEnlargement:true}).png().toFile('public/images/logo-mgpro-v6.png');
const documentLogo=await sharp(source).resize({width:330}).png().toBuffer();
await writeFile('content/brand-logo.json',JSON.stringify({png:documentLogo.toString('base64')}));
const meta=await sharp(source).metadata();
const mark=await sharp(source).extract({left:Math.round(meta.width*.06),top:Math.round(meta.height*.05),width:Math.round(meta.width*.88),height:Math.round(meta.height*.71)}).png().toBuffer();
const square=async(size,padding=0,opaque=false)=>{
 const inner=size-padding*2;
 const background=opaque?'#ffffff':{r:255,g:255,b:255,alpha:0};
 const artwork=await sharp(mark).resize(inner,inner,{fit:'contain',background}).png().toBuffer();
 return sharp({create:{width:size,height:size,channels:4,background}}).composite([{input:artwork,left:padding,top:padding}]).png().toBuffer();
};
for(const size of [16,32,48,180,192,512]){
 const bytes=await square(size);
 await writeFile(`public/app/brand-v6-${size}.png`,size===180?await square(size,0,true):bytes);
 if(size===180){const apple=await square(size,0,true);await writeFile('public/app/apple-touch-icon.png',apple);await writeFile('app/apple-icon.png',apple)}
 if(size===192||size===512)await writeFile(`public/app/icon-${size}.png`,bytes);
}
const maskable=await square(512,Math.round(512*.14),true);
await writeFile('public/app/icon-maskable-512.png',maskable);
await writeFile('public/app/brand-v6-maskable-512.png',maskable);
const frames=await Promise.all([16,32,48].map(size=>square(size)));
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);let offset=header.length;
frames.forEach((frame,index)=>{const entry=6+index*16,size=[16,32,48][index];header[entry]=size;header[entry+1]=size;header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(frame.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=frame.length});
await writeFile('app/favicon.ico',Buffer.concat([header,...frames]));
console.log('MG Pro logo, favicons, Apple and Android assets generated.');
