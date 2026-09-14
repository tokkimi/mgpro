import type {Metadata} from 'next';
import {headers} from 'next/headers';
import './globals.css';
import './responsive.css';
import './brand.css';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://mgpro-ten.vercel.app'),title:{default:'Rénovations MG Pro — Des espaces à votre image',template:'%s | MG Pro'},description:'Votre entrepreneur en rénovation à Laval, Montréal et sur la Rive-Nord. Cuisine, salle de bain, sous-sol et agrandissement.',icons:{icon:[{url:'/mgpro-favicon-v4.svg',type:'image/svg+xml'}],shortcut:'/mgpro-favicon-v4.svg',apple:'/apple-icon.png?v=4'}};
export default async function Layout({children}:{children:React.ReactNode}){const locale=(await headers()).get('x-site-locale')==='en-CA'?'en-CA':'fr-CA';return <html lang={locale}><body>{children}</body></html>}
import './atelier.css';
