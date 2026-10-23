import {z} from 'zod';
import type {Profile,RecordItem} from './model';
import {operationsFrom} from './project-operations';
export const weekDays=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const teamPreferenceSchema=z.object({phone:z.string().max(40).default(''),job:z.string().max(120).default(''),autoAssign:z.boolean().default(false),smsRequested:z.boolean().default(false),days:z.array(z.object({enabled:z.boolean(),start:time,end:time})).length(7).refine(days=>days.every(d=>!d.enabled||d.end>d.start),'La fin doit suivre le début pour chaque journée.'),rates:z.array(z.object({name:z.string().trim().min(1).max(100),cost:z.number().finite().min(0).max(100000),billable:z.number().finite().min(0).max(100000)})).min(1).max(30)});
export type TeamPreference=z.infer<typeof teamPreferenceSchema>;
export type TeamPreferences=Record<string,TeamPreference>;
export type TeamMember=Profile&{active?:boolean};
export function emptyTeamPreference():TeamPreference{return {phone:'',job:'',autoAssign:false,smsRequested:false,days:weekDays.map((_,i)=>({enabled:i<5,start:'07:30',end:'16:00'})),rates:[{name:'Général',cost:0,billable:0}]}}
export function teamPreferences(value:unknown):TeamPreferences{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const result:TeamPreferences={};for(const [id,item] of Object.entries(value)){if(!z.uuid().safeParse(id).success)continue;const parsed=teamPreferenceSchema.safeParse(item);if(parsed.success)result[id]=parsed.data}return result;
}
export function filterTeam(users:TeamMember[],preferences:TeamPreferences,query='',role='all',archived=false){const q=query.trim().toLocaleLowerCase('fr');return users.filter(u=>(u.active===false)===archived&&(role==='all'||u.role===role)&&[u.name,u.email,preferences[u.id]?.phone,preferences[u.id]?.job].join(' ').toLocaleLowerCase('fr').includes(q))}
export function autoAssignedMembers(users:TeamMember[],preferences:TeamPreferences){return users.filter(u=>u.role==='worker'&&u.active!==false&&preferences[u.id]?.autoAssign).map(u=>u.id)}
export function memberTimesheets(projects:RecordItem[],id:string){return projects.flatMap(project=>operationsFrom(project.data.operations).timesheets.filter(s=>s.personId===id).map(s=>({...s,projectId:project.id,project:String(project.data.title||'Projet')}))).sort((a,b)=>b.date.localeCompare(a.date))}
export function teamRate(preferences:TeamPreferences,id:string,projectType:string){const rates=preferences[id]?.rates||[];return rates.find(r=>r.name===projectType)?.cost??rates.find(r=>r.name==='Général')?.cost??0}
export function csvCell(value:unknown){const text=String(value??'');return '"'+(/^[\s]*[=+@-]/.test(text)?"'"+text:text).replaceAll('"','""')+'"'}
export function memberExport(member:TeamMember,preference:TeamPreference,projects:RecordItem[]){return '\uFEFF'+[['Nom','Courriel','Téléphone','Emploi','Projet','Date','Début','Fin','Heures','Statut'],...memberTimesheets(projects,member.id).map(s=>[member.name,member.email,preference.phone,preference.job,s.project,s.date,s.start,s.end,s.hours,s.status])].map(row=>row.map(csvCell).join(';')).join('\r\n')}
export const memberProfilePatch=z.object({action:z.literal('profile'),id:z.uuid(),name:z.string().trim().min(2).max(120)}).strict();
export const memberActivePatch=z.object({id:z.uuid(),active:z.boolean()}).strict();
export const membershipPatch=z.object({action:z.literal('membership'),project_id:z.uuid(),user_id:z.uuid(),remove:z.boolean().optional()}).strict();
