import SharedFiles from '@/components/shared-files';
export const metadata={title:'Fichiers partagés — MG Pro',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{token:string}>}){const {token}=await params;return <SharedFiles token={token}/>}
