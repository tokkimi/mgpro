import AtelierSite from '@/components/atelier-site';
import BlogContent from '@/components/blog-content';
import articles from '@/content/blog.json';
import {notFound} from 'next/navigation';
export function generateStaticParams(){return articles.map(a=>({slug:a.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=articles.find(a=>a.slug===slug);return {title:a?.title,description:a?.description,alternates:{canonical:'/blogue/'+slug,languages:{'fr-CA':'/blogue/'+slug,'en-CA':'/en/blog/'+slug}}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!articles.some(a=>a.slug===slug))notFound();return <AtelierSite><BlogContent slug={slug}/></AtelierSite>}
