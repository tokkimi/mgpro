import Login from '@/components/login';
import {configured} from '@/lib/supabase';
export const metadata={title:'Connexion',robots:{index:false,follow:false}};
export default function Page(){return <Login ready={configured()}/>}
