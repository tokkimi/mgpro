import sharp from 'sharp';
import {mkdir,copyFile,access} from 'node:fs/promises';
import path from 'node:path';

const generated='C:/Users/bello/.codex/generated_images/01a09e94-cb12-7221-bea7-f24ef4ba9982';
const assets={
 'vision-desktop':'exec-88e56043-98e1-4d3d-afbd-1042ee89538a.png',
 'detail-desktop':'exec-4b0ccac0-e338-41c6-916d-10646b3c9b07.png',
 'vision-mobile':'exec-c7217997-053b-4895-9c5e-e056ea93660b.png',
 'detail-mobile':'exec-465d90db-c0de-426e-81c9-e0d3397ef38e.png'
};
await mkdir('design/immersive',{recursive:true});
await mkdir('public/images/immersive',{recursive:true});
for(const [name,file] of Object.entries(assets)){
 const source=path.join('design/immersive',name+'.png');
 try{await access(source)}catch{await copyFile(path.join(generated,file),source)}
 // Preserve native detail. No enlargement of old low-resolution photographs.
 await sharp(source).webp({quality:94,effort:6}).toFile(`public/images/immersive/${name}.webp`);
 const metadata=await sharp(source).metadata();
 console.log(name,`${metadata.width}x${metadata.height}`);
}
