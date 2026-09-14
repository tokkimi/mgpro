import type {Metadata} from 'next';
import './globals.css';
import './responsive.css';
import './brand.css';
export const metadata:Metadata={title:{default:'Rénovations MG Pro — Des espaces à votre image',template:'%s | MG Pro'},description:'Votre entrepreneur en rénovation à Laval, Montréal et sur la Rive-Nord. Cuisine, salle de bain, sous-sol et agrandissement.',icons:{icon:'/icon.png',apple:'/apple-icon.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr-CA"><body>{children}</body></html>}
import './atelier.css';
