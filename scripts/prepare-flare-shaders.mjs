import {readFile,writeFile} from 'node:fs/promises';
import {prepareShader} from '@vgpu/wgsl/prepare';

const root='components/ui/nextjs-flare-utils';
for(const name of ['logo','rim','blur','composite']){
 const source=await readFile(`${root}/${name}.wgsl`,'utf8');
 const prepared=prepareShader(source,`${name}.wgsl`);
 await writeFile(`${root}/${name}-shader.ts`,`// Prepared from ${name}.wgsl with @vgpu/wgsl 0.6.0. See LICENSE.txt.\nimport type {ShaderSource} from '@vgpu/wgsl';\nexport default ${JSON.stringify(prepared)} satisfies ShaderSource;\n`);
}
console.log('Four original Flare shaders prepared for Next.js without custom loaders.');
