'use client';
import {useEffect,useState} from 'react';
type Shared={label:string;expiresAt:string;documents:{id:string;name:string;size:number;type:string}[]};
export default function SharedFiles({token}:{token:string}){
 const [data,setData]=useState<Shared|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/file-shares?token='+encodeURIComponent(token),{signal:controller.signal}).then(async r=>{const value=await r.json();if(!r.ok)throw Error(value.error);setData(value)}).catch(e=>{if(e.name!=='AbortError')setError(e.message)});return()=>controller.abort()},[token]);
 return <main className="public-invoice"><p className="eyebrow">MG PRO · FICHIERS PARTAGÉS</p><h1>{data?.label||'Fichiers partagés'}</h1>{error?<p role="alert">{error}</p>:!data?<p role="status">Chargement…</p>:<><p>Ce lien expire le {new Date(data.expiresAt).toLocaleDateString('fr-CA')}. {data.documents.length} fichier(s).</p><ul className="file-list">{data.documents.map(file=><li key={file.id}><a className="file-folder" href={`/api/file-shares?token=${encodeURIComponent(token)}&id=${encodeURIComponent(file.id)}`}><b>{file.name}</b><small>{Math.round(file.size/1024)} Ko · Télécharger</small></a></li>)}</ul>{!data.documents.length&&<p>Ces fichiers ne sont plus disponibles.</p>}</>}</main>
}
