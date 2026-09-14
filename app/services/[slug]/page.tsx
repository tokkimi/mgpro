import AtelierSite from '@/components/atelier-site';
import original from '@/content/original.json';
import {notFound} from 'next/navigation';
const pages=original.pages.filter(p=>!['accueil','approche','a-propos','realisations'].includes(p.slug));
export function generateStaticParams(){return pages.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=pages.find(p=>p.slug===slug);return {title:p?.title,description:p?.description,alternates:{canonical:'/services/'+slug,languages:{'fr-CA':'/services/'+slug,'en-CA':'/en/services/'+slug}}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!pages.some(p=>p.slug===slug))notFound();return <AtelierSite slug={slug}/>}
