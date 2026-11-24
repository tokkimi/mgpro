type Variant='header'|'footer'|'contact'|'menu'|'intro';

const sizes:Record<Variant,string>={
 header:'(max-width:1200px) 98px, 132px',
 footer:'164px',
 contact:'(max-width:800px) 50px, 58px',
 menu:'120px',
 intro:'(max-height:500px) 250px, (max-width:524px) 82vw, 430px',
};
export default function PublicBrandLogo({variant='header',alt='MG Pro'}:{variant?:Variant;alt?:string}){
 // Optimised 512/1024 px WebP renditions of the 6250 px masters (the PNG masters weigh 9–12 MB each).
 const base=variant==='header'||variant==='footer'?'/images/mgpro-logo-blanc-selection':'/images/mgpro-logo-noir-selection';
 return <img className="mg-public-logo" src={`${base}-1024.webp`} srcSet={`${base}-512.webp 512w, ${base}-1024.webp 1024w`} sizes={sizes[variant]} width="1024" height="1024" alt={alt} fetchPriority={variant==='intro'||variant==='header'?'high':'auto'} decoding="sync" data-brand-variant={variant}/>;
}
