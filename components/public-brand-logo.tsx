type Variant='header'|'footer'|'contact'|'menu'|'intro';

const sizes:Record<Variant,string>={
 header:'(max-width:1200px) 98px, 132px',
 footer:'164px',
 contact:'(max-width:800px) 50px, 58px',
 menu:'120px',
 intro:'(max-height:500px) 250px, (max-width:524px) 82vw, 430px',
};
const sources=[256,512,1024,1536,2048].map(width=>`/images/brand-noir/logo-${width}.png ${width}w`).join(', ');

/** Explicit retina rasters avoid Safari's low-resolution filtered-SVG surface. */
export default function PublicBrandLogo({variant='header',alt='MG Pro'}:{variant?:Variant;alt?:string}){
 return <img className="mg-public-logo" src="/images/brand-noir/logo-1024.png" srcSet={sources} sizes={sizes[variant]} width="1000" height="780" alt={alt} fetchPriority={variant==='intro'||variant==='header'?'high':'auto'} decoding="sync" data-brand-variant={variant}/>;
}
