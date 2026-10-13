import sharp from 'sharp';
import {mkdir,readdir,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const input=process.argv[2];
if(!input)throw new Error('Usage: node scripts/prepare-hero-sequence.mjs <extracted-frames-directory>');
const output='public/images/hero-renovation';
await mkdir(output,{recursive:true});
const files=(await readdir(input)).filter(f=>/^frame_\d{3}\.png$/.test(f)).sort();
const hashes=new Map(),frames=[];let bytes=0;
for(const file of files){const buffer=await readFile(`${input}/${file}`);const hash=createHash('sha256').update(buffer).digest('hex');let id=hashes.get(hash);if(!id){id=file.slice(0,-4);hashes.set(hash,id);for(const [suffix,width,quality] of [['desktop',1280,80],['mobile',800,78]]){const path=`${output}/${id}-${suffix}.webp`;await sharp(buffer).resize({width,withoutEnlargement:true}).webp({quality,effort:5}).toFile(path);bytes+=(await stat(path)).size}}frames.push(id)}
await writeFile('content/hero-renovation.json',JSON.stringify({frames,width:1536,height:1024},null,2)+'\n');
console.log(JSON.stringify({frames:frames.length,unique:hashes.size,megabytes:Math.round(bytes/1024/1024*10)/10}));
