import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/demo','/connexion','/compte','/api/','/auth/']},sitemap:`${process.env.NEXT_PUBLIC_SITE_URL||'https://mgpro-ten.vercel.app'}/sitemap.xml`}}

