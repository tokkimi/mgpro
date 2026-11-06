type Variant='header'|'footer'|'contact'|'menu'|'intro';

const sizes:Record<Variant,string>={
 header:'(max-width:1200px) 98px, 132px',
 footer:'164px',
 contact:'(max-width:800px) 50px, 58px',
 menu:'120px',
 intro:'(max-height:500px) 250px, (max-width:524px) 82vw, 430px',
};
export default function PublicBrandLogo({variant='header',alt='MG Pro'}:{variant?:Variant;alt?:string}){
 const src=variant==='header'||variant==='footer'?'/images/mgpro-logo-fond-sombre.png':'/images/mgpro-logo-metallique.png';
 return <img className="mg-public-logo" src={src} sizes={sizes[variant]} width="1024" height="1536" alt={alt} fetchPriority={variant==='intro'||variant==='header'?'high':'auto'} decoding="sync" data-brand-variant={variant}/>;
}
