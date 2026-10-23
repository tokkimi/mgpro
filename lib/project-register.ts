import type {RecordItem} from './model';

export const projectDateFields=[['created','Date de création'],['quoteSent','Date d’envoi de la dernière soumission'],['quoteSigned','Date de signature de la dernière soumission'],['start','Date de début des travaux'],['completed','Date de complétion'],['end','Échéance MG Pro']] as const;
export type ProjectDateKey=typeof projectDateFields[number][0];

/** Instants are displayed in the business timezone; civil dates never change day. */
export function projectCivilDate(value:unknown){
 const text=String(value||'');
 if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;
 const date=new Date(text);
 return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Montreal',year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'';
}
export function projectTags(project:RecordItem):string[]{
 const value=project.data.tags;
 return [...new Set((Array.isArray(value)?value:[project.data.tag]).filter((v):v is string=>typeof v==='string'&&!!v.trim()).map(v=>v.trim()))];
}
export function projectMilestones(project:RecordItem,quotes:RecordItem[]){
 const related=quotes.filter(q=>q.kind==='quote'&&q.project_id===project.id&&!q.data.deleted_at&&q.data.status!=='Annulée');
 const latest=(key:string)=>related.map(q=>String(q.data[key]||'')).filter(Boolean).sort().at(-1);
 return {created:projectCivilDate(project.created_at),quoteSent:projectCivilDate(latest('sent_at')),quoteSigned:projectCivilDate(latest('signed_at')),start:projectCivilDate(project.data.start),completed:projectCivilDate(project.data.completed_at),end:projectCivilDate(project.data.end)};
}
