import AtelierSite from '@/components/atelier-site';
import BlogContent from '@/components/blog-content';
export const metadata={title:'Blogue et conseils rénovation',description:'Les conseils MG Pro pour vos travaux, agrandissements et aménagements de bureaux.',alternates:{canonical:'/blogue',languages:{'fr-CA':'/blogue','en-CA':'/en/blog'}}};
export default function Page(){return <AtelierSite><BlogContent/></AtelierSite>}
