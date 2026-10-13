import sharp from 'sharp';
import {mkdir,readdir,writeFile,stat} from 'node:fs/promises';
const input=process.argv[2];if(!input)throw new Error('Usage: node scripts/prepare-plan-sequence.mjs <extracted-images>');
const output='public/images/plan-trace';await mkdir(output,{recursive:true});
const files=(await readdir(input)).filter(f=>/^frame_\d{3}\.png$/.test(f)).sort();if(files.length!==50)throw new Error('Expected 50 plan frames');let bytes=0;
for(const file of files){for(const [variant,width] of [['desktop',1200],['mobile',800]]){const path=`${output}/${file.slice(0,-4)}-${variant}.webp`;await sharp(`${input}/${file}`).resize({width,withoutEnlargement:true}).webp({quality:90,alphaQuality:100,effort:5}).toFile(path);bytes+=(await stat(path)).size}}
await writeFile('content/plan-trace.json',JSON.stringify({directory:'/images/plan-trace',frames:files.map(f=>f.slice(0,-4))},null,2)+'\n');console.log(JSON.stringify({frames:files.length,megabytes:Math.round(bytes/1024/1024*100)/100}));
