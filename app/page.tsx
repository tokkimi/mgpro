import PublicSite from '@/components/atelier-site';
import {configured,db} from '@/lib/supabase';
import {defaults} from '@/lib/model';
export const dynamic='force-dynamic';
async function settings(){if(!configured())return defaults;const {data}=await db().from('records').select('data').eq('kind','settings').limit(1).maybeSingle();return {...defaults,...data?.data};}
export async function generateMetadata(){const s=await settings();return {title:s.seo_title,description:s.seo_description,alternates:{canonical:'/',languages:{'fr-CA':'/','en-CA':'/en'}}};}
export default async function Home(){const s=await settings();return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'GeneralContractor',name:s.name,telephone:s.phone,email:s.email,areaServed:['Laval','Montréal','Rive-Nord'],url:process.env.NEXT_PUBLIC_SITE_URL||'https://www.renovationsmgpro.com'}).replace(/</g,'\\u003c')}}/><PublicSite settings={s}/></>}

