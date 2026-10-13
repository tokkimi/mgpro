import {GlassFilter} from '@/components/ui/liquid-glass-button';
import CookieConsent from '@/components/cookie-consent';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import './globals.css';
import './responsive.css';
import './brand.css';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://mgpro-ten.vercel.app'),title:{default:'Rénovations MG Pro — Des espaces à votre image',template:'%s | MG Pro'},description:'Votre entrepreneur en rénovation à Laval, Montréal et sur la Rive-Nord. Cuisine, salle de bain, sous-sol et agrandissement.',manifest:'/manifest.webmanifest?v=5',appleWebApp:{capable:true,title:'MG Pro',statusBarStyle:'default'},icons:{icon:[{url:'/app/brand-v5-32.png',type:'image/png',sizes:'32x32'},{url:'/app/brand-v5-192.png',type:'image/png',sizes:'192x192'}],shortcut:'/favicon.ico?v=5',apple:'/app/brand-v5-180.png'}};
export default async function Layout({children}:{children:React.ReactNode}){const locale=(await headers()).get('x-site-locale')==='en-CA'?'en-CA':'fr-CA';return <html lang={locale}><body spellCheck={true}>{children}<GlassFilter/><CookieConsent/></body></html>}
import './atelier.css';

import './modules.css';
import './workspace-glass.css';
