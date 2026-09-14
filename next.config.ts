import type { NextConfig } from 'next';
import original from './content/original.json';
const config: NextConfig = {poweredByHeader:false,async redirects(){return original.pages.filter(p=>p.path!=='/').map(p=>({source:p.path,destination:p.slug==='approche'?'/#approche':p.slug==='realisations'?'/#realisations':p.slug==='a-propos'?'/a-propos':`/services/${p.slug}`,permanent:true}))},async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'}]}]}};
export default config;
