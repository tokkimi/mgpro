import {readFile,writeFile} from 'node:fs/promises';
const banned=(r,g,b)=>{
 const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;if(delta<2)return false;
 let h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;h=(h*60+360)%360;
 return (h>=15&&h<=65)||(h>=245&&h<=335);
};
const grey=(r,g,b)=>Math.round(.2126*r+.7152*g+.0722*b);
for(const file of ['app/atelier.css','app/brand.css','app/responsive.css','app/workspace-glass.css','app/modules.css','app/globals.css']){
 let css=await readFile(file,'utf8');
 css=css.replace(/#([\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b/gi,(full,hex)=>{
  if(hex.length<5)hex=hex.split('').map(c=>c+c).join('');
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));if(!banned(...rgb))return full;
  const c=grey(...rgb).toString(16).padStart(2,'0');return '#'+c.repeat(3)+hex.slice(6);
 });
 css=css.replace(/(rgba?)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)([^)]*)\)/gi,(full,fn,r,g,b,end)=>{const rgb=[r,g,b].map(Number);if(!banned(...rgb))return full;const c=grey(...rgb);return `${fn}(${c},${c},${c}${end})`});
 await writeFile(file,css);
}
console.log('Warm brown/beige and violet interface colors replaced with neutral equivalents.');
