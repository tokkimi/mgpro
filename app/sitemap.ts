import type {MetadataRoute} from 'next';
import original from '@/content/original.json';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL||'https://mgpro-ten.vercel.app';return original.pages.filter(p=>!['approche','realisations'].includes(p.slug)).map(p=>({url:base+(p.slug==='accueil'?'':p.slug==='a-propos'?'/a-propos':`/services/${p.slug}`),changeFrequency:'monthly',priority:p.slug==='accueil'?1:.7}))}
