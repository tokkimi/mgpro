import {redirect} from 'next/navigation';
import {identity} from '@/lib/supabase';
import Workspace from '@/components/workspace';
export const metadata={title:'Espace de gestion',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page(){const user=await identity();if(!user)redirect('/connexion');return <Workspace demo={false} initialUser={user}/>}
