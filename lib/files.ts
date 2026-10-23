import type {Data,RecordItem} from './model';
import {operationsFrom} from './project-operations';

/** The system folders of a project (same list as the reference). System folders cannot be moved or deleted. */
export const systemFolders=['Bons de commande','Contrats','Demandes de soumission','Dépenses','Factures','Journal','Ordres de changement','Partagé avec le client','Rapports de construction','Soumissions'] as const;
export type SystemFolder=typeof systemFolders[number];
export type FileEntry={id:string;name:string;folder:string;kind:'upload'|'document';recordId:string;updated:string;author:string;type:string;sharedWithClient:boolean;sharedWithTeam:boolean;href?:string;movable:boolean};

const guess=(d:Data):string=>{
 const f=String(d.folder||'');if(f&&f.length<=180)return f;
 const text=`${d.category||''} ${d.name||''} ${d.caption||''}`.toLowerCase();
 if(/contrat/.test(text))return 'Contrats';if(/journal/.test(text))return 'Journal';if(/facture|invoice/.test(text))return 'Factures';if(/soumission|devis|quote/.test(text))return 'Soumissions';if(/bon de commande|\bbc-|purchase/.test(text))return 'Bons de commande';if(/reçu|recu|dépense|depense|receipt/.test(text))return 'Dépenses';if(/rapport/.test(text))return 'Rapports de construction';
 return 'Autres fichiers';
};
/** Files of one project: uploaded documents plus the business documents the app generates as PDF. */
export function projectFiles(project:RecordItem,records:RecordItem[]):FileEntry[]{
 const own=records.filter(r=>r.project_id===project.id);
 const out:FileEntry[]=[];
 for(const doc of own.filter(r=>r.kind==='document'))out.push({id:doc.id,name:String(doc.data.name||'Fichier'),folder:guess(doc.data),kind:'upload',recordId:doc.id,updated:doc.updated_at,author:String(doc.data.uploaded_by_name||doc.data.uploaded_by||doc.data.author||'Téléverseur inconnu'),type:String(doc.data.mime||'').split('/').pop()||'fichier',sharedWithClient:doc.data.visibility==='client',sharedWithTeam:doc.data.shared_with_team!==false,href:`/api/documents?id=${doc.id}`,movable:true});
 const generated:[string,SystemFolder][]=[['quote','Soumissions'],['invoice','Factures'],['expense','Dépenses'],['contract','Contrats']];
 for(const r of own){const pair=generated.find(([k])=>k===r.kind);if(!pair)continue;const folder:SystemFolder=r.kind==='quote'&&r.data.document_type==='change_order'?'Ordres de changement':pair[1];out.push({id:'doc:'+r.id,name:`${String(r.data.number||r.data.title||r.kind)}.pdf`,folder,kind:'document',recordId:r.id,updated:r.updated_at,author:'MG Pro (document généré)',type:'pdf',href:['quote','invoice','contract'].includes(r.kind)?`/api/pdf?id=${r.id}`:undefined,sharedWithClient:!['Brouillon','Validé'].includes(String(r.data.status||'Brouillon'))&&r.kind!=='expense',sharedWithTeam:true,movable:false})}
 const ops=operationsFrom(project.data.operations);
 for(const o of ops.purchaseOrders)out.push({id:'po:'+o.id,name:`Bon ${o.reference||o.title}`,folder:'Bons de commande',kind:'document',recordId:project.id,updated:project.updated_at,author:'MG Pro (document généré)',type:'fiche',sharedWithClient:false,sharedWithTeam:true,movable:false});
 for(const q of ops.priceRequests)out.push({id:'rq:'+q.id,name:`Demande de prix ${q.scope}`,folder:'Demandes de soumission',kind:'document',recordId:project.id,updated:project.updated_at,author:'MG Pro (document généré)',type:'fiche',sharedWithClient:false,sharedWithTeam:true,movable:false});
 for(const l of ops.dailyLogs)out.push({id:'log:'+l.id,name:`Journal ${l.date}`,folder:'Journal',kind:'document',recordId:project.id,updated:project.updated_at,author:'Équipe',type:'journal',sharedWithClient:l.sharedWithClient===true,sharedWithTeam:true,movable:false});
 for(const rep of (Array.isArray(project.data.construction_reports)?project.data.construction_reports:[]) as Data[])out.push({id:'rep:'+rep.id,name:String(rep.title||'Rapport'),folder:'Rapports de construction',kind:'document',recordId:project.id,updated:String(rep.date||project.updated_at),author:'Équipe',type:'rapport',sharedWithClient:rep.published===true,sharedWithTeam:true,movable:false});
 return out;
}
/** Content of a folder; "Partagé avec le client" lists everything visible to the client, wherever it is filed. */
export function folderContent(files:FileEntry[],folder:string){return folder==='Partagé avec le client'?files.filter(f=>f.sharedWithClient):files.filter(f=>f.folder===folder)}

/** Custom folder keys are project-local; folder membership never changes document visibility. */
export function customFolders(project:RecordItem):string[]{
 return Array.isArray(project.data.file_folders)?project.data.file_folders.filter((v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=180):[];
}
export function folderNameError(name:string,existing:readonly string[]):string{
 const value=name.trim();
 if(!value||value.length>80||/[\\/\x00-\x1f]/.test(value))return 'Utilisez un nom de 1 à 80 caractères, sans barre oblique.';
 if(existing.some(n=>n.toLocaleLowerCase('fr')===value.toLocaleLowerCase('fr')))return 'Un dossier porte déjà ce nom.';
 return '';
}
export function sortedFiles(files:FileEntry[],key:'name'|'updated'|'author'|'type',direction:1|-1){
 return [...files].sort((a,b)=>direction*(a[key].localeCompare(b[key],'fr',{numeric:true,sensitivity:'base'})||a.id.localeCompare(b.id)));
}
