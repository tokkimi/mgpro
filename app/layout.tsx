import {GlassFilter} from '@/components/ui/liquid-glass-button';
import CookieConsent from '@/components/cookie-consent';
import BrandIntro from '@/components/brand-intro';
import NoirGlassMotion from '@/components/noir-glass-motion';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import './globals.css';
import './responsive.css';
import './brand.css';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://mgpro-noir.vercel.app'),title:{default:'Rénovations MG Pro — Des espaces à votre image',template:'%s | MG Pro'},description:'Votre entrepreneur en rénovation à Laval, Montréal et sur la Rive-Nord. Cuisine, salle de bain, sous-sol et agrandissement.',manifest:'/manifest.webmanifest?v=noir-1',appleWebApp:{capable:true,title:'MG Pro',statusBarStyle:'default'},icons:{icon:[{url:'/app/brand-noir-32.png',type:'image/png',sizes:'32x32'},{url:'/app/brand-noir-192.png',type:'image/png',sizes:'192x192'}],shortcut:'/favicon.ico?v=noir-1',apple:'/app/brand-noir-180.png'}};
export default async function Layout({children}:{children:React.ReactNode}){const locale=(await headers()).get('x-site-locale')==='en-CA'?'en-CA':'fr-CA';return <html lang={locale}><body spellCheck={true}><BrandIntro/>{children}<NoirGlassMotion/><GlassFilter/><CookieConsent/></body></html>}
import './atelier.css';

import './modules.css';
import './workspace-glass.css';
import './theme-silver.css';

import './theme-noir.css';
