import type {RecordItem} from './model';
export type HistoryEvent={id:string;recordId:string;kind:string;title:string;action:string;label?:string;family?:string;date:string;read:boolean};
/** The operations calendar is Montréal-local, including around UTC midnight and DST. */
export function historyDay(value:string){const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Montreal',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
export function filterHistory(rows:HistoryEvent[],records:RecordItem[],filters:{unread:boolean;query:string;kind:string;action:string;project:string;from:string;to:string}){
 const index=new Map(records.map(r=>[r.id,r]));const query=filters.query.trim().toLocaleLowerCase('fr');
 return rows.filter(event=>{const record=index.get(event.recordId),projectId=record?.kind==='project'?record.id:record?.project_id;const project=projectId?index.get(projectId):undefined;const day=historyDay(event.date);return (!filters.unread||!event.read)&&(!filters.kind||event.kind===filters.kind)&&(!filters.action||event.action===filters.action)&&(!filters.project||projectId===filters.project)&&(!filters.from||Boolean(day)&&day>=filters.from)&&(!filters.to||Boolean(day)&&day<=filters.to)&&[event.title,event.label||'',project?.data.title||'',project?.data.number||''].join(' ').toLocaleLowerCase('fr').includes(query)}).sort((a,b)=>b.date.localeCompare(a.date));
}
export function groupHistory(rows:HistoryEvent[]){const groups=new Map<string,HistoryEvent[]>();for(const row of rows){const day=historyDay(row.date);groups.set(day,[...(groups.get(day)||[]),row])}return [...groups].map(([day,events])=>({day,events}))}
