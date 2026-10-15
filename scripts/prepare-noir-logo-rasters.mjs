import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

// Rasterize the original vector effects once at high density, outside the browser.
const svg=await readFile('public/images/logo-mgpro-noir.svg');
const master=await sharp(svg,{density:192}).resize({width:2048}).png().toBuffer();
const directory='public/images/brand-noir';await mkdir(directory,{recursive:true});
for(const width of [256,512,1024,1536,2048]){
 const path=`${directory}/logo-${width}.png`;
 const png=await sharp(master).resize({width}).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
 await writeFile(path,png);console.log(`${path}: ${width}px, ${Math.round(png.length/1024)} KiB`);
}
